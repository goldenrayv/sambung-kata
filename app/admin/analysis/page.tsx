import { prisma } from "@/lib/prisma";
import { BarChart2 } from "lucide-react";
import ComboAnalysisTable, { type ComboRow } from "./ComboAnalysisTable";

export const dynamic = "force-dynamic";

function computeCombos(words: string[]): ComboRow[] {
  const prefixCount: Record<string, number> = {};
  const suffixCount: Record<string, number> = {};

  for (const word of words) {
    const w = word.toUpperCase();
    for (const len of [2, 3] as const) {
      if (w.length >= len) {
        const p = w.slice(0, len);
        const s = w.slice(-len);
        prefixCount[p] = (prefixCount[p] ?? 0) + 1;
        suffixCount[s] = (suffixCount[s] ?? 0) + 1;
      }
    }
  }

  const allCombos = new Set([...Object.keys(prefixCount), ...Object.keys(suffixCount)]);

  const rows: ComboRow[] = [];

  for (const combo of allCombos) {
    const len = combo.length as 2 | 3;
    const pc = prefixCount[combo] ?? 0;
    const sc = suffixCount[combo] ?? 0;
    const ratio = pc === 0 ? Infinity : sc / pc;
    const net = sc - pc;

    let strength: ComboRow["strength"];
    if (ratio >= 2) strength = "Strong";
    else if (ratio < 0.5) strength = "Weak";
    else strength = "Balanced";

    rows.push({ combo, len, prefixCount: pc, suffixCount: sc, ratio, net, strength });
  }

  // Default sort: ratio desc
  rows.sort((a, b) => {
    const ar = isFinite(a.ratio) ? a.ratio : 9999999;
    const br = isFinite(b.ratio) ? b.ratio : 9999999;
    return br - ar;
  });

  return rows;
}

export default async function ComboAnalysisPage() {
  const words = await prisma.word.findMany({
    where: { isVerified: { not: "rejected" } },
    select: { word: true },
  });

  const data = computeCombos(words.map((w) => w.word));

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black bg-gradient-to-r from-rose-400 to-orange-400 text-transparent bg-clip-text tracking-tighter uppercase flex items-center gap-3">
          <BarChart2 className="w-8 h-8 text-rose-500" />
          Combo Analysis
        </h1>
        <div className="text-[9px] font-black text-white/50 tracking-[0.2em] uppercase bg-white/5 px-2 py-0.5 rounded border border-white/5">
          {words.length.toLocaleString()} words analysed
        </div>
      </div>

      <div className="bg-neutral-950 border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
        <div className="px-6 py-5 border-b border-white/5">
          <h2 className="text-sm font-black text-white uppercase tracking-widest mb-1">
            Prefix vs Suffix Strength
          </h2>
          <p className="text-xs text-white/50 leading-relaxed">
            For each 2 and 3-letter combination, compare how many words{" "}
            <span className="text-sky-400 font-bold">start</span> with it (Starts With) vs how many{" "}
            <span className="text-orange-400 font-bold">end</span> with it (Ends With).
            A high ratio means the combo is hard to continue — making it a strong tactical suffix.
          </p>
        </div>

        <div className="p-6">
          <ComboAnalysisTable data={data} />
        </div>
      </div>
    </div>
  );
}
