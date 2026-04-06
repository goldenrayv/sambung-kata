import { prisma } from "@/lib/prisma";
import { BarChart2, ShieldCheck } from "lucide-react";
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

async function getSuffixCoverage() {
  const tacticalSuffixes = await (prisma as any).tacticalSuffix.findMany({ orderBy: { suffix: "asc" } });
  const rows = await Promise.all(
    tacticalSuffixes.map(async (ts: any) => {
      const [total, verified] = await Promise.all([
        (prisma as any).word.count({ where: { isVerified: { not: "rejected" }, word: { endsWith: ts.suffix, mode: "insensitive" } } }),
        (prisma as any).word.count({ where: { isVerified: "verified", word: { endsWith: ts.suffix, mode: "insensitive" } } }),
      ]);
      return { suffix: ts.suffix, total, verified, unverified: total - verified };
    })
  );
  return rows.sort((a: any, b: any) => b.total - a.total);
}

export default async function ComboAnalysisPage() {
  const words = await prisma.word.findMany({
    where: { isVerified: { not: "rejected" } },
    select: { word: true },
  });

  const [data, coverageData] = await Promise.all([
    Promise.resolve(computeCombos(words.map((w) => w.word))),
    getSuffixCoverage(),
  ]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black bg-gradient-to-r from-rose-400 to-orange-400 text-transparent bg-clip-text tracking-tighter uppercase flex items-center gap-3">
          <BarChart2 className="w-8 h-8 text-rose-500" />
          Combo Analysis
        </h1>
        <div className="text-[9px] font-black text-white/50 tracking-[0.2em] uppercase bg-white/5 px-2 py-0.5 rounded border border-white/5">
          {words.length.toLocaleString()} words analysed
        </div>
      </div>

      {/* Suffix Coverage Stats */}
      <div className="bg-neutral-950 border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
        <div className="px-6 py-5 border-b border-white/5 flex items-center gap-3">
          <ShieldCheck className="w-5 h-5 text-sky-400" />
          <div>
            <h2 className="text-sm font-black text-white uppercase tracking-widest mb-0.5">Tactical Suffix Coverage</h2>
            <p className="text-xs text-white/50">Verified vs unverified word count for each tactical suffix.</p>
          </div>
        </div>
        <div className="p-6">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[9px] font-black text-white/30 uppercase tracking-widest border-b border-white/5">
                <th className="text-left pb-3">Suffix</th>
                <th className="text-right pb-3">Total</th>
                <th className="text-right pb-3">Verified</th>
                <th className="text-right pb-3">Unverified</th>
                <th className="text-right pb-3">Coverage</th>
                <th className="pb-3 pl-4">Bar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {coverageData.map((row: any) => {
                const pct = row.total > 0 ? Math.round((row.verified / row.total) * 100) : 0;
                return (
                  <tr key={row.suffix} className="text-[11px] font-bold">
                    <td className="py-3 font-mono text-sky-400 font-black">-{row.suffix}</td>
                    <td className="py-3 text-right text-white/70">{row.total.toLocaleString()}</td>
                    <td className="py-3 text-right text-emerald-400">{row.verified.toLocaleString()}</td>
                    <td className="py-3 text-right text-orange-400">{row.unverified.toLocaleString()}</td>
                    <td className={`py-3 text-right font-black ${pct >= 80 ? "text-emerald-400" : pct >= 50 ? "text-orange-400" : "text-rose-400"}`}>{pct}%</td>
                    <td className="py-3 pl-4 w-32">
                      <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                        <div className={`h-full rounded-full ${pct >= 80 ? "bg-emerald-500" : pct >= 50 ? "bg-orange-500" : "bg-rose-500"}`} style={{ width: `${pct}%` }} />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
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
