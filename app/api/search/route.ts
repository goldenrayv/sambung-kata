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
  const mode = searchParams.get("mode") ?? "contains";

  if (!q) return NextResponse.json([]);

  // Build the Prisma where clause.
  // Use Prisma's `mode: "insensitive"` for case-insensitive search.
  const textFilter: {
    startsWith?: string;
    endsWith?: string;
    contains?: string;
    mode?: "insensitive";
  } = {};

  // Handle search query with uppercase normalization
  if (mode === "prefix") {
    textFilter.startsWith = q;
  } else if (mode === "suffix") {
    textFilter.endsWith = q;
  } else {
    textFilter.contains = q;
  }
  textFilter.mode = "insensitive"; // Apply case-insensitive mode

  const results = await prisma.word.findMany({
    where: { isActive: true, word: textFilter },
    select: { word: true },
    take: 100,
    orderBy: { word: "asc" },
  });

  return NextResponse.json(results.map((r) => r.word));
}
