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

  // --- Analytics Logic ---
  try {
    const words = await prisma.word.findMany({
      where: { isActive: true },
      select: { word: true },
    });

    const wordList = words.map(w => w.word.toUpperCase());
    
    const prefixCounts: Record<string, number> = {};
    const suffixCounts: Record<string, number> = {};

    wordList.forEach(word => {
        for (let i = 1; i <= 3; i++) {
            if (word.length >= i) {
                const p = word.slice(0, i);
                prefixCounts[p] = (prefixCounts[p] || 0) + 1;
                const s = word.slice(-i);
                suffixCounts[s] = (suffixCounts[s] || 0) + 1;
            }
        }
    });

    // Hardcoded Tactical Suffixes (Target list)
    const TACTICAL_LIST = [
        "Q", "X", "Y", "Z", "V",
        "AH", "AI", "AZ", "OX", "AX", "EX", "KS", "IA", "IF", "IR", "OI", "CY", "OH", "OO",
        "ILO", "NDO", "NDA", "TIF"
    ];

    const calculateTop = (length: number) => {
        return Object.entries(suffixCounts)
            .filter(([suffix, count]) => {
                if (suffix.length !== length) return false;
                
                const isTactical = TACTICAL_LIST.includes(suffix.toUpperCase());
                if (isTactical) return true; // Tactical ones always pass threshold if they exist

                // General thresholds
                if (length === 1) return count >= 20;
                if (length === 2) return count >= 10;
                return count >= 5;
            })
            .map(([suffix, sCount]) => {
                const pCount = prefixCounts[suffix] || 0;
                const ratio = ((1 - (pCount / sCount)) * 100);
                return {
                    suffix,
                    suffixCount: sCount,
                    prefixCount: pCount,
                    ratio: Math.round(ratio * 10) / 10,
                };
            })
            .filter(r => r.ratio > 0 || TACTICAL_LIST.includes(r.suffix.toUpperCase()))
            .sort((a, b) => {
                const aTactical = TACTICAL_LIST.includes(a.suffix.toUpperCase());
                const bTactical = TACTICAL_LIST.includes(b.suffix.toUpperCase());
                
                if (aTactical && !bTactical) return -1;
                if (!aTactical && bTactical) return 1;
                
                return b.ratio - a.ratio || b.suffixCount - a.suffixCount;
            });
            // Removed slice(0, 10) to let frontend decide what to show
    };

    return NextResponse.json({
        top1: calculateTop(1),
        top2: calculateTop(2),
        top3: calculateTop(3),
    });
  } catch (error) {
    console.error("Ratio analytics failed:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
