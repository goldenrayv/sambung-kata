import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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
    // 1. Fetch dynamic tactical suffixes
    const tacticalSuffixes = await prisma.tacticalSuffix.findMany({
      select: { suffix: true }
    });
    const ALL_MAGIC = tacticalSuffixes.map(ts => ts.suffix);

    // 2. Fetch Strategic Words (Ending in dynamic tactical suffixes)
    const strategicResults = await prisma.word.findMany({
      where: {
        isActive: true,
        isVerified: { not: "rejected" },
        word: { startsWith: q, mode: "insensitive" },
        OR: ALL_MAGIC.length > 0 ? ALL_MAGIC.map(s => ({
          word: { endsWith: s, mode: "insensitive" }
        })) : undefined
      },
      select: { id: true, word: true, isVerified: true },
      take: LIMIT,
      orderBy: { word: "asc" },
    });

    let results = strategicResults;

    // 3. If we have space, fill with Other words
    if (results.length < LIMIT) {
      const remaining = LIMIT - results.length;
      const otherResults = await prisma.word.findMany({
        where: {
          isActive: true,
          isVerified: { not: "rejected" },
          word: { startsWith: q, mode: "insensitive" },
          NOT: ALL_MAGIC.length > 0 ? ALL_MAGIC.map(s => ({
            word: { endsWith: s, mode: "insensitive" }
          })) : undefined
        },
        select: { id: true, word: true, isVerified: true },
        take: remaining,
        orderBy: { word: "asc" },
      });
      results = [...results, ...otherResults];
    }

    return NextResponse.json(results);
  }

  // Suffix mode (or fallback) remains original — just alphabetical
  const results = await prisma.word.findMany({
    where: {
      isActive: true,
      isVerified: { not: "rejected" },
      word: mode === "suffix"
        ? { endsWith: q, mode: "insensitive" }
        : { contains: q, mode: "insensitive" }
    },
    select: { id: true, word: true, isVerified: true },
    take: LIMIT,
    orderBy: { word: "asc" },
  });

  return NextResponse.json(results);
}
