import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

let cachedSuffixes: string[] | null = null;

async function getTacticalSuffixes(): Promise<string[]> {
  if (!cachedSuffixes) {
    const rows = await prisma.tacticalSuffix.findMany({ select: { suffix: true } });
    cachedSuffixes = rows.map((r) => r.suffix);
  }
  return cachedSuffixes;
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

  if (!q) return NextResponse.json([]);

  const LIMIT = 1000;

  if (mode === "prefix") {
    const ALL_MAGIC = await getTacticalSuffixes();
    const suffixOR = ALL_MAGIC.length > 0
      ? ALL_MAGIC.map(s => ({ word: { endsWith: s, mode: "insensitive" as const } }))
      : undefined;

    const baseWhere = {
      isActive: true,
      isVerified: { not: "rejected" },
      word: { startsWith: q, mode: "insensitive" as const },
    };

    const [totalCount, strategicResults] = await Promise.all([
      prisma.word.count({ where: baseWhere }),
      prisma.word.findMany({
        where: { ...baseWhere, OR: suffixOR },
        select: { id: true, word: true, isVerified: true },
        take: LIMIT,
        orderBy: { word: "asc" },
      }),
    ]);

    let results = strategicResults;

    if (results.length < LIMIT) {
      const otherResults = await prisma.word.findMany({
        where: {
          ...baseWhere,
          NOT: suffixOR,
        },
        select: { id: true, word: true, isVerified: true },
        take: LIMIT - results.length,
        orderBy: { word: "asc" },
      });
      results = [...results, ...otherResults];
    }

    return NextResponse.json({ results, totalCount, hasMore: totalCount > LIMIT });
  }

  // Suffix mode (or fallback) remains original — just alphabetical
  const whereClause = {
    isActive: true,
    isVerified: { not: "rejected" },
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
