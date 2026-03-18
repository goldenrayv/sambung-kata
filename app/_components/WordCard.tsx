"use client";

interface Props {
  word: string;
  search: string;
  searchMode: "contains" | "prefix" | "suffix";
}

export default function WordCard({ word, search, searchMode }: Props) {
  const w = word.toLowerCase();
  const s = search.toLowerCase().trim();

  // Derive the highlight cue directly from searchMode — no redundant helper function.
  // In "contains" mode, we still give extra context for prefix/suffix submatches.
  const cue =
    searchMode === "prefix" || (searchMode === "contains" && w.startsWith(s))
      ? "Prefix Match"
      : searchMode === "suffix" || (searchMode === "contains" && w.endsWith(s))
        ? "Suffix Match"
        : null;

  return (
    <div
      className={`px-2.5 py-1.5 rounded-lg border flex items-center justify-between group transition-all duration-200 ${cue
          ? cue === "Prefix Match" 
            ? "bg-rose-500/5 border-rose-500/20 hover:bg-rose-500/10"
            : "bg-orange-500/5 border-orange-500/20 hover:bg-orange-500/10"
          : "bg-neutral-900/40 border-white/5 hover:border-white/10 hover:bg-neutral-800/40"
        }`}
    >
      <span
        className={`text-[11px] tracking-widest transition-colors uppercase ${cue 
          ? cue === "Prefix Match" ? "text-rose-100 font-bold" : "text-orange-100 font-bold"
          : "text-white/90"
          }`}
      >
        {word.toUpperCase()}
      </span>
      {cue && (
        <div
          className={`w-1 h-1 rounded-full ${cue === "Prefix Match" ? "bg-rose-500" : "bg-orange-500"}`}
          title={cue}
        />
      )}
    </div>
  );
}
