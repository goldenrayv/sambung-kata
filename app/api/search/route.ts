import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const suffixCache = { data: null as string[] | null, ts: 0 };
async function getTacticalSuffixes(): Promise<string[]> {
  if (suffixCache.data && Date.now() - suffixCache.ts < 5 * 60 * 1000) return suffixCache.data;
  const rows = await prisma.tacticalSuffix.findMany({ select: { suffix: true } });
  suffixCache.data = rows.map(r => r.suffix);
  suffixCache.ts = Date.now();
  return suffixCache.data;
}

const userCache = new Map<string, { expiresAt: Date; cachedAt: number }>();
const USER_TTL = 60 * 1000; // 1 min

async function getValidUser(userId: string) {
  const cached = userCache.get(userId);
  if (cached && Date.now() - cached.cachedAt < USER_TTL) {
    return cached.expiresAt > new Date() ? cached : null;
  }
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { expiresAt: true } });
  if (user) userCache.set(userId, { expiresAt: user.expiresAt, cachedAt: Date.now() });
  return user;
}

type WordRow = { id: string; word: string; isVerified: string };

function reverseStr(s: string): string {
  return s.split("").reverse().join("");
}

export async function GET(req: Request) {
  // --- Auth: validate the userId ---
  const auth = req.headers.get("Authorization") ?? "";
  const userId = auth.startsWith("Bearer ") ? auth.slice(7) : "";

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await getValidUser(userId);

  if (!user || user.expiresAt < new Date()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // --- Search ---
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") ?? "").trim().toUpperCase();
  const mode = searchParams.get("mode") ?? "prefix";
  const statusFilter = searchParams.get("status");

  const LIMIT = 2500;
  const verifiedClause = statusFilter === "testing"
    ? Prisma.sql`"isVerified" = 'unverified'`
    : Prisma.sql`"isVerified" <> 'rejected'`;

  // Sort directive — pushed into ORDER BY so LIMIT slices the right subset.
  const sortParam = searchParams.get("sort");
  const orderBy = sortParam === "short"
    ? Prisma.sql`LENGTH(word) ASC, word COLLATE "C" ASC`
    : sortParam === "long"
      ? Prisma.sql`LENGTH(word) DESC, word COLLATE "C" ASC`
      : Prisma.sql`word COLLATE "C" ASC`;

  // Combo mode: words starting with `prefix` AND ending with `suffix`
  if (mode === "combo") {
    const prefixQ = (searchParams.get("prefix") ?? "").trim().toUpperCase();
    const suffixQ = (searchParams.get("suffix") ?? "").trim().toUpperCase();

    if (!prefixQ && !suffixQ) return NextResponse.json({ results: [], totalCount: 0, hasMore: false });

    let filter: Prisma.Sql;
    if (prefixQ && suffixQ) {
      filter = Prisma.sql`word LIKE ${prefixQ + "%"} AND word_rev LIKE ${reverseStr(suffixQ) + "%"}`;
    } else if (prefixQ) {
      filter = Prisma.sql`word LIKE ${prefixQ + "%"}`;
    } else {
      filter = Prisma.sql`word_rev LIKE ${reverseStr(suffixQ) + "%"}`;
    }

    const rows = await prisma.$queryRaw<WordRow[]>`
      SELECT id, word, "isVerified" FROM "Word"
      WHERE "isActive" = true AND ${verifiedClause} AND ${filter}
      ORDER BY ${orderBy}
      LIMIT ${LIMIT + 1}
    `;

    const hasMore = rows.length > LIMIT;
    const finalResults = hasMore ? rows.slice(0, LIMIT) : rows;
    return NextResponse.json({ results: finalResults, totalCount: finalResults.length, hasMore });
  }

  if (!q) return NextResponse.json([]);

  if (mode === "prefix") {
    const trapMode = searchParams.get("trap") !== "off";

    // Trap OFF: plain prefix scan, no strategic-suffix priority.
    if (!trapMode) {
      const rows = await prisma.$queryRaw<WordRow[]>`
        SELECT id, word, "isVerified" FROM "Word"
        WHERE "isActive" = true AND ${verifiedClause} AND word LIKE ${q + "%"}
        ORDER BY ${orderBy}
        LIMIT ${LIMIT + 1}
      `;
      const hasMore = rows.length > LIMIT;
      const finalResults = hasMore ? rows.slice(0, LIMIT) : rows;
      return NextResponse.json({ results: finalResults, totalCount: finalResults.length, hasMore });
    }

    const ALL_MAGIC = await getTacticalSuffixes();
    const baseWhere = Prisma.sql`"isActive" = true AND ${verifiedClause} AND word LIKE ${q + "%"}`;

    let suffixOr: Prisma.Sql | null = null;
    if (ALL_MAGIC.length > 0) {
      const parts = ALL_MAGIC.map(s => Prisma.sql`word_rev LIKE ${reverseStr(s) + "%"}`);
      suffixOr = Prisma.sql`(${Prisma.join(parts, " OR ")})`;
    }

    // Run both queries in parallel: tactical-suffix words (no limit) + others (fill remaining)
    const [strategicRows, otherRows] = await Promise.all([
      suffixOr
        ? prisma.$queryRaw<WordRow[]>`
            SELECT id, word, "isVerified" FROM "Word"
            WHERE ${baseWhere} AND ${suffixOr}
            ORDER BY ${orderBy}
          `
        : Promise.resolve([] as WordRow[]),
      suffixOr
        ? prisma.$queryRaw<WordRow[]>`
            SELECT id, word, "isVerified" FROM "Word"
            WHERE ${baseWhere} AND NOT ${suffixOr}
            ORDER BY ${orderBy}
            LIMIT ${LIMIT + 1}
          `
        : prisma.$queryRaw<WordRow[]>`
            SELECT id, word, "isVerified" FROM "Word"
            WHERE ${baseWhere}
            ORDER BY ${orderBy}
            LIMIT ${LIMIT + 1}
          `,
    ]);

    const remaining = LIMIT - strategicRows.length;
    let results: WordRow[];
    let hasMore: boolean;

    if (remaining <= 0) {
      results = strategicRows.slice(0, LIMIT);
      hasMore = strategicRows.length > LIMIT;
    } else {
      hasMore = otherRows.length > remaining;
      results = [...strategicRows, ...(hasMore ? otherRows.slice(0, remaining) : otherRows)];
    }

    return NextResponse.json({ results, totalCount: results.length, hasMore });
  }

  // Suffix mode hits word_rev_idx; contains falls back to scan (not exposed in UI).
  const filter: Prisma.Sql = mode === "suffix"
    ? Prisma.sql`word_rev LIKE ${reverseStr(q) + "%"}`
    : Prisma.sql`word LIKE ${"%" + q + "%"}`;

  const results = await prisma.$queryRaw<WordRow[]>`
    SELECT id, word, "isVerified" FROM "Word"
    WHERE "isActive" = true AND ${verifiedClause} AND ${filter}
    ORDER BY ${orderBy}
    LIMIT ${LIMIT + 1}
  `;

  const hasMore = results.length > LIMIT;
  const finalResults = hasMore ? results.slice(0, LIMIT) : results;

  return NextResponse.json({
    results: finalResults,
    totalCount: finalResults.length,
    hasMore,
  });
}
