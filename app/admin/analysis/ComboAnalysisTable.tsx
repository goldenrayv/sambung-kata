"use client";

import { useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";

export type ComboRow = {
  combo: string;
  len: 2 | 3;
  prefixCount: number;
  suffixCount: number;
  ratio: number;      // suffixCount / prefixCount (Infinity if prefixCount === 0)
  net: number;        // suffixCount - prefixCount
  strength: "Strong" | "Balanced" | "Weak";
};

type SortKey = keyof Pick<ComboRow, "combo" | "len" | "prefixCount" | "suffixCount" | "ratio" | "net">;
type SortDir = "asc" | "desc";

const STRENGTH_FILTER = ["All", "Strong", "Balanced", "Weak"] as const;
const LEN_FILTER = ["All", "2", "3"] as const;

function strengthBadge(s: ComboRow["strength"]) {
  if (s === "Strong")
    return (
      <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 font-black text-[10px] tracking-widest uppercase">
        Strong
      </Badge>
    );
  if (s === "Weak")
    return (
      <Badge className="bg-rose-500/10 text-rose-400 border-rose-500/20 font-black text-[10px] tracking-widest uppercase">
        Weak
      </Badge>
    );
  return (
    <Badge className="bg-white/5 text-white/50 border-white/10 font-black text-[10px] tracking-widest uppercase">
      Balanced
    </Badge>
  );
}

function SortIcon({ col, sortKey, sortDir }: { col: SortKey; sortKey: SortKey; sortDir: SortDir }) {
  if (col !== sortKey) return <ArrowUpDown className="w-3 h-3 opacity-30" />;
  return sortDir === "asc" ? <ArrowUp className="w-3 h-3 text-rose-400" /> : <ArrowDown className="w-3 h-3 text-rose-400" />;
}

export default function ComboAnalysisTable({ data }: { data: ComboRow[] }) {
  const [search, setSearch] = useState("");
  const [lenFilter, setLenFilter] = useState<(typeof LEN_FILTER)[number]>("All");
  const [strengthFilter, setStrengthFilter] = useState<(typeof STRENGTH_FILTER)[number]>("All");
  const [sortKey, setSortKey] = useState<SortKey>("ratio");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  function handleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("desc"); }
  }

  const filtered = useMemo(() => {
    let rows = data;

    if (search.trim())
      rows = rows.filter((r) => r.combo.includes(search.trim().toUpperCase()));

    if (lenFilter !== "All")
      rows = rows.filter((r) => r.len === Number(lenFilter));

    if (strengthFilter !== "All")
      rows = rows.filter((r) => r.strength === strengthFilter);

    rows = [...rows].sort((a, b) => {
      let av = a[sortKey] as number | string;
      let bv = b[sortKey] as number | string;
      // Treat Infinity consistently
      if (!isFinite(av as number)) av = 9999999;
      if (!isFinite(bv as number)) bv = 9999999;
      const cmp = av < bv ? -1 : av > bv ? 1 : 0;
      return sortDir === "asc" ? cmp : -cmp;
    });

    return rows;
  }, [data, search, lenFilter, strengthFilter, sortKey, sortDir]);

  const thClass =
    "px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-white/40 cursor-pointer hover:text-white/70 transition-colors select-none";
  const tdClass = "px-4 py-3 text-sm";

  function FilterBtn<T extends string>({
    options, value, onChange,
  }: { options: readonly T[]; value: T; onChange: (v: T) => void }) {
    return (
      <div className="flex gap-1">
        {options.map((o) => (
          <button
            key={o}
            onClick={() => onChange(o)}
            className={`px-3 py-1 rounded-lg text-[11px] font-black uppercase tracking-widest transition-all border ${
              value === o
                ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
                : "text-white/40 border-white/5 hover:text-white/70 hover:bg-white/5"
            }`}
          >
            {o}
          </button>
        ))}
      </div>
    );
  }

  const strongCount = data.filter((r) => r.strength === "Strong").length;
  const weakCount = data.filter((r) => r.strength === "Weak").length;

  return (
    <div className="space-y-4">
      {/* Summary pills */}
      <div className="flex gap-3 flex-wrap">
        <div className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/5 text-xs font-bold text-white/60">
          Total combos: <span className="text-white">{data.length.toLocaleString()}</span>
        </div>
        <div className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs font-bold text-emerald-400">
          Strong: {strongCount}
        </div>
        <div className="px-3 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs font-bold text-rose-400">
          Weak: {weakCount}
        </div>
        <div className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/5 text-xs font-bold text-white/50">
          Balanced: {data.length - strongCount - weakCount}
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4 flex-wrap items-center">
        <Input
          placeholder="Search combo…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-40 h-8 text-xs font-mono"
        />
        <FilterBtn options={LEN_FILTER} value={lenFilter} onChange={setLenFilter} />
        <FilterBtn options={STRENGTH_FILTER} value={strengthFilter} onChange={setStrengthFilter} />
        <span className="text-[11px] text-white/30 ml-auto">
          Showing {filtered.length.toLocaleString()} rows
        </span>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-white/5 overflow-hidden">
        <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
          <table className="w-full text-white">
            <thead className="bg-white/[0.02] sticky top-0 z-10 border-b border-white/5">
              <tr>
                {(
                  [
                    ["combo", "Combo"],
                    ["len", "Len"],
                    ["prefixCount", "Starts With"],
                    ["suffixCount", "Ends With"],
                    ["ratio", "Ratio"],
                    ["net", "Net Δ"],
                  ] as [SortKey, string][]
                ).map(([key, label]) => (
                  <th key={key} className={thClass} onClick={() => handleSort(key)}>
                    <span className="flex items-center gap-1">
                      {label}
                      <SortIcon col={key} sortKey={sortKey} sortDir={sortDir} />
                    </span>
                  </th>
                ))}
                <th className={thClass + " cursor-default"}>Strength</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.03]">
              {filtered.map((row) => (
                <tr key={`${row.len}-${row.combo}`} className="hover:bg-white/[0.02] transition-colors">
                  <td className={tdClass}>
                    <span className="font-mono font-black text-white text-sm tracking-widest">
                      {row.combo}
                    </span>
                  </td>
                  <td className={tdClass}>
                    <Badge className="bg-white/5 text-white/50 border-white/10 font-black text-[10px]">
                      {row.len}
                    </Badge>
                  </td>
                  <td className={tdClass}>
                    <span className="font-bold text-sky-400">{row.prefixCount.toLocaleString()}</span>
                  </td>
                  <td className={tdClass}>
                    <span className="font-bold text-orange-400">{row.suffixCount.toLocaleString()}</span>
                  </td>
                  <td className={tdClass}>
                    <span className="font-mono font-bold text-white/80">
                      {isFinite(row.ratio) ? row.ratio.toFixed(2) : "∞"}
                    </span>
                  </td>
                  <td className={tdClass}>
                    <span
                      className={`font-mono font-bold ${
                        row.net > 0 ? "text-emerald-400" : row.net < 0 ? "text-rose-400" : "text-white/40"
                      }`}
                    >
                      {row.net > 0 ? "+" : ""}
                      {row.net.toLocaleString()}
                    </span>
                  </td>
                  <td className={tdClass}>{strengthBadge(row.strength)}</td>
                </tr>
              ))}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-white/30 text-sm">
                    No combos match your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Legend */}
      <div className="text-[11px] text-white/30 leading-relaxed border-t border-white/5 pt-3 space-y-0.5">
        <p><span className="text-white/50 font-bold">Ratio</span> = Ends With ÷ Starts With. Higher = harder for opponent to continue the chain.</p>
        <p><span className="text-emerald-400 font-bold">Strong</span> ratio ≥ 2 &nbsp;·&nbsp; <span className="text-white/50 font-bold">Balanced</span> 0.5–2 &nbsp;·&nbsp; <span className="text-rose-400 font-bold">Weak</span> &lt; 0.5</p>
      </div>
    </div>
  );
}
