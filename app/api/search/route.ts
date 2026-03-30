import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

async function getTacticalSuffixes(): Promise<string[]> {
  const rows = await prisma.tacticalSuffix.findMany({ select: { suffix: true } });
  return rows.map((r) => r.suffix);
}

export async function GET(req: Request) {
  // --- Auth: validate the userId ---
  const auth = req.headers.get("Authorization") ?? "";
  const userId = auth.startsWith("Bearer ") ? auth.slice(7) : "";

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user || user.expiresAt < new Date()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // --- Search ---
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") ?? "").trim();
  const mode = searchParams.get("mode") ?? "prefix";
  const statusFilter = searchParams.get("status");

  if (!q) return NextResponse.json([]);

  const LIMIT = 1000;

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

    const [totalCount, strategicResults] = await Promise.all([
      prisma.word.count({ where: baseWhere }),
      prisma.word.findMany({
        where: { ...baseWhere, OR: suffixOR },
        select: { id: true, word: true, isVerified: true },
        // No take limit here — ALL tactical suffix matches come first
        orderBy: { word: "asc" },
      }),
    ]);

    let results = strategicResults;

    // Fill remaining slots (up to LIMIT) with non-tactical-suffix words
    const remaining = LIMIT - results.length;
    if (remaining > 0) {
      const otherResults = await prisma.word.findMany({
        where: {
          ...baseWhere,
          NOT: suffixOR,
        },
        select: { id: true, word: true, isVerified: true },
        take: remaining,
        orderBy: { word: "asc" },
      });
      results = [...results, ...otherResults];
    }

    return NextResponse.json({ results, totalCount, hasMore: totalCount > LIMIT });
  }

  // Suffix mode (or fallback) remains original — just alphabetical
  const whereClause = {
    isActive: true,
    isVerified: statusFilter === "testing" ? "unverified" : { not: "rejected" },
    word: mode === "suffix"
      ? { endsWith: q, mode: "insensitive" as const }
      : { contains: q, mode: "insensitive" as const }
  };

  const [results, totalCount] = await Promise.all([
    prisma.word.findMany({
      where: whereClause,
      select: { id: true, word: true, isVerified: true },
      take: LIMIT,
      orderBy: { word: "asc" },
    }),
    prisma.word.count({ where: whereClause })
  ]);

  return NextResponse.json({
    results,
    totalCount,
    hasMore: totalCount > LIMIT
  });
}
