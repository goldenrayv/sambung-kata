"use client";

import { useState, useEffect, useRef } from "react";
import { Search, BookOpen, X, Command } from "lucide-react";
import { Input } from "@/components/ui/input";
import WordCard from "./WordCard";

interface Props {
  token: string;
  wordCount: number;
}

export default function WordSearch({ token, wordCount }: Props) {
  const [search, setSearch] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [prefixResults, setPrefixResults] = useState<string[]>([]);
  const [suffixResults, setSuffixResults] = useState<string[]>([]);
  const [bestRatios, setBestRatios] = useState<{
    top1: { suffix: string; ratio: number }[];
    top2: { suffix: string; ratio: number }[];
    top3: { suffix: string; ratio: number }[];
  } | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  // Focus shortcut: Tab or Cmd/Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isSearchFocused = document.activeElement === searchInputRef.current;
      
      if (
        (e.key === "Tab" && !isSearchFocused) || 
        ((e.metaKey || e.ctrlKey) && e.key === "k")
      ) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

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

  // Fetch Best Ratios on mount
  useEffect(() => {
    const fetchRatios = async () => {
      try {
        const res = await fetch("/api/analytics/ratios", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setBestRatios(data);
        }
      } catch (error) {
        console.error("Failed to fetch ratios:", error);
      }
    };
    fetchRatios();
  }, [token]);

  // Hardcoded Strategic Suffixes (Tactical Kill-Zone)
  const MAGIC_1 = ["Q", "X", "Y", "Z", "V"];
  const MAGIC_2 = ["AH", "AI", "AZ", "OX", "AX", "EX", "KS", "IA", "IF", "IR", "OI", "OH", "EA", "OA"];
  const MAGIC_3 = ["ILO", "NDO", "NDA", "TIF", "NEA"];
  const HARDCODED = ["CY", "LY", "GY", "OO", "SEA", "RD", "RS", "EI"];


  // Helper to get win rate for a word's ending
  const getStrategicScore = (word: string) => {
    if (!bestRatios) return 0;
    const w = word.toUpperCase();
    
    // Check 3rd letter suffix
    const s3 = w.slice(-3);
    const r3 = bestRatios.top3.find(r => r.suffix.toUpperCase() === s3);
    if (r3) return r3.ratio;

    // Check 2nd letter suffix
    const s2 = w.slice(-2);
    const r2 = bestRatios.top2.find(r => r.suffix.toUpperCase() === s2);
    if (r2) return r2.ratio;

    // Check 1st letter suffix
    const s1 = w.slice(-1);
    const r1 = bestRatios.top1.find(r => r.suffix.toUpperCase() === s1);
    if (r1) return r1.ratio;

    return 0;
  };

  // Strategic Grouping for Prefix Results: Group by their "Deadliest Ending"
  const groupedPrefix = prefixResults.reduce((acc, word) => {
    const w = word.toUpperCase();
    const matchedSuffixes: { suffix: string; score: number; tier: number }[] = [];

    // TIER 1: HARDCODED Suffixes
    for (const h of HARDCODED) {
      if (w.endsWith(h)) {
        let score = 0;
        if (h.length === 3) score = bestRatios?.top3.find(r => r.suffix.toUpperCase() === h)?.ratio || 0;
        else if (h.length === 2) score = bestRatios?.top2.find(r => r.suffix.toUpperCase() === h)?.ratio || 0;
        else if (h.length === 1) score = bestRatios?.top1.find(r => r.suffix.toUpperCase() === h)?.ratio || 0;
        
        matchedSuffixes.push({ suffix: `-${h}`, score, tier: 1 });
      }
    }

    // TIER 2: MAGIC Strategic Suffixes
    const s3 = w.slice(-3);
    const r3 = bestRatios?.top3.find(r => r.suffix.toUpperCase() === s3 && MAGIC_3.includes(s3));
    if (r3) matchedSuffixes.push({ suffix: `-${s3}`, score: r3.ratio, tier: 2 });

    const s2 = w.slice(-2);
    const r2 = bestRatios?.top2.find(r => r.suffix.toUpperCase() === s2 && MAGIC_2.includes(s2));
    if (r2) matchedSuffixes.push({ suffix: `-${s2}`, score: r2.ratio, tier: 2 });

    const s1 = w.slice(-1);
    const r1 = bestRatios?.top1.find(r => r.suffix.toUpperCase() === s1 && MAGIC_1.includes(s1));
    if (r1) matchedSuffixes.push({ suffix: `-${s1}`, score: r1.ratio, tier: 2 });

    if (matchedSuffixes.length > 0) {
      // Prioritize by best tier (1 is best) then by highest score
      matchedSuffixes.sort((a, b) => {
        if (a.tier !== b.tier) return a.tier - b.tier;
        return b.score - a.score;
      });
      
      const bestMatch = matchedSuffixes[0];
      if (!acc[bestMatch.suffix]) acc[bestMatch.suffix] = { words: [], score: bestMatch.score, tier: bestMatch.tier };
      acc[bestMatch.suffix].words.push(word);
    } else {
      // TIER 3: Everything Else
      if (!acc["Other"]) acc["Other"] = { words: [], score: 0, tier: 3 };
      acc["Other"].words.push(word);
    }

    return acc;
  }, {} as Record<string, { words: string[], score: number, tier: number }>);

  // Sort prefix groups by tier first, then by score (descending)
  const sortedPrefixSuffixes = Object.keys(groupedPrefix).sort((a, b) => {
    if (a === "Other") return 1;
    if (b === "Other") return -1;
    
    const groupA = groupedPrefix[a];
    const groupB = groupedPrefix[b];
    
    if (groupA.tier !== groupB.tier) return groupA.tier - groupB.tier;
    return groupB.score - groupA.score;
  });

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
          <div className="absolute -inset-0.5 bg-gradient-to-r from-rose-500/20 via-orange-500/20 to-rose-500/20 rounded-xl blur opacity-0 group-focus-within:opacity-100 transition duration-500" />
          
          <div className="relative bg-neutral-900 border border-white/10 rounded-xl shadow-2xl transition-all duration-300 focus-within:border-rose-500/50 animate-border-glow">
            <div className="flex items-center px-4 py-3.5 gap-3">
              <Search
                className={`w-5 h-5 shrink-0 transition-colors ${
                  isSearching ? "text-rose-500 animate-spin-slow" : "text-white/40 group-focus-within:text-rose-500"
                }`}
              />
              
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search across repository..."
                className="flex-1 bg-transparent text-xl font-medium text-white placeholder-white/20 border-none outline-none ring-0 shadow-none p-0 h-auto"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                autoFocus
              />

              <div className="flex items-center gap-3">
                {search && (
                  <button
                    onClick={() => setSearch("")}
                    className="p-1 hover:bg-white/10 rounded-md transition-colors text-white/40 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
                <div className="hidden sm:flex items-center gap-1 px-1.5 py-1 rounded border border-white/10 bg-white/5 text-[10px] font-medium text-white/20 select-none">
                  <Command className="w-2.5 h-2.5" />
                  <span>K</span>
                </div>
              </div>
            </div>

            {search && !isSearching && (
              <div className="px-4 py-1.5 border-t border-white/5 bg-white/[0.02] flex items-center justify-between">
                <div className="text-[10px] font-bold text-white tracking-widest uppercase flex items-center gap-2">
                  <span className="w-1 h-1 rounded-full bg-rose-500 animate-pulse" />
                  {(prefixResults.length + suffixResults.length).toLocaleString()} matches found
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Tactical Quick-Select Badges - Simplified below search bar */}
        <div className="max-w-3xl mx-auto mt-6 space-y-3 animate-in fade-in slide-in-from-top-4 duration-1000">
          <div className="flex flex-wrap gap-2">
            {[...MAGIC_1, ...MAGIC_2, ...MAGIC_3].sort().map((s) => (
              <button
                key={s}
                onClick={() => setSearch(s)}
                className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-black text-white/40 hover:bg-orange-500/10 hover:border-orange-500/30 hover:text-orange-400 transition-all duration-300 active:scale-95 uppercase font-mono tracking-tighter"
              >
                -{s}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2 pt-2 border-t border-white/5">
            {HARDCODED.map((s) => (
              <button
                key={s}
                onClick={() => setSearch(s)}
                className="px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-[10px] font-black text-rose-400 hover:bg-rose-500 hover:text-white transition-all duration-300 active:scale-95 uppercase font-mono tracking-tighter"
              >
                -{s}
              </button>
            ))}
          </div>
        </div>
      </div>


      {/* Main Grid: Prefix (Left) | Suffix (Right) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 min-h-[60vh] border-t border-white/5 pt-8">
        {/* Left Column: Prefix Grid (P) */}
        <div className="space-y-6 p-6 rounded-2xl bg-rose-500/[0.02] border border-rose-500/20 shadow-[0_0_30px_rgba(244,63,94,0.05)]">
          <div className="flex flex-col border-b border-rose-500/10 pb-4 gap-4 min-h-[140px] justify-end">
            <div className="flex items-center gap-6 w-full flex-wrap">
              <h2 className="text-4xl font-black text-rose-400 italic tracking-tighter drop-shadow-[0_0_15px_rgba(244,63,94,0.2)]">PREFIX</h2>
              
              {/* Tactical Quick-Index aligned horizontally */}
              {sortedPrefixSuffixes.length > 0 && (
                <div className="flex flex-wrap gap-1 animate-in fade-in slide-in-from-right-4 duration-500">
                  {sortedPrefixSuffixes.filter(s => s !== "Other").map((suffix) => (
                    <button
                      key={suffix}
                      onClick={() => {
                          const el = document.getElementById(`prefix-group-${suffix}`);
                          el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      }}
                      className="flex items-center justify-center px-2 h-6 rounded bg-rose-500/10 border border-rose-500/20 text-[9px] font-black text-rose-400 hover:bg-rose-500 hover:text-white transition-all duration-200 active:scale-95 cursor-pointer uppercase"
                    >
                      {suffix}
                    </button>
                  ))}
                  {groupedPrefix["Other"] && (
                    <button
                      key="Other"
                      onClick={() => {
                          const el = document.getElementById(`prefix-group-Other`);
                          el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      }}
                      className="flex items-center justify-center px-2 h-6 rounded bg-white/5 border border-white/10 text-[9px] font-black text-white/40 hover:bg-white/10 hover:text-white transition-all duration-200 active:scale-95 cursor-pointer uppercase"
                    >
                      Other
                    </button>
                  )}
                </div>
              )}
            </div>
            
            <div className="text-[10px] font-bold text-white tracking-widest uppercase flex items-center gap-2">
              <span className="opacity-40 whitespace-nowrap">Starts with</span>
              <span className="px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20">&quot;{search}&quot;</span>
            </div>
          </div>

          <div className="space-y-10">
            {sortedPrefixSuffixes.length > 0 ? (
              sortedPrefixSuffixes.map((suffix) => (
                <div key={suffix} id={`prefix-group-${suffix}`} className="relative scroll-mt-60 space-y-3">
                  <div className="flex items-center justify-between gap-2 px-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xl font-black text-rose-400 drop-shadow-[0_0_10px_rgba(244,63,94,0.15)]">{suffix.toUpperCase()}</span>
                      <div className="h-[1px] w-12 bg-rose-500/10" />
                    </div>
                    {groupedPrefix[suffix].score > 0 && (
                      <div className="px-2 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/20 text-[9px] font-black text-rose-400 animate-pulse">
                        {groupedPrefix[suffix].score}% WINRATE
                      </div>
                    )}
                  </div>
                  <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 content-start">
                    {groupedPrefix[suffix].words.map((word) => (
                      <WordCard key={word} word={word} search={search} searchMode="prefix" />
                    ))}
                  </div>
                </div>
              ))
            ) : search && !isSearching ? (
              <div className="py-20 text-center col-span-full animate-in fade-in zoom-in duration-500">
                <div className="inline-flex flex-col items-center">
                  <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-4 border border-white/10">
                    <X className="w-6 h-6 text-rose-500 opacity-50" />
                  </div>
                  <p className="text-sm font-bold text-white tracking-widest uppercase opacity-40">No prefix results</p>
                  <p className="text-[10px] text-white/20 mt-1">Try a different letter combination</p>
                </div>
              </div>
            ) : null}
          </div>
        </div>

        {/* Right Column: Suffix Grid (S) */}
        <div className="space-y-6 p-6 rounded-2xl bg-orange-500/[0.02] border border-orange-500/20 shadow-[0_0_30px_rgba(251,146,60,0.05)]">
          <div className="flex flex-col border-b border-orange-500/10 pb-4 gap-4 min-h-[140px] justify-end">
            <div className="flex items-center gap-6 w-full flex-wrap">
              <h2 className="text-4xl font-black text-orange-400 italic tracking-tighter drop-shadow-[0_0_15px_rgba(251,146,60,0.2)]">SUFFIX</h2>
              
              {/* Alphabet Quick-Index aligned horizontally */}
              {sortedSuffixLetters.length > 0 && (
                <div className="flex flex-wrap gap-1 animate-in fade-in slide-in-from-right-4 duration-500">
                  {sortedSuffixLetters.map((letter) => (
                    <button
                      key={letter}
                      onClick={() => {
                          const el = document.getElementById(`letter-${letter}`);
                          el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      }}
                      className="flex items-center justify-center w-6 h-6 rounded bg-orange-500/10 border border-orange-500/20 text-[10px] font-black text-orange-400 hover:bg-orange-500 hover:text-white transition-all duration-200 active:scale-95 cursor-pointer"
                    >
                      {letter}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="text-[10px] font-bold text-white tracking-widest uppercase flex items-center gap-2">
              <span className="opacity-40 whitespace-nowrap">Ends with</span>
              <span className="px-1.5 py-0.5 rounded bg-orange-500/10 text-orange-400 border border-orange-500/20">&quot;{search}&quot;</span>
            </div>
          </div>

          <div className="space-y-10">
            {sortedSuffixLetters.length > 0 ? (
              sortedSuffixLetters.map((letter) => (
                <div key={letter} id={`letter-${letter}`} className="relative scroll-mt-60 space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-black text-orange-400 drop-shadow-[0_0_10px_rgba(251,146,60,0.1)]">{letter}</span>
                    <div className="h-[1px] flex-1 bg-orange-500/10" />
                  </div>
                  <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
                    {groupedSuffix[letter].map((word) => (
                      <WordCard key={word} word={word} search={search} searchMode="suffix" />
                    ))}
                  </div>
                </div>
              ))
            ) : search && !isSearching ? (
              <div className="py-20 text-center col-span-full animate-in fade-in zoom-in duration-500">
                <div className="inline-flex flex-col items-center">
                  <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-4 border border-white/10">
                    <X className="w-6 h-6 text-orange-500 opacity-50" />
                  </div>
                  <p className="text-sm font-bold text-white tracking-widest uppercase opacity-40">No suffix results</p>
                  <p className="text-[10px] text-white/20 mt-1">Try the Magic Suffixes above</p>
                </div>
              </div>
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
