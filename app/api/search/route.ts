import { NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function GET(req: Request) {
  // --- Auth: validate the bearer token ---
  const auth = req.headers.get("Authorization") ?? "";
  const rawToken = auth.startsWith("Bearer ") ? auth.slice(7) : "";

  if (!rawToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { token: hashToken(rawToken) },
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
    // Strategic Suffixes
    const MAGIC_1 = ["Q", "X", "Y", "Z", "V"];
    const MAGIC_2 = ["AH", "AI", "AZ", "OX", "AX", "EX", "KS", "IA", "IF", "IR", "OI", "OH", "EA", "OA"];
    const MAGIC_3 = ["ILO", "NDO", "NDA", "TIF", "NEA"];
    const HARDCODED = ["CY", "LY", "GY", "OO", "SEA", "RD", "RS", "EI"];
    const ALL_MAGIC = [...MAGIC_1, ...MAGIC_2, ...MAGIC_3, ...HARDCODED];

    // 1. Fetch Strategic Words (Ending in Magic/Hardcoded suffixes)
    const strategicResults = await prisma.word.findMany({
      where: {
        isActive: true,
        word: { startsWith: q, mode: "insensitive" },
        OR: ALL_MAGIC.map(s => ({
          word: { endsWith: s, mode: "insensitive" }
        }))
      },
      select: { word: true },
      take: LIMIT,
      orderBy: { word: "asc" },
    });

    let results = strategicResults.map(r => r.word);

    // 2. If we have space, fill with Other words
    if (results.length < LIMIT) {
      const remaining = LIMIT - results.length;
      const otherResults = await prisma.word.findMany({
        where: {
          isActive: true,
          word: { startsWith: q, mode: "insensitive" },
          NOT: ALL_MAGIC.map(s => ({
            word: { endsWith: s, mode: "insensitive" }
          }))
        },
        select: { word: true },
        take: remaining,
        orderBy: { word: "asc" },
      });
      results = [...results, ...otherResults.map(r => r.word)];
    }

    return NextResponse.json(results);
  }

  // Suffix mode (or fallback) remains original — just alphabetical
  const results = await prisma.word.findMany({
    where: { 
      isActive: true, 
      word: mode === "suffix" 
        ? { endsWith: q, mode: "insensitive" } 
        : { contains: q, mode: "insensitive" } 
    },
    select: { word: true },
    take: LIMIT,
    orderBy: { word: "asc" },
  });

  return NextResponse.json(results.map((r) => r.word));
}
