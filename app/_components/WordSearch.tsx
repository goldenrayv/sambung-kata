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
  const [prefixResults, setPrefixResults] = useState<string[]>([]);
  const [suffixResults, setSuffixResults] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (!search.trim()) {
      setPrefixResults([]);
      setSuffixResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);

    const timer = setTimeout(async () => {
      try {
        const [pRes, sRes] = await Promise.all([
          fetch(`/api/search?q=${encodeURIComponent(search.trim())}&mode=prefix`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`/api/search?q=${encodeURIComponent(search.trim())}&mode=suffix`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        if (pRes.ok && sRes.ok) {
          const [pData, sData] = await Promise.all([pRes.json(), sRes.json()]);
          setPrefixResults(pData);
          setSuffixResults(sData);
        }
      } catch (error) {
        console.error("Search failed:", error);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [search, token]);

  // Group results by first letter (for Suffix side)
  const groupedSuffix = suffixResults.reduce(
    (acc, word) => {
      const letter = word[0].toUpperCase();
      if (!acc[letter]) acc[letter] = [];
      acc[letter].push(word);
      return acc;
    },
    {} as Record<string, string[]>
  );

  const sortedSuffixLetters = Object.keys(groupedSuffix).sort();

  return (
    <div className="w-full relative z-10 space-y-8 pb-20">
      {/* Search Bar - Fixed at top with blur */}
      <div className="sticky top-20 z-20 pb-4 -mx-4 px-4 bg-neutral-950/80 backdrop-blur-md">
        <div className="max-w-3xl mx-auto w-full relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-rose-500/10 to-orange-500/10 rounded-xl blur-lg transition-all duration-500 opacity-0 group-focus-within:opacity-100" />
          <div className="relative bg-neutral-900/60 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl overflow-hidden transition-all duration-300 ring-1 ring-transparent focus-within:ring-rose-500/30">
            <div className="flex items-center px-4 py-4">
              <Search
                className={`w-6 h-6 mr-4 transition-colors ${isSearching ? "text-rose-400 animate-pulse" : "text-white"}`}
              />
              <Input
                type="text"
                placeholder="Search words..."
                className="w-full bg-transparent text-2xl font-light text-white placeholder-white/40 border-none focus-visible:ring-0 shadow-none p-0 h-auto"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                autoFocus
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Prefix (Left) | Suffix (Right) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 min-h-[60vh]">
        {/* Left Column: Prefix Grid (P) */}
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-white/5 pb-2">
            <h2 className="text-4xl font-black text-rose-400 italic tracking-tighter drop-shadow-[0_0_15px_rgba(244,63,94,0.2)]">PREFIX</h2>
            <div className="text-[10px] font-bold text-white tracking-widest uppercase">
              Starts with &quot;{search}&quot;
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 content-start">
            {prefixResults.length > 0 ? (
              prefixResults.map((word) => (
                <WordCard key={word} word={word} search={search} searchMode="prefix" />
              ))
            ) : search && !isSearching ? (
              <div className="py-20 text-center text-white">No prefix results</div>
            ) : null}
          </div>
        </div>

        {/* Right Column: Suffix Grouped (S) */}
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-white/5 pb-2">
            <h2 className="text-4xl font-black text-orange-400 italic tracking-tighter drop-shadow-[0_0_15px_rgba(251,146,60,0.2)]">SUFFIX</h2>
            <div className="text-[10px] font-bold text-white tracking-widest uppercase">
              Ends with &quot;{search}&quot;
            </div>
          </div>

          <div className="space-y-10">
            {sortedSuffixLetters.length > 0 ? (
              sortedSuffixLetters.map((letter) => (
                <div key={letter} className="relative">
                  <div className="sticky top-44 z-10 -ml-4 pl-4 py-2 bg-neutral-950/90 backdrop-blur-sm mb-4">
                    <span className="text-3xl font-black text-orange-400 border-b-2 border-orange-500 pr-4">
                      {letter}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
                    {groupedSuffix[letter].map((word) => (
                      <WordCard key={word} word={word} search={search} searchMode="suffix" />
                    ))}
                  </div>
                </div>
              ))
            ) : search && !isSearching ? (
              <div className="py-20 text-center text-white">No suffix results</div>
            ) : null}
          </div>
        </div>
      </div>

      {!search && (
        <div className="flex flex-col items-center justify-center py-32 text-white">
          <BookOpen className="w-16 h-16 mb-4 opacity-20" />
          <p className="text-lg font-light tracking-wide">
            Search {wordCount.toLocaleString()} active Indonesian words
          </p>
        </div>
      )}
    </div>
  );
}
