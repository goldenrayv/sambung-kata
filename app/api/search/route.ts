import { NextResponse } from "next/server";
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

  // Combo mode: words starting with `prefix` AND ending with `suffix`
  if (mode === "combo") {
    const prefixQ = (searchParams.get("prefix") ?? "").trim().toUpperCase();
    const suffixQ = (searchParams.get("suffix") ?? "").trim().toUpperCase();

    if (!prefixQ && !suffixQ) return NextResponse.json({ results: [], totalCount: 0, hasMore: false });

    const baseWhere: any = {
      isActive: true,
      isVerified: statusFilter === "testing" ? "unverified" : { not: "rejected" },
    };

    if (prefixQ && suffixQ) {
      baseWhere.AND = [
        { word: { startsWith: prefixQ, mode: "insensitive" as const } },
        { word: { endsWith: suffixQ, mode: "insensitive" as const } },
        { word: { not: { equals: prefixQ + suffixQ, mode: "insensitive" as const } } },
      ];
    } else if (prefixQ) {
      baseWhere.AND = [
        { word: { startsWith: prefixQ, mode: "insensitive" as const } },
        { word: { not: { equals: prefixQ, mode: "insensitive" as const } } },
      ];
    } else {
      baseWhere.AND = [
        { word: { endsWith: suffixQ, mode: "insensitive" as const } },
        { word: { not: { equals: suffixQ, mode: "insensitive" as const } } },
      ];
    }

    const rows = await prisma.word.findMany({
      where: baseWhere,
      select: { id: true, word: true, isVerified: true },
      take: LIMIT + 1,
      orderBy: { word: "asc" },
    });

    const hasMore = rows.length > LIMIT;
    const finalResults = hasMore ? rows.slice(0, LIMIT) : rows;
    return NextResponse.json({ results: finalResults, totalCount: finalResults.length, hasMore });
  }

  if (!q) return NextResponse.json([]);

  if (mode === "prefix") {
    const ALL_MAGIC = await getTacticalSuffixes();
    const suffixOR = ALL_MAGIC.length > 0
      ? ALL_MAGIC.map(s => ({ word: { endsWith: s, mode: "insensitive" as const } }))
      : undefined;

    const baseWhere = {
      isActive: true,
      isVerified: statusFilter === "testing" ? "unverified" : { not: "rejected" },
      word: { startsWith: q, mode: "insensitive" as const, not: { equals: q, mode: "insensitive" as const } },
    };

    // Run both queries in parallel: tactical-suffix words (no limit) + others (fill remaining)
    const [strategicRows, otherRows] = await Promise.all([
      prisma.word.findMany({
        where: suffixOR ? { ...baseWhere, OR: suffixOR } : baseWhere,
        select: { id: true, word: true, isVerified: true },
        orderBy: { word: "asc" },
      }),
      suffixOR
        ? prisma.word.findMany({
            where: { ...baseWhere, NOT: suffixOR },
            select: { id: true, word: true, isVerified: true },
            take: LIMIT + 1,
            orderBy: { word: "asc" },
          })
        : Promise.resolve([] as { id: string; word: string; isVerified: string }[]),
    ]);

    const remaining = LIMIT - strategicRows.length;
    let results: typeof strategicRows;
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

  // Suffix mode — fetch LIMIT+1 to detect hasMore without a count query
  const whereClause = {
    isActive: true,
    isVerified: statusFilter === "testing" ? "unverified" : { not: "rejected" },
    word: mode === "suffix"
      ? { endsWith: q, mode: "insensitive" as const, not: { equals: q, mode: "insensitive" as const } }
      : { contains: q, mode: "insensitive" as const, not: { equals: q, mode: "insensitive" as const } }
  };

  const results = await prisma.word.findMany({
    where: whereClause,
    select: { id: true, word: true, isVerified: true },
    take: LIMIT + 1,
    orderBy: { word: "asc" },
  });

  const hasMore = results.length > LIMIT;
  const finalResults = hasMore ? results.slice(0, LIMIT) : results;

  return NextResponse.json({
    results: finalResults,
    totalCount: finalResults.length,
    hasMore,
  });
}
