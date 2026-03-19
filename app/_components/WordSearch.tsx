"use client";

import { useState, useEffect, useRef } from "react";
import { Search, BookOpen, X, Command, Layout, Columns, ClipboardCheck, Trash2, Check, ExternalLink } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import WordCard from "./WordCard";
import { getWordReviews, processWordReview, deleteWord } from "@/app/actions";
import { toast } from "sonner";

interface Props {
  userId: string;
  wordCount: number;
  isSuperUser: boolean;
}

export default function WordSearch({ userId, wordCount, isSuperUser }: Props) {
  const [search, setSearch] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [prefixResults, setPrefixResults] = useState<string[]>([]);
  const [suffixResults, setSuffixResults] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuffix, setShowSuffix] = useState(true);
  const [rightSideMode, setRightSideMode] = useState<'suffix' | 'review'>('suffix');
  const [reviews, setReviews] = useState<any[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);

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
    if (rightSideMode === 'review') {
      fetchReviews();
    }
  }, [rightSideMode]);

  const fetchReviews = async (query?: string) => {
    setLoadingReviews(true);
    try {
      const data = await getWordReviews(1, 100, query);
      setReviews(data);
    } catch (error) {
      console.error("Failed to fetch reviews:", error);
    } finally {
      setLoadingReviews(false);
    }
  };

  const handleProcessReview = async (id: string, action: 'accept' | 'reject') => {
    const result = await processWordReview(id, action);
    if (result.success) {
      toast.success(action === 'accept' ? "Word accepted!" : "Word rejected!");
      fetchReviews();
    } else {
      toast.error(result.error || "Failed to process review");
    }
  };

  const handleDeleteWord = async (id: string) => {
    if (!confirm("Are you sure you want to permanently delete this word?")) return;
    const result = await deleteWord(id);
    if (result.success) {
      toast.success("Word deleted successfully");
      // Trigger a re-search to refresh local state
      setSearch(prev => prev); 
    } else {
      toast.error(result.error || "Failed to delete word");
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

        // Also update reviews if in review mode
        if (rightSideMode === 'review') {
          fetchReviews(search.trim());
        }
      } catch (error) {
        console.error("Search failed:", error);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [search, userId, rightSideMode]);

  // Hardcoded Strategic Suffixes (Tactical Kill-Zone)
  const MAGIC_1 = ["Q", "X", "Y", "Z", "V"];
  const MAGIC_2 = ["AH", "AI", "AZ", "OX", "AX", "EX", "KS", "IA", "IF", "IR", "OI", "OH", "EA", "OA"];
  const MAGIC_3 = ["ILO", "NDO", "NDA", "TIF", "NEA"];
  const HARDCODED = ["CY", "LY", "GY", "OO", "SEA", "RD", "RS", "EI", "IC"];

  // Strategic Grouping for Prefix Results: Group by their "Deadliest Ending"
  const groupedPrefix = prefixResults.reduce((acc, wordObj: any) => {
    const word = (wordObj.word || wordObj).toUpperCase();
    const matchedSuffixes: { suffix: string; tier: number }[] = [];

    // TIER 1: HARDCODED Suffixes
    for (const h of HARDCODED) {
      if (word.endsWith(h)) matchedSuffixes.push({ suffix: `-${h}`, tier: 1 });
    }

    // TIER 1: MAGIC Strategic Suffixes
    const s3 = word.slice(-3);
    if (MAGIC_3.includes(s3)) matchedSuffixes.push({ suffix: `-${s3}`, tier: 1 });

    const s2 = word.slice(-2);
    if (MAGIC_2.includes(s2)) matchedSuffixes.push({ suffix: `-${s2}`, tier: 1 });

    const s1 = word.slice(-1);
    if (MAGIC_1.includes(s1)) matchedSuffixes.push({ suffix: `-${s1}`, tier: 1 });

    if (matchedSuffixes.length > 0) {
      const bestMatch = matchedSuffixes[0];
      if (!acc[bestMatch.suffix]) acc[bestMatch.suffix] = { words: [], tier: bestMatch.tier };
      acc[bestMatch.suffix].words.push(wordObj);
    } else {
      // TIER 2: Everything Else
      if (!acc["Other"]) acc["Other"] = { words: [], tier: 2 };
      acc["Other"].words.push(wordObj);
    }

    return acc;
  }, {} as Record<string, { words: any[], tier: number }>);

  // Sort prefix groups by tier first, then alphabetically
  const sortedPrefixSuffixes = Object.keys(groupedPrefix).sort((a, b) => {
    if (a === "Other") return 1;
    if (b === "Other") return -1;
    
    const groupA = groupedPrefix[a];
    const groupB = groupedPrefix[b];
    
    if (groupA.tier !== groupB.tier) return groupA.tier - groupB.tier;
    return a.localeCompare(b);
  });

  // Group results by first letter (for Suffix side)
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
  
  // Group reviews by first letter
  const groupedReviews = reviews.reduce(
    (acc, review: any) => {
      const letter = review.word[0].toUpperCase();
      if (!acc[letter]) acc[letter] = [];
      acc[letter].push(review);
      return acc;
    },
    {} as Record<string, any[]>
  );
  const sortedReviewLetters = Object.keys(groupedReviews).sort();
  
  return (
    <div className="w-full relative z-10 space-y-8 pb-20">
      {/* Search Bar - Fixed at top with blur */}
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
                className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-black text-white/70 hover:bg-orange-500/10 hover:border-orange-500/30 hover:text-orange-400 transition-all duration-300 active:scale-95 uppercase font-mono tracking-tighter"
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
      <div className={`grid grid-cols-1 ${showSuffix ? "md:grid-cols-2" : "md:grid-cols-1"} gap-6 min-h-[60vh] border-t border-white/5 pt-8`}>
        {/* Left Column: Prefix Grid (P) */}
        <div className={`space-y-6 p-6 rounded-2xl bg-rose-500/[0.02] border border-rose-500/20 shadow-[0_0_30px_rgba(244,63,94,0.05)] transition-all duration-500 ${!showSuffix ? "col-span-full" : ""}`}>
          <div className="flex flex-col border-b border-rose-500/10 pb-4 gap-4 min-h-[140px] justify-end">
            <div className="flex items-center gap-6 w-full flex-wrap">
              <div className="flex items-center gap-3">
                <h2 className="text-4xl font-black text-rose-400 italic tracking-tighter drop-shadow-[0_0_15px_rgba(244,63,94,0.2)]">PREFIX</h2>
                {!showSuffix && (
                  <Badge variant="outline" className="bg-rose-500/10 text-rose-400 border-rose-500/20 text-[10px] font-black tracking-widest uppercase">Full Width</Badge>
                )}
              </div>
              
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
                        key={wordObj.id || wordObj} 
                        word={wordObj.word || wordObj} 
                        search={search} 
                        searchMode="prefix" 
                        isSuperUser={isSuperUser}
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

        {/* Right Column: Suffix Grid (S) */}
        {showSuffix && (
          <div className="space-y-6 p-6 rounded-2xl bg-orange-500/[0.02] border border-orange-500/20 shadow-[0_0_30px_rgba(251,146,60,0.05)] animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="flex flex-col border-b border-orange-500/10 pb-4 gap-4 min-h-[140px] justify-end">
              <div className="flex items-center gap-6 w-full flex-wrap">
                <div className="flex items-center gap-3">
                  <h2 className="text-4xl font-black text-orange-400 italic tracking-tighter drop-shadow-[0_0_15px_rgba(251,146,60,0.2)]">
                    {rightSideMode === 'suffix' ? 'SUFFIX' : 'REVIEW'}
                  </h2>
                  {isSuperUser && (
                    <button
                      onClick={() => setRightSideMode(rightSideMode === 'suffix' ? 'review' : 'suffix')}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-orange-500/10 border border-orange-500/20 text-[10px] font-black text-orange-400 hover:bg-orange-500 hover:text-white transition-all duration-300 uppercase tracking-widest"
                    >
                      {rightSideMode === 'suffix' ? (
                        <>
                          <ClipboardCheck className="w-3 h-3" />
                          Go to Review
                        </>
                      ) : (
                        <>
                          <Columns className="w-3 h-3" />
                          Back to Suffix
                        </>
                      )}
                    </button>
                  )}
                </div>
                
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

              <div className="text-[10px] font-black text-white tracking-widest uppercase flex items-center gap-2">
                <span className="opacity-80 whitespace-nowrap italic">Ends with</span>
                <span className="px-1.5 py-0.5 rounded bg-orange-500/10 text-orange-400 border border-orange-500/20 shadow-inner font-mono">&quot;{search}&quot;</span>
              </div>
            </div>

            <div className="space-y-10">
              {rightSideMode === 'suffix' ? (
                sortedSuffixLetters.length > 0 ? (
                  sortedSuffixLetters.map((letter) => (
                    <div key={letter} id={`letter-${letter}`} className="relative scroll-mt-60 space-y-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xl font-black text-orange-400 drop-shadow-[0_0_10px_rgba(251,146,60,0.1)]">{letter}</span>
                        <div className="h-[1px] flex-1 bg-orange-500/10" />
                      </div>
                      <div className={`grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 ${!showSuffix ? "xl:grid-cols-6 2xl:grid-cols-8" : "xl:grid-cols-3"} gap-2`}>
                        {groupedSuffix[letter].map((wordObj: any) => (
                          <WordCard 
                            key={wordObj.id || wordObj} 
                            word={wordObj.word || wordObj} 
                            search={search} 
                            searchMode="suffix" 
                            isSuperUser={isSuperUser}
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
                ) : null
              ) : (
                /* Word Review Mode */
                <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  {loadingReviews ? (
                    <div className="flex items-center justify-center py-20">
                      <div className="w-6 h-6 border-2 border-orange-500/30 border-t-orange-500 rounded-full animate-spin" />
                    </div>
                  ) : sortedReviewLetters.length > 0 ? (
                    sortedReviewLetters.map((letter) => (
                      <div key={letter} id={`review-letter-${letter}`} className="relative scroll-mt-60 space-y-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xl font-black text-orange-400 drop-shadow-[0_0_10px_rgba(251,146,60,0.1)]">{letter}</span>
                          <div className="h-[1px] flex-1 bg-orange-500/10" />
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-3 gap-2">
                          {groupedReviews[letter].map((review: any) => (
                            <WordCard 
                              key={review.id} 
                              word={review.word} 
                              search={search} 
                              searchMode="prefix" 
                              isSuperUser={isSuperUser}
                              onAccept={() => handleProcessReview(review.id, 'accept')}
                              onDelete={() => handleProcessReview(review.id, 'reject')}
                            />
                          ))}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-20 text-center opacity-80">
                      <ClipboardCheck className="w-12 h-12 mx-auto mb-4 opacity-40" />
                      <p className="text-sm font-black uppercase tracking-widest italic">Queue Clear</p>
                      <p className="text-[10px] mt-1 font-bold text-white/60">No pending words for review</p>
                    </div>
                  )}
                </div>
              )}
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
