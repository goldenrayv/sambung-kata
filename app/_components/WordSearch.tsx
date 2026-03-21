"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { BookOpen, X, Command, Layout, Columns } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import WordCard from "./WordCard";
import { deleteWord, toggleWordVerification } from "@/app/actions";
import { toast } from "sonner";

interface Props {
  userId: string;
  wordCount: number;
  wordStats: { verified: number; unverified: number; rejected: number; };
  isSuperUser: boolean;
  tacticalSuffixes: any[];
}

export default function WordSearch({ userId, wordCount, wordStats, isSuperUser, tacticalSuffixes }: Props) {
  const [search, setSearch] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [prefixData, setPrefixData] = useState<{ results: any[], totalCount: number, hasMore: boolean }>({ results: [], totalCount: 0, hasMore: false });
  const [suffixData, setSuffixData] = useState<{ results: any[], totalCount: number, hasMore: boolean }>({ results: [], totalCount: 0, hasMore: false });
  const [isSearching, setIsSearching] = useState(false);
  const [showSuffix, setShowSuffix] = useState(true);

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

  const handleVerifyWord = async (id: string, currentStatus?: string) => {
    if (currentStatus === "verified") return; 
    
    const result = await toggleWordVerification(id, "unverified");
    if (result.success) {
      toast.success("Word verified! ✨");
      // Update local state for immediate feedback
      const updateList = (list: any[]) => list.map(item => 
        item.id === id ? { ...item, isVerified: "verified" } : item
      );
      setPrefixData(prev => ({ ...prev, results: updateList(prev.results) }));
      setSuffixData(prev => ({ ...prev, results: updateList(prev.results) }));
    } else {
      toast.error("Failed to verify word");
    }
  };

  const handleDeleteWord = async (id: string) => {
    if (!confirm("Reject and hide this word from search?")) return;
    const result = await deleteWord(id);
    if (result.success) {
      toast.success("Word rejected (Soft Deleted)");
      // Update local state for immediate feedback
      const filterList = (list: any[]) => list.filter(item => item.id !== id);
      setPrefixData(prev => ({ ...prev, results: filterList(prev.results), totalCount: prev.totalCount - 1 }));
      setSuffixData(prev => ({ ...prev, results: filterList(prev.results), totalCount: prev.totalCount - 1 }));
    } else {
      toast.error(result.error || "Failed to reject word");
    }
  };

  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!search.trim()) {
      setPrefixData({ results: [], totalCount: 0, hasMore: false });
      setSuffixData({ results: [], totalCount: 0, hasMore: false });
      setIsSearching(false);
      return;
    }

    setIsSearching(true);

    const timer = setTimeout(async () => {
      abortRef.current?.abort();
      abortRef.current = new AbortController();
      const { signal } = abortRef.current;

      try {
        const [pRes, sRes] = await Promise.all([
          fetch(`/api/search?q=${encodeURIComponent(search.trim())}&mode=prefix`, {
            headers: { Authorization: `Bearer ${userId}` },
            signal,
          }),
          fetch(`/api/search?q=${encodeURIComponent(search.trim())}&mode=suffix`, {
            headers: { Authorization: `Bearer ${userId}` },
            signal,
          }),
        ]);

        if (pRes.ok && sRes.ok) {
          const [pData, sData] = await Promise.all([pRes.json(), sRes.json()]);
          setPrefixData(pData);
          setSuffixData(sData);
        }
      } catch (error: unknown) {
        if (error instanceof Error && error.name !== "AbortError") {
          console.error("Search failed:", error);
        }
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [search, userId]);


  const groupedPrefix = useMemo(() =>
    prefixData.results.reduce((acc, wordObj: any) => {
      const word = (wordObj.word || wordObj).toUpperCase();

      let matchedSuffix = null;
      for (const ts of tacticalSuffixes) {
        if (word.endsWith(ts.suffix)) {
          matchedSuffix = ts.suffix;
          break;
        }
      }

      if (matchedSuffix) {
        const key = `-${matchedSuffix}`;
        if (!acc[key]) acc[key] = { words: [], tier: 1 };
        acc[key].words.push(wordObj);
      } else {
        if (!acc["Other"]) acc["Other"] = { words: [], tier: 2 };
        acc["Other"].words.push(wordObj);
      }

      return acc;
    }, {} as Record<string, { words: any[], tier: number }>),
  [prefixData.results, tacticalSuffixes]);

  const sortedPrefixSuffixes = useMemo(() =>
    Object.keys(groupedPrefix).sort((a, b) => {
      if (a === "Other") return 1;
      if (b === "Other") return -1;
      const groupA = groupedPrefix[a];
      const groupB = groupedPrefix[b];
      if (groupA.tier !== groupB.tier) return groupA.tier - groupB.tier;
      return a.localeCompare(b);
    }),
  [groupedPrefix]);

  const groupedSuffix = useMemo(() =>
    suffixData.results.reduce((acc, wordObj: any) => {
      const word = wordObj.word || wordObj;
      const letter = word[0].toUpperCase();
      if (!acc[letter]) acc[letter] = [];
      acc[letter].push(wordObj);
      return acc;
    }, {} as Record<string, any[]>),
  [suffixData.results]);

  const sortedSuffixLetters = useMemo(() =>
    Object.keys(groupedSuffix).sort(),
  [groupedSuffix]);
  
  return (
    <div className="w-full relative z-10 space-y-8 pb-20">
      <div className="sticky top-20 z-20 pb-6 -mx-4 px-4 bg-neutral-950/80 backdrop-blur-md border-b border-white/5 shadow-2xl">
        <div className="max-w-7xl mx-auto w-full flex flex-col lg:flex-row items-start lg:items-center gap-6 pt-4">
          
          {/* Stats Cards - Left */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4 gap-2 w-full lg:w-auto">
            {/* Total Card */}
            <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/10 shadow-inner">
              <div className="text-[9px] font-black text-white/40 uppercase tracking-widest mb-1">Total</div>
              <div className="text-xl font-black text-white tracking-tighter">{(wordStats.verified + wordStats.unverified + wordStats.rejected).toLocaleString()}</div>
            </div>
            {/* Verified Card */}
            <div className="p-3 rounded-2xl bg-emerald-500/[0.03] border border-emerald-500/10 shadow-inner">
              <div className="text-[9px] font-black text-emerald-400/60 uppercase tracking-widest mb-1">Verified</div>
              <div className="text-xl font-black text-emerald-400 tracking-tighter">{wordStats.verified.toLocaleString()}</div>
            </div>
            {/* Unverified Card */}
            <div className="p-3 rounded-2xl bg-orange-500/[0.03] border border-orange-500/10 shadow-inner">
              <div className="text-[9px] font-black text-orange-400 uppercase tracking-widest mb-1">Unverified</div>
              <div className="text-xl font-black text-orange-400 tracking-tighter">{wordStats.unverified.toLocaleString()}</div>
            </div>
            {/* Rejected (Hidden) Card */}
            <div className="p-3 rounded-2xl bg-rose-500/[0.03] border border-rose-500/10 shadow-inner">
              <div className="flex items-baseline gap-1.5 mb-1">
                <div className="text-[9px] font-black text-rose-400/50 uppercase tracking-widest">Rejected</div>
                <div className="text-[8px] font-black text-white/20 uppercase tracking-widest">(hidden)</div>
              </div>
              <div className="text-xl font-black text-rose-400/50 tracking-tighter">{wordStats.rejected.toLocaleString()}</div>
            </div>
          </div>

          <div className="max-w-3xl mx-auto w-full relative group flex-1">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-rose-500/20 via-orange-500/20 to-rose-500/20 rounded-xl blur opacity-0 group-focus-within:opacity-100 transition duration-500" />
          
          <div className="relative bg-neutral-900 border border-white/10 rounded-xl shadow-2xl transition-all duration-300 focus-within:border-rose-500/50 animate-border-glow">
            <div className="flex items-center px-4 py-3.5 gap-3">
              <button
                onClick={() => setShowSuffix(!showSuffix)}
                title={showSuffix ? "Hide Suffix Results" : "Show Suffix Results"}
                className={`p-1.5 rounded-md transition-all duration-300 ${
                  showSuffix 
                    ? "bg-white/5 border border-white/10 text-white/40 hover:text-white" 
                    : "bg-orange-500/10 border border-orange-500/30 text-orange-400 font-bold"
                }`}
              >
                {showSuffix ? <Columns className="w-4 h-4" /> : <Layout className="w-4 h-4" />}
              </button>
              
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search across repository..."
                className="flex-1 bg-transparent text-xl font-bold text-white placeholder-white/50 border-none outline-none ring-0 shadow-none p-0 h-auto italic"
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
                <div className="hidden sm:flex items-center gap-1 px-1.5 py-1 rounded border border-white/20 bg-white/5 text-[10px] font-black text-white/50 select-none">
                  <Command className="w-2.5 h-2.5" />
                  <span>K</span>
                </div>
              </div>
            </div>
          </div>
          </div>

          {/* Legend Cards - Right */}
          <div className="grid grid-cols-3 gap-2 w-full lg:w-auto">
            <div className="px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex flex-col items-center justify-center text-center">
              <div className="text-[8px] font-black text-emerald-400 uppercase tracking-[0.2em] mb-0.5 whitespace-nowrap">Verified</div>
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
            </div>
            <div className="px-3 py-2 rounded-xl bg-orange-500/10 border border-orange-500/20 flex flex-col items-center justify-center text-center">
              <div className="text-[8px] font-black text-orange-400 uppercase tracking-[0.2em] mb-0.5 whitespace-nowrap">Unverified</div>
              <div className="w-1.5 h-1.5 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(251,146,60,0.5)]" />
            </div>
            <div className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 flex flex-col items-center justify-center text-center">
              <div className="text-[8px] font-black text-white/40 uppercase tracking-[0.2em] mb-0.5 whitespace-nowrap">Rejected</div>
              <div className="text-[7px] font-black text-white/20 uppercase tracking-tighter mb-1">(Hidden)</div>
              <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
            </div>
          </div>
        </div>

        <div className="max-w-3xl mx-auto mt-6 space-y-3 animate-in fade-in slide-in-from-top-4 duration-1000">
          <div className="flex flex-wrap gap-2">
            {tacticalSuffixes.slice(0, 30).map((ts) => (
              <button
                key={ts.id}
                onClick={() => setSearch(ts.suffix)}
                className="px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-[10px] font-black text-rose-400 hover:bg-rose-500 hover:text-white transition-all duration-300 active:scale-95 uppercase font-mono tracking-tighter"
              >
                -{ts.suffix}
              </button>
            ))}
          </div>
        </div>
      </div>      <div className={`grid grid-cols-1 ${showSuffix ? "lg:grid-cols-2" : ""} gap-6 min-h-[60vh] border-t border-white/5 pt-8`}>
        {/* Prefix Container */}
        <div className={`space-y-6 p-6 rounded-2xl bg-orange-500/5 border border-orange-500/20 shadow-[0_0_30px_rgba(251,146,60,0.05)] transition-all duration-500 ${!showSuffix ? "col-span-full" : ""}`}>
          <div className="flex flex-col border-b border-orange-500/10 pb-4 gap-4 min-h-[140px] justify-end">
            <div className="flex items-center gap-6 w-full flex-wrap">
              <div className="flex items-center gap-3">
                <h2 className="text-4xl font-black text-orange-400 italic tracking-tighter drop-shadow-[0_0_15px_rgba(251,146,60,0.2)]">PREFIX</h2>
                {!showSuffix && (
                  <Badge variant="outline" className="bg-orange-500/10 text-orange-400 border-orange-500/20 text-[10px] font-black tracking-widest uppercase">Full Width</Badge>
                )}
              </div>
              
              <div className="flex items-center w-full min-h-[24px]">
                {isSearching ? (
                  <div className="flex items-center gap-2 animate-pulse">
                    <div className="w-2 h-2 rounded-full bg-orange-500/40" />
                    <div className="h-2 w-24 bg-orange-500/20 rounded" />
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2 group/nav">
                    {sortedPrefixSuffixes.map((suffix) => (
                      <button
                        key={suffix}
                        onClick={() => {
                          const el = document.getElementById(`prefix-group-${suffix}`);
                          el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }}
                        className="flex items-center justify-center px-2 h-6 rounded bg-orange-500/10 border border-orange-500/20 text-[9px] font-black text-orange-400 hover:bg-orange-500 hover:text-white transition-all duration-200 active:scale-95 cursor-pointer uppercase"
                      >
                        {suffix}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between w-full pt-4 border-t border-orange-500/5">
              <div className="text-[10px] font-black text-white tracking-widest uppercase flex items-center gap-2">
                <span className="opacity-80 whitespace-nowrap italic">Starts with</span>
                <span className="px-1.5 py-0.5 rounded bg-orange-500/10 text-orange-400 border border-orange-500/20 shadow-inner font-mono">&quot;{search}&quot;</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black text-orange-400/60 uppercase tracking-widest">{prefixData.totalCount.toLocaleString()} TOTAL</span>
                {prefixData.hasMore && (
                  <Badge variant="outline" className="bg-orange-500/10 text-orange-400 border-orange-500/20 text-[9px] font-black animate-pulse">
                    + MORE (Reach Limit)
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-10">
            {sortedPrefixSuffixes.length > 0 ? (
              sortedPrefixSuffixes.map((suffix) => (
                <div key={suffix} id={`prefix-group-${suffix}`} className="relative scroll-mt-60 space-y-3">
                  <div className="flex items-center justify-between gap-2 px-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xl font-black text-orange-400/80 drop-shadow-[0_0_10px_rgba(251,146,60,0.1)]">{suffix.toUpperCase()}</span>
                      <div className="h-[1px] w-12 bg-orange-500/10" />
                    </div>
                  </div>
                  <div className={`grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 ${!showSuffix ? "xl:grid-cols-6 2xl:grid-cols-8" : "xl:grid-cols-3"} gap-2 content-start`}>
                    {groupedPrefix[suffix].words.map((wordObj: any) => (
                      <WordCard 
                        key={wordObj.id} 
                        word={wordObj.word} 
                        search={search} 
                        searchMode="prefix" 
                        isSuperUser={isSuperUser}
                        isVerified={wordObj.isVerified}
                        onAccept={isSuperUser ? () => handleVerifyWord(wordObj.id, wordObj.isVerified) : undefined}
                        onDelete={isSuperUser ? () => handleDeleteWord(wordObj.id) : undefined}
                      />
                    ))}
                  </div>
                </div>
              ))
            ) : search && !isSearching ? (
              <div className="py-20 text-center col-span-full animate-in fade-in zoom-in duration-500">
                <div className="inline-flex flex-col items-center">
                  <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-4 border border-white/10">
                    <X className="w-6 h-6 text-orange-400 opacity-80" />
                  </div>
                  <p className="text-sm font-black text-white tracking-widest uppercase opacity-80">No prefix results</p>
                  <p className="text-[10px] text-white/60 mt-1 font-bold italic">Try a different letter combination</p>
                </div>
              </div>
            ) : null}
          </div>
        </div>

        {/* Suffix Container */}
        {showSuffix && (
          <div className="space-y-6 p-6 rounded-2xl bg-orange-500/5 border border-orange-500/20 shadow-[0_0_30px_rgba(251,146,60,0.05)] animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="flex flex-col border-b border-orange-500/10 pb-4 gap-4 min-h-[140px] justify-end">
              <div className="flex items-center gap-6 w-full flex-wrap">
                <div className="flex items-center gap-3">
                  <h2 className="text-4xl font-black text-orange-400 italic tracking-tighter drop-shadow-[0_0_15px_rgba(251,146,60,0.2)]">SUFFIX</h2>
                </div>
                
                <div className="flex items-center justify-between w-full pt-4 border-t border-orange-500/5">
                  <div className="text-[10px] font-black text-white tracking-widest uppercase flex items-center gap-2">
                    <span className="opacity-80 whitespace-nowrap italic">Ends with</span>
                    <span className="px-1.5 py-0.5 rounded bg-orange-500/10 text-orange-400 border border-orange-500/20 shadow-inner font-mono">&quot;{search}&quot;</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black text-orange-400/60 uppercase tracking-widest">{suffixData.totalCount.toLocaleString()} TOTAL</span>
                    {suffixData.hasMore && (
                      <Badge variant="outline" className="bg-orange-500/10 text-orange-400 border-orange-500/20 text-[9px] font-black animate-pulse">
                        + MORE (Reach Limit)
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-10">
              {sortedSuffixLetters.length > 0 ? (
                sortedSuffixLetters.map((letter) => (
                  <div key={letter} id={`letter-${letter}`} className="relative scroll-mt-60 space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xl font-black text-orange-400/80 drop-shadow-[0_0_10px_rgba(251,146,60,0.1)]">{letter}</span>
                      <div className="h-[1px] flex-1 bg-orange-500/10" />
                    </div>
                    <div className={`grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 ${!showSuffix ? "xl:grid-cols-6 2xl:grid-cols-8" : "xl:grid-cols-3"} gap-2`}>
                      {groupedSuffix[letter].map((wordObj: any) => (
                        <WordCard 
                          key={wordObj.id} 
                          word={wordObj.word} 
                          search={search} 
                          searchMode="suffix" 
                          isSuperUser={isSuperUser}
                          isVerified={wordObj.isVerified}
                          onAccept={isSuperUser ? () => handleVerifyWord(wordObj.id, wordObj.isVerified) : undefined}
                          onDelete={isSuperUser ? () => handleDeleteWord(wordObj.id) : undefined}
                        />
                      ))}
                    </div>
                  </div>
                ))
              ) : search && !isSearching ? (
                <div className="py-20 text-center col-span-full animate-in fade-in zoom-in duration-500">
                  <div className="inline-flex flex-col items-center">
                    <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-4 border border-white/10">
                      <X className="w-6 h-6 text-orange-400 opacity-80" />
                    </div>
                    <p className="text-sm font-black text-white tracking-widest uppercase opacity-80">No suffix results</p>
                    <p className="text-[10px] text-white/60 mt-1 font-bold italic">Try the Magic Suffixes above</p>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        )}
      </div>

      {!search && (
        <div className="flex flex-col items-center justify-center py-32 gap-4 text-white/80">
          <BookOpen className="w-16 h-16 opacity-20" />
          <div className="text-center space-y-1">
            <p className="text-lg font-black tracking-widest uppercase italic font-mono opacity-60">
              {wordCount.toLocaleString()} active tokens
            </p>
            <p className="text-[11px] font-bold text-white/30 uppercase tracking-widest">
              Type a word or tap a suffix above to begin
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
