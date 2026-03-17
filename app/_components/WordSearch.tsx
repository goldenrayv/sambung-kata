"use client";

import { useState, useEffect } from "react";
import { Search, BookOpen, SearchX } from "lucide-react";
import { Input } from "@/components/ui/input";
import WordCard from "./WordCard";

interface Props {
  token: string;
  wordCount: number;
}

export default function WordSearch({ token, wordCount }: Props) {
  const [search, setSearch] = useState("");
  const [searchMode, setSearchMode] = useState<"contains" | "prefix" | "suffix">("contains");
  const [results, setResults] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (!search.trim()) {
      setResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);

    // 150 ms debounce — avoids hammering the API on every keystroke
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/search?q=${encodeURIComponent(search.trim())}&mode=${searchMode}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (res.ok) {
          setResults(await res.json());
        }
      } finally {
        setIsSearching(false);
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [search, searchMode, token]);

  return (
    <div className="w-full max-w-4xl relative z-10 space-y-4">
      {/* Search Input */}
      <div className="relative group">
        <div className="absolute inset-0 bg-gradient-to-r from-rose-500/10 to-orange-500/10 rounded-xl blur-lg transition-all duration-500 opacity-0 group-focus-within:opacity-100" />

        <div className="relative bg-neutral-900/40 backdrop-blur-xl border border-white/10 rounded-xl shadow-xl overflow-hidden transition-all duration-300 ring-1 ring-transparent focus-within:ring-rose-500/30">
          <div className="flex items-center px-4 py-3">
            <Search
              className={`w-5 h-5 mr-3 transition-colors ${isSearching ? "text-rose-400 animate-pulse" : "text-neutral-500"}`}
            />
            <Input
              type="text"
              placeholder="Type syllables... (e.g., 'kan')"
              className="w-full bg-transparent text-xl text-white placeholder-neutral-600 border-none focus-visible:ring-0 shadow-none p-0 h-auto"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
            />

            <div className="flex items-center gap-1 bg-white/5 p-1 rounded-lg border border-white/5 ml-2">
              {(["contains", "prefix", "suffix"] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setSearchMode(mode)}
                  className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all duration-200 ${
                    searchMode === mode
                      ? "bg-rose-500 text-white shadow-lg shadow-rose-500/20"
                      : "text-neutral-500 hover:text-neutral-300 hover:bg-white/5"
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="transition-all duration-300">
        {!search && (
          <div className="flex flex-col items-center justify-center py-16 text-neutral-600">
            <BookOpen className="w-12 h-12 mb-3 opacity-30" />
            <p className="text-sm">Search {wordCount.toLocaleString()} active words</p>
          </div>
        )}

        {search && !isSearching && results.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-neutral-500">
            <SearchX className="w-12 h-12 mb-3 opacity-30" />
            <p className="text-sm font-medium">No matches for &quot;{search}&quot;</p>
          </div>
        )}

        {results.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
            {results.map((word) => (
              <WordCard key={word} word={word} search={search} searchMode={searchMode} />
            ))}
          </div>
        )}

        {results.length === 100 && (
          <div className="py-6 text-center text-neutral-600 text-xs italic">
            Top 100 results shown. Keep typing...
          </div>
        )}
      </div>
    </div>
  );
}
