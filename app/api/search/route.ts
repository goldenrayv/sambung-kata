import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// --- Module-level caches to avoid repeated DB round-trips on every search ---
const suffixCache = { data: null as string[] | null, ts: 0 };
const SUFFIX_TTL = 5 * 60 * 1000; // 5 min

async function getTacticalSuffixes(): Promise<string[]> {
  if (suffixCache.data && Date.now() - suffixCache.ts < SUFFIX_TTL) {
    return suffixCache.data;
  }
  const rows = await prisma.tacticalSuffix.findMany({ select: { suffix: true } });
  suffixCache.data = rows.map((r) => r.suffix);
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
      ];
    } else if (prefixQ) {
      baseWhere.word = { startsWith: prefixQ, mode: "insensitive" as const };
    } else {
      baseWhere.word = { endsWith: suffixQ, mode: "insensitive" as const };
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
      word: { startsWith: q, mode: "insensitive" as const },
    };

    // Fetch strategic results + one extra to detect hasMore without a count query
    const strategicResults = await prisma.word.findMany({
      where: { ...baseWhere, OR: suffixOR },
      select: { id: true, word: true, isVerified: true },
      orderBy: { word: "asc" },
    });

    let results = strategicResults;

    // Fill remaining slots (up to LIMIT+1) with non-tactical-suffix words
    const remaining = LIMIT + 1 - results.length;
    if (remaining > 0) {
      const otherResults = await prisma.word.findMany({
        where: { ...baseWhere, NOT: suffixOR },
        select: { id: true, word: true, isVerified: true },
        take: remaining,
        orderBy: { word: "asc" },
      });
      results = [...results, ...otherResults];
    }

    const hasMore = results.length > LIMIT;
    if (hasMore) results = results.slice(0, LIMIT);

    return NextResponse.json({ results, totalCount: results.length, hasMore });
  }

  // Suffix mode — fetch LIMIT+1 to detect hasMore without a count query
  const whereClause = {
    isActive: true,
    isVerified: statusFilter === "testing" ? "unverified" : { not: "rejected" },
    word: mode === "suffix"
      ? { endsWith: q, mode: "insensitive" as const }
      : { contains: q, mode: "insensitive" as const }
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
