"use client";
import { Trash2, Check } from "lucide-react";

interface Props {
  word: string;
  search: string;
  searchMode: "contains" | "prefix" | "suffix";
  isSuperUser?: boolean;
  isVerified?: string;
  onDelete?: () => void;
  onAccept?: () => void;
}

export default function WordCard({ word, search = "", searchMode = "prefix", isSuperUser = false, isVerified = "unverified", onDelete, onAccept }: Props) {
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
      className={`px-2.5 py-1.5 rounded-lg border flex items-center justify-between group transition-all duration-200 ${isVerified === "verified"
        ? "bg-emerald-500/10 border-emerald-500/30 hover:bg-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]"
        : cue
          ? "bg-orange-500/5 border-orange-500/20 hover:bg-orange-500/10"
          : "bg-neutral-900/40 border-white/5 hover:border-white/10 hover:bg-neutral-800/40"
      }`}
    >
      <span
        className={`text-[11px] tracking-widest transition-colors uppercase ${isVerified === "verified"
          ? "text-emerald-400 font-black"
          : cue 
            ? "text-orange-100 font-extrabold"
            : "text-white font-bold"
          }`}
      >
        {word.toUpperCase()}
      </span>
      <div className="flex items-center gap-1.5">
        {isSuperUser && (
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {onAccept && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onAccept();
                }}
                className="p-1 hover:bg-emerald-500/20 rounded-md text-emerald-500 transition-colors"
                title="Accept"
              >
                <Check className="w-3.5 h-3.5" />
              </button>
            )}
            {onDelete && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                className="p-1 hover:bg-rose-500/20 rounded-md text-rose-500 transition-colors"
                title="Reject (Soft Delete)"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}
        <div className="flex items-center gap-1">
          <div
            className={`w-1.5 h-1.5 rounded-full shadow-[0_0_5px_rgba(0,0,0,0.2)] ${isVerified === "verified" ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-orange-500 shadow-[0_0_8px_rgba(251,146,60,0.5)]"}`}
            title={isVerified}
          />
        </div>
      </div>
    </div>
  );
}
