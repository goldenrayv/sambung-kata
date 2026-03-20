"use client";

import { useState, useEffect, useRef } from "react";
import { Search, BookOpen, X, Command, Layout, Columns, Trash2, Check, ExternalLink } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import WordCard from "./WordCard";
import { deleteWord, toggleWordVerification } from "@/app/actions";
import { toast } from "sonner";

interface Props {
  userId: string;
  wordCount: number;
  isSuperUser: boolean;
  tacticalSuffixes: any[];
}

export default function WordSearch({ userId, wordCount, isSuperUser, tacticalSuffixes }: Props) {
  const [search, setSearch] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [prefixResults, setPrefixResults] = useState<any[]>([]);
  const [suffixResults, setSuffixResults] = useState<any[]>([]);
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
      setPrefixResults(prev => updateList(prev));
      setSuffixResults(prev => updateList(prev));
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
      setPrefixResults(prev => filterList(prev));
      setSuffixResults(prev => filterList(prev));
    } else {
      toast.error(result.error || "Failed to reject word");
    }
  };

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
        const promises: Promise<any>[] = [
          fetch(`/api/search?q=${encodeURIComponent(search.trim())}&mode=prefix`, {
            headers: { Authorization: `Bearer ${userId}` },
          }),
          fetch(`/api/search?q=${encodeURIComponent(search.trim())}&mode=suffix`, {
            headers: { Authorization: `Bearer ${userId}` },
          })
        ];

        const [pRes, sRes] = await Promise.all(promises);

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
  }, [search, userId]);


  const groupedPrefix = prefixResults.reduce((acc, wordObj: any) => {
    const word = (wordObj.word || wordObj).toUpperCase();
    
    // Find the first matching suffix (tacticalSuffixes is sorted by Length DESC)
    let matchedSuffix = null;
    for (const ts of tacticalSuffixes) {
      if (word.endsWith(ts.suffix)) {
        matchedSuffix = ts.suffix;
        break; // Unique assignment: first match (longest) wins
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
  }, {} as Record<string, { words: any[], tier: number }>);

  const sortedPrefixSuffixes = Object.keys(groupedPrefix).sort((a, b) => {
    if (a === "Other") return 1;
    if (b === "Other") return -1;
    const groupA = groupedPrefix[a];
    const groupB = groupedPrefix[b];
    if (groupA.tier !== groupB.tier) return groupA.tier - groupB.tier;
    return a.localeCompare(b);
  });

  const groupedSuffix = suffixResults.reduce(
    (acc, wordObj: any) => {
      const word = wordObj.word || wordObj;
      const letter = word[0].toUpperCase();
      if (!acc[letter]) acc[letter] = [];
      acc[letter].push(wordObj);
      return acc;
    },
    {} as Record<string, any[]>
  );

  const sortedSuffixLetters = Object.keys(groupedSuffix).sort();
  
  return (
    <div className="w-full relative z-10 space-y-8 pb-20">
      <div className="sticky top-20 z-20 pb-4 -mx-4 px-4 bg-neutral-950/80 backdrop-blur-md">
        <div className="max-w-3xl mx-auto w-full relative group">
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

            {search && !isSearching && (
              <div className="px-4 py-1.5 border-t border-white/5 bg-white/[0.02] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="text-[10px] font-bold text-white tracking-widest uppercase flex items-center gap-2">
                  <span className="w-1 h-1 rounded-full bg-rose-500 animate-pulse" />
                  {(prefixResults.length + suffixResults.length).toLocaleString()} matches found
                </div>
                
                <div className="flex items-center flex-wrap gap-4">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.5)]" />
                    <span className="text-[9px] font-black text-emerald-400/80 uppercase tracking-tighter">Verified</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_5px_rgba(244,63,94,0.5)]" />
                    <span className="text-[9px] font-black text-rose-400/80 uppercase tracking-tighter">Prefix Match</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-orange-500 shadow-[0_0_5px_rgba(251,146,60,0.5)]" />
                    <span className="text-[9px] font-black text-orange-400/80 uppercase tracking-tighter">Suffix Match</span>
                  </div>
                </div>
              </div>
            )}
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
      </div>

      <div className={`grid grid-cols-1 ${showSuffix ? "md:grid-cols-2" : "md:grid-cols-1"} gap-6 min-h-[60vh] border-t border-white/5 pt-8`}>
        <div className={`space-y-6 p-6 rounded-2xl bg-rose-500/[0.02] border border-rose-500/20 shadow-[0_0_30px_rgba(244,63,94,0.05)] transition-all duration-500 ${!showSuffix ? "col-span-full" : ""}`}>
          <div className="flex flex-col border-b border-rose-500/10 pb-4 gap-4 min-h-[140px] justify-end">
            <div className="flex items-center gap-6 w-full flex-wrap">
              <div className="flex items-center gap-3">
                <h2 className="text-4xl font-black text-rose-400 italic tracking-tighter drop-shadow-[0_0_15px_rgba(244,63,94,0.2)]">PREFIX</h2>
                {!showSuffix && (
                  <Badge variant="outline" className="bg-rose-500/10 text-rose-400 border-rose-500/20 text-[10px] font-black tracking-widest uppercase">Full Width</Badge>
                )}
              </div>
              
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
                      className="flex items-center justify-center px-2 h-6 rounded bg-white/5 border border-white/10 text-[9px] font-black text-white/80 hover:bg-white/10 hover:text-white transition-all duration-200 active:scale-95 cursor-pointer uppercase"
                    >
                      Other
                    </button>
                  )}
                </div>
              )}
            </div>
            
            <div className="text-[10px] font-black text-white tracking-widest uppercase flex items-center gap-2">
              <span className="opacity-80 whitespace-nowrap italic">Starts with</span>
              <span className="px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20 shadow-inner font-mono">&quot;{search}&quot;</span>
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
                    <X className="w-6 h-6 text-rose-500 opacity-80" />
                  </div>
                  <p className="text-sm font-black text-white tracking-widest uppercase opacity-80">No prefix results</p>
                  <p className="text-[10px] text-white/60 mt-1 font-bold italic">Try a different letter combination</p>
                </div>
              </div>
            ) : null}
          </div>
        </div>

        {showSuffix && (
          <div className="space-y-6 p-6 rounded-2xl bg-orange-500/[0.02] border border-orange-500/20 shadow-[0_0_30px_rgba(251,146,60,0.05)] animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="flex flex-col border-b border-orange-500/10 pb-4 gap-4 min-h-[140px] justify-end">
              <div className="flex items-center gap-6 w-full flex-wrap">
                <div className="flex items-center gap-3">
                  <h2 className="text-4xl font-black text-orange-400 italic tracking-tighter drop-shadow-[0_0_15px_rgba(251,146,60,0.2)]">SUFFIX</h2>
                </div>
                
                <div className="text-[10px] font-black text-white tracking-widest uppercase flex items-center gap-2">
                  <span className="opacity-80 whitespace-nowrap italic">Ends with</span>
                  <span className="px-1.5 py-0.5 rounded bg-orange-500/10 text-orange-400 border border-orange-500/20 shadow-inner font-mono">&quot;{search}&quot;</span>
                </div>
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
                      <X className="w-6 h-6 text-orange-500 opacity-80" />
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
        <div className="flex flex-col items-center justify-center py-32 text-white/80">
          <BookOpen className="w-16 h-16 mb-4 opacity-40" />
          <p className="text-lg font-black tracking-widest uppercase italic font-mono">
            Search {wordCount.toLocaleString()} active tokens
          </p>
        </div>
      )}
    </div>
  );
}
