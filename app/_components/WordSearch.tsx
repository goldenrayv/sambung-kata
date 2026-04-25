"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { BookOpen, X, Command, Layout, Columns, Beaker, ShieldOff, Zap, Swords } from "lucide-react";
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
  const [searchMode, setSearchMode] = useState<"fast" | "normal">("fast");

  // Fast mode
  const [search, setSearch] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Normal mode
  const [prefixSearch, setPrefixSearch] = useState("");
  const [suffixSearch, setSuffixSearch] = useState("");
  const prefixSearchRef = useRef<HTMLInputElement>(null);

  const [prefixData, setPrefixData] = useState<{ results: any[], totalCount: number, hasMore: boolean }>({ results: [], totalCount: 0, hasMore: false });
  const [suffixData, setSuffixData] = useState<{ results: any[], totalCount: number, hasMore: boolean }>({ results: [], totalCount: 0, hasMore: false });
  const [comboData, setComboData] = useState<{ results: any[], totalCount: number, hasMore: boolean }>({ results: [], totalCount: 0, hasMore: false });
  const [isSearching, setIsSearching] = useState(false);
  const [showSuffix, setShowSuffix] = useState(true);
  const [isTestingMode, setIsTestingMode] = useState(false);
  const [isBlockMode, setIsBlockMode] = useState(false);
  const [isBrutalMode, setIsBrutalMode] = useState(false);
  const [hideRisky, setHideRisky] = useState(false);
  const [mobileTab, setMobileTab] = useState<"prefix" | "suffix">("prefix");
  const [prefixPage, setPrefixPage] = useState(1);
  const [suffixPage, setSuffixPage] = useState(1);
  const [comboPage, setComboPage] = useState(1);
  const PAGE_SIZE = 150;
  const [blockedSuffixes, setBlockedSuffixes] = useState<Set<string>>(new Set());
  const [searchHistory, setSearchHistory] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    try { return JSON.parse(localStorage.getItem("sk_search_history") || "[]"); } catch { return []; }
  });
  const [dangerousTails, setDangerousTails] = useState<Set<string>>(new Set());
  const [isDangerousLoading, setIsDangerousLoading] = useState(false);

  const abortRef = useRef<AbortController | null>(null);
  const comboAbortRef = useRef<AbortController | null>(null);

  // Focus shortcut: Tab or Cmd/Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeInput = searchMode === "fast" ? searchInputRef.current : prefixSearchRef.current;
      const isSearchFocused = document.activeElement === activeInput;

      if (
        (e.key === "Tab" && !isSearchFocused) ||
        ((e.metaKey || e.ctrlKey) && e.key === "k")
      ) {
        e.preventDefault();
        activeInput?.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [searchMode]);

  // Build dangerousTails whenever blockedSuffixes changes.
  useEffect(() => {
    if (blockedSuffixes.size === 0) {
      setDangerousTails(new Set());
      return;
    }

    setIsDangerousLoading(true);

    Promise.all(
      Array.from(blockedSuffixes).map(suffix =>
        fetch(`/api/search?q=${encodeURIComponent(suffix)}&mode=suffix&status=all`, {
          headers: { Authorization: `Bearer ${userId}` },
        }).then(r => r.ok ? r.json() : { results: [] })
      )
    ).then(allData => {
      const tails = new Set<string>();
      for (const data of allData) {
        for (const wordObj of data.results) {
          const word = (wordObj.word || wordObj).toUpperCase();
          if (word.length >= 2) tails.add(word.slice(0, 2));
          if (word.length >= 3) tails.add(word.slice(0, 3));
        }
      }
      setDangerousTails(tails);
    }).finally(() => setIsDangerousLoading(false));
  }, [blockedSuffixes, userId]);

  // Clear everything when mode changes
  useEffect(() => {
    abortRef.current?.abort();
    comboAbortRef.current?.abort();
    setSearch("");
    setPrefixSearch("");
    setSuffixSearch("");
    setPrefixData({ results: [], totalCount: 0, hasMore: false });
    setSuffixData({ results: [], totalCount: 0, hasMore: false });
    setComboData({ results: [], totalCount: 0, hasMore: false });
    setPrefixPage(1);
    setSuffixPage(1);
    setComboPage(1);
    setIsSearching(false);
  }, [searchMode]);

  const isWordRisky = (word: string): boolean => {
    if (dangerousTails.size === 0) return false;
    const w = word.toUpperCase();
    const len = w.length;
    return (
      (len >= 2 && dangerousTails.has(w.slice(-2))) ||
      (len >= 3 && dangerousTails.has(w.slice(-3)))
    );
  };

  const handleVerifyWord = async (id: string, currentStatus?: string) => {
    if (currentStatus === "verified") return;

    const result = await toggleWordVerification(id, "unverified");
    if (result.success) {
      toast.success("Word verified! ✨");
      const updateList = (list: any[]) => list.map(item =>
        item.id === id ? { ...item, isVerified: "verified" } : item
      );
      setPrefixData(prev => ({ ...prev, results: updateList(prev.results) }));
      setSuffixData(prev => ({ ...prev, results: updateList(prev.results) }));
      setComboData(prev => ({ ...prev, results: updateList(prev.results) }));
    } else {
      toast.error("Failed to verify word");
    }
  };

  const handleDeleteWord = async (id: string) => {
    if (!confirm("Reject and hide this word from search?")) return;
    const result = await deleteWord(id);
    if (result.success) {
      toast.success("Word rejected (Soft Deleted)");
      const filterList = (list: any[]) => list.filter(item => item.id !== id);
      setPrefixData(prev => ({ ...prev, results: filterList(prev.results), totalCount: prev.totalCount - 1 }));
      setSuffixData(prev => ({ ...prev, results: filterList(prev.results), totalCount: prev.totalCount - 1 }));
      setComboData(prev => ({ ...prev, results: filterList(prev.results), totalCount: prev.totalCount - 1 }));
    } else {
      toast.error(result.error || "Failed to reject word");
    }
  };

  // Fast mode: single bar drives both prefix and suffix
  useEffect(() => {
    if (searchMode !== "fast") return;

    if (!search.trim()) {
      setPrefixData({ results: [], totalCount: 0, hasMore: false });
      setSuffixData({ results: [], totalCount: 0, hasMore: false });
      setIsSearching(false);
      return;
    }

    window.scrollTo({ top: 0, behavior: "instant" });
    setPrefixPage(1);
    setSuffixPage(1);
    setIsSearching(true);

    const timer = setTimeout(() => {
      abortRef.current?.abort();
      abortRef.current = new AbortController();
      const { signal } = abortRef.current;

      const q = encodeURIComponent(search.trim());
      const status = isTestingMode ? 'testing' : 'all';
      const headers = { Authorization: `Bearer ${userId}` };

      fetch(`/api/search?q=${q}&mode=prefix&status=${status}`, { headers, signal })
        .then(r => r.ok ? r.json() : null)
        .then(pData => {
          if (!pData) return;
          setPrefixData(pData);
          setIsSearching(false);
          if (pData.totalCount > 0) {
            setSearchHistory(prev => {
              const next = [search.trim(), ...prev.filter(h => h !== search.trim())].slice(0, 8);
              localStorage.setItem("sk_search_history", JSON.stringify(next));
              return next;
            });
          }
        })
        .catch(err => { if (err?.name !== "AbortError") console.error(err); });

      if (showSuffix) {
        fetch(`/api/search?q=${q}&mode=suffix&status=${status}`, { headers, signal })
          .then(r => r.ok ? r.json() : null)
          .then(sData => { if (sData) setSuffixData(sData); })
          .catch(err => { if (err?.name !== "AbortError") console.error(err); });
      } else {
        setSuffixData({ results: [], totalCount: 0, hasMore: false });
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [search, userId, isTestingMode, showSuffix, searchMode]);

  // Normal mode: combo fetch (prefix + suffix intersection)
  useEffect(() => {
    if (searchMode !== "normal") return;

    if (!prefixSearch.trim() && !suffixSearch.trim()) {
      setComboData({ results: [], totalCount: 0, hasMore: false });
      setIsSearching(false);
      return;
    }

    setComboPage(1);
    setIsSearching(true);

    const timer = setTimeout(() => {
      comboAbortRef.current?.abort();
      comboAbortRef.current = new AbortController();
      const { signal } = comboAbortRef.current;

      const status = isTestingMode ? 'testing' : 'all';
      const pParam = prefixSearch.trim() ? `&prefix=${encodeURIComponent(prefixSearch.trim())}` : "";
      const sParam = suffixSearch.trim() ? `&suffix=${encodeURIComponent(suffixSearch.trim())}` : "";

      fetch(`/api/search?mode=combo&status=${status}${pParam}${sParam}`, {
        headers: { Authorization: `Bearer ${userId}` },
        signal,
      })
        .then(r => r.ok ? r.json() : null)
        .then(data => { if (data) { setComboData(data); setIsSearching(false); } })
        .catch(err => { if (err?.name !== "AbortError") console.error(err); });
    }, 100);

    return () => clearTimeout(timer);
  }, [prefixSearch, suffixSearch, userId, isTestingMode, searchMode]);

  // Derived query strings
  const activePrefixQuery = searchMode === "fast" ? search : prefixSearch;
  const activeSuffixQuery = searchMode === "fast" ? search : suffixSearch;

  const isPrefixPaged = activePrefixQuery.trim().length === 1;
  const isSuffixPaged = activeSuffixQuery.trim().length === 1;
  const isComboPaged = comboData.results.length > PAGE_SIZE;

  const pagedSuffixResults = useMemo(() => {
    if (!isSuffixPaged) return suffixData.results;
    return suffixData.results.slice((suffixPage - 1) * PAGE_SIZE, suffixPage * PAGE_SIZE);
  }, [suffixData.results, suffixPage, isSuffixPaged]);

  const pagedComboResults = useMemo(() => {
    if (!isComboPaged) return comboData.results;
    return comboData.results.slice((comboPage - 1) * PAGE_SIZE, comboPage * PAGE_SIZE);
  }, [comboData.results, comboPage, isComboPaged]);

  const activeTacticalSuffixes = useMemo(() =>
    isBrutalMode ? tacticalSuffixes : tacticalSuffixes.filter(ts => ts.suffix.length <= 3),
  [tacticalSuffixes, isBrutalMode]);

  const groupedPrefix = useMemo(() =>
    prefixData.results.reduce((acc: Record<string, { words: any[], tier: number }>, wordObj: any) => {
      const word = (wordObj.word || wordObj).toUpperCase();

      let matchedSuffix = null;
      for (const ts of activeTacticalSuffixes) {
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
  [prefixData.results, activeTacticalSuffixes]);

  const sortedPrefixSuffixes = useMemo(() =>
    Object.keys(groupedPrefix).sort((a, b) => {
      if (a === "Other") return 1;
      if (b === "Other") return -1;
      const groupA = groupedPrefix[a];
      const groupB = groupedPrefix[b];
      if (groupA.tier !== groupB.tier) return groupA.tier - groupB.tier;
      if (a.length !== b.length) return b.length - a.length;
      return a.localeCompare(b);
    }),
  [groupedPrefix]);

  // Paginate at the group level so no group is ever split across pages
  const prefixPageGroups = useMemo(() => {
    if (!isPrefixPaged) return [sortedPrefixSuffixes];
    const pages: string[][] = [];
    let page: string[] = [];
    let count = 0;
    for (const key of sortedPrefixSuffixes) {
      const size = groupedPrefix[key].words.length;
      if (count > 0 && count + size > PAGE_SIZE) {
        pages.push(page);
        page = [key];
        count = size;
      } else {
        page.push(key);
        count += size;
      }
    }
    if (page.length > 0) pages.push(page);
    return pages;
  }, [sortedPrefixSuffixes, groupedPrefix, isPrefixPaged]);

  const prefixTotalPages = prefixPageGroups.length;
  const suffixTotalPages = isSuffixPaged ? Math.ceil(suffixData.results.length / PAGE_SIZE) : 1;
  const comboTotalPages = isComboPaged ? Math.ceil(comboData.results.length / PAGE_SIZE) : 1;

  const groupedSuffix = useMemo(() =>
    pagedSuffixResults.reduce((acc, wordObj: any) => {
      const word = wordObj.word || wordObj;
      const letter = word[0].toUpperCase();
      if (!acc[letter]) acc[letter] = [];
      acc[letter].push(wordObj);
      return acc;
    }, {} as Record<string, any[]>),
  [pagedSuffixResults]);

  const sortedSuffixLetters = useMemo(() =>
    Object.keys(groupedSuffix).sort(),
  [groupedSuffix]);

  // Combo results: group by first letter alphabetically
  const groupedCombo = useMemo(() =>
    pagedComboResults.reduce((acc, wordObj: any) => {
      const letter = (wordObj.word || wordObj)[0].toUpperCase();
      if (!acc[letter]) acc[letter] = [];
      acc[letter].push(wordObj);
      return acc;
    }, {} as Record<string, any[]>),
  [pagedComboResults]);

  const sortedComboLetters = useMemo(() =>
    Object.keys(groupedCombo).sort(),
  [groupedCombo]);

  const VOWELS = new Set(["A", "E", "I", "O", "U"]);

  function getSuffixBadgeClass(suffixKey: string): string {
    const letters = suffixKey.replace(/^-/, "").toUpperCase();
    if (letters.length === 2) {
      const allVowels = [...letters].every(c => VOWELS.has(c));
      const allConsonants = [...letters].every(c => !VOWELS.has(c));
      if (allVowels)     return "bg-teal-500/10 border-teal-500/20 text-teal-400 hover:bg-teal-500 hover:text-white";
      if (allConsonants) return "bg-violet-500/10 border-violet-500/20 text-violet-400 hover:bg-violet-500 hover:text-white";
    }
    return "bg-orange-500/10 border-orange-500/20 text-orange-400 hover:bg-orange-500 hover:text-white";
  }

  const riskyWordCount = useMemo(() =>
    dangerousTails.size > 0
      ? prefixData.results.filter((w: any) => isWordRisky(w.word || w)).length
      : 0,
  // eslint-disable-next-line react-hooks/exhaustive-deps
  [prefixData.results, dangerousTails]);

  const effectiveShowSuffix = searchMode === "normal" ? false : showSuffix;
  const hasAnySearch = searchMode === "fast" ? !!search : (!!prefixSearch || !!suffixSearch);

  return (
    <div className="w-full relative z-10 pb-20">

      {/* Stats */}
      <div className="flex justify-center py-6">
        <div className="grid grid-cols-4 gap-2">
          <div className="flex flex-col items-center gap-1 px-3 py-3 lg:px-8 lg:py-5 rounded-2xl bg-white/[0.03] border border-white/[0.07]">
            <div className="text-[7px] lg:text-[8px] font-black text-white/30 uppercase tracking-widest">Total</div>
            <div className="text-lg lg:text-3xl font-black text-white tracking-tighter leading-none">{(wordStats.verified + wordStats.unverified + wordStats.rejected).toLocaleString()}</div>
          </div>
          <div className="flex flex-col items-center gap-1 px-3 py-3 lg:px-8 lg:py-5 rounded-2xl bg-emerald-500/[0.04] border border-emerald-500/[0.12]">
            <div className="text-[7px] lg:text-[8px] font-black text-emerald-400/60 uppercase tracking-widest">Verified</div>
            <div className="text-lg lg:text-3xl font-black text-emerald-400 tracking-tighter leading-none">{wordStats.verified.toLocaleString()}</div>
          </div>
          <div className="flex flex-col items-center gap-1 px-3 py-3 lg:px-8 lg:py-5 rounded-2xl bg-orange-500/[0.04] border border-orange-500/[0.12]">
            <div className="text-[7px] lg:text-[8px] font-black text-orange-400/60 uppercase tracking-widest">Unverified</div>
            <div className="text-lg lg:text-3xl font-black text-orange-400 tracking-tighter leading-none">{wordStats.unverified.toLocaleString()}</div>
          </div>
          <div className="flex flex-col items-center gap-1 px-3 py-3 lg:px-8 lg:py-5 rounded-2xl bg-rose-500/[0.03] border border-rose-500/[0.08]">
            <div className="text-[7px] lg:text-[8px] font-black text-rose-400/40 uppercase tracking-widest">Rejected</div>
            <div className="text-lg lg:text-3xl font-black text-rose-400/50 tracking-tighter leading-none">{wordStats.rejected.toLocaleString()}</div>
          </div>
        </div>
      </div>

      {/* Sticky: search bar(s) */}
      <div className="sticky top-20 z-20 -mx-4 px-4 pb-3 bg-neutral-950/80 backdrop-blur-md border-b border-white/5 shadow-2xl">
        <div className="max-w-4xl mx-auto pt-3 space-y-2">

          {/* Toolbar row */}
          <div className="w-full relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-rose-500/20 via-orange-500/20 to-rose-500/20 rounded-xl blur opacity-0 group-focus-within:opacity-100 transition duration-500" />
            <div className="relative bg-neutral-900 border border-white/10 rounded-xl shadow-2xl transition-all duration-300 focus-within:border-rose-500/50">
              <div className="flex items-center px-3 py-2.5 gap-2">

                {/* Fast/Normal toggle */}
                <button
                  onClick={() => setSearchMode(m => m === "fast" ? "normal" : "fast")}
                  title={searchMode === "fast" ? "Fast Mode — click for Normal Mode (prefix + suffix combined)" : "Normal Mode — click for Fast Mode"}
                  className={`p-1.5 rounded-md transition-all duration-300 shrink-0 ${
                    searchMode === "fast"
                      ? "bg-orange-500/10 border border-orange-500/30 text-orange-400 font-bold"
                      : "bg-white/5 border border-white/10 text-white/40 hover:text-white"
                  }`}
                >
                  <Zap className="w-4 h-4" />
                </button>

                {/* Show/hide suffix — fast mode only */}
                {searchMode === "fast" && (
                  <button
                    onClick={() => setShowSuffix(!showSuffix)}
                    title={showSuffix ? "Hide Suffix Results" : "Show Suffix Results"}
                    className={`p-1.5 rounded-md transition-all duration-300 shrink-0 ${
                      showSuffix
                        ? "bg-white/5 border border-white/10 text-white/40 hover:text-white"
                        : "bg-orange-500/10 border border-orange-500/30 text-orange-400 font-bold"
                    }`}
                  >
                    {showSuffix ? <Columns className="w-4 h-4" /> : <Layout className="w-4 h-4" />}
                  </button>
                )}

                <button
                  onClick={() => setIsTestingMode(!isTestingMode)}
                  title={isTestingMode ? "Testing Mode: Only Unverified Words" : "Normal Mode: All Words"}
                  className={`p-1.5 rounded-md transition-all duration-300 shrink-0 ${
                    isTestingMode
                      ? "bg-rose-500/10 border border-rose-500/30 text-rose-400 font-bold"
                      : "bg-white/5 border border-white/10 text-white/40 hover:text-white"
                  }`}
                >
                  <Beaker className="w-4 h-4" />
                </button>

                {searchMode === "fast" && (
                  <>
                    <button
                      onClick={() => {
                        setIsBlockMode(!isBlockMode);
                        if (isBlockMode) setBlockedSuffixes(new Set());
                      }}
                      title={isBlockMode ? "Strategy Block: ON — click to disable & clear" : "Strategy Block: OFF"}
                      className={`p-1.5 rounded-md transition-all duration-300 shrink-0 ${
                        isBlockMode
                          ? "bg-rose-500/10 border border-rose-500/30 text-rose-400 font-bold"
                          : "bg-white/5 border border-white/10 text-white/40 hover:text-white"
                      }`}
                    >
                      <ShieldOff className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setIsBrutalMode(!isBrutalMode)}
                      title={isBrutalMode ? "Brutal Mode: ON — showing long suffixes" : "Brutal Mode: OFF — click to show suffixes longer than 3 chars"}
                      className={`p-1.5 rounded-md transition-all duration-300 shrink-0 ${
                        isBrutalMode
                          ? "bg-red-700/20 border border-red-700/40 text-red-400 font-bold"
                          : "bg-white/5 border border-white/10 text-white/40 hover:text-white"
                      }`}
                    >
                      <Swords className="w-4 h-4" />
                    </button>
                  </>
                )}

                {/* Fast mode: single input */}
                {searchMode === "fast" && (
                  <>
                    <input
                      ref={searchInputRef}
                      type="text"
                      placeholder="Search..."
                      className="flex-1 bg-transparent text-lg font-bold text-white placeholder-white/30 border-none outline-none ring-0 shadow-none p-0 h-auto italic min-w-0"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      autoFocus
                    />
                    <div className="flex items-center gap-2 shrink-0">
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
                  </>
                )}

                {/* Normal mode label */}
                {searchMode === "normal" && (
                  <span className="flex-1 text-[10px] font-black text-white/30 uppercase tracking-widest italic">Normal Mode</span>
                )}
              </div>
            </div>
          </div>

          {/* Normal mode: two inputs */}
          {searchMode === "normal" && (
            <div className="flex gap-2">
              <div className="flex-1 relative bg-neutral-900 border border-white/10 rounded-xl shadow-lg transition-all duration-300 focus-within:border-orange-500/40">
                <div className="flex items-center px-3 py-2.5 gap-2">
                  <span className="text-[9px] font-black text-orange-400/70 uppercase tracking-widest shrink-0">PREFIX</span>
                  <input
                    ref={prefixSearchRef}
                    type="text"
                    placeholder="Starts with..."
                    className="flex-1 bg-transparent text-base font-bold text-white placeholder-white/30 border-none outline-none ring-0 shadow-none p-0 h-auto italic min-w-0"
                    value={prefixSearch}
                    onChange={(e) => setPrefixSearch(e.target.value)}
                    autoFocus
                  />
                  {prefixSearch && (
                    <button onClick={() => setPrefixSearch("")} className="p-1 hover:bg-white/10 rounded-md transition-colors text-white/40 hover:text-white shrink-0">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
              <div className="flex-1 relative bg-neutral-900 border border-white/10 rounded-xl shadow-lg transition-all duration-300 focus-within:border-orange-500/40">
                <div className="flex items-center px-3 py-2.5 gap-2">
                  <span className="text-[9px] font-black text-orange-400/70 uppercase tracking-widest shrink-0">SUFFIX</span>
                  <input
                    type="text"
                    placeholder="Ends with..."
                    className="flex-1 bg-transparent text-base font-bold text-white placeholder-white/30 border-none outline-none ring-0 shadow-none p-0 h-auto italic min-w-0"
                    value={suffixSearch}
                    onChange={(e) => setSuffixSearch(e.target.value)}
                  />
                  {suffixSearch && (
                    <button onClick={() => setSuffixSearch("")} className="p-1 hover:bg-white/10 rounded-md transition-colors text-white/40 hover:text-white shrink-0">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Suffix chips + search history — fast mode only */}
      {searchMode === "fast" && (
        <div className="max-w-4xl mx-auto px-0 pt-3 pb-1 flex flex-col gap-2">
          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide lg:flex-wrap lg:overflow-visible lg:pb-0">
            {isBlockMode && (
              <span className="px-2 py-1 text-[9px] font-black text-rose-400/60 uppercase tracking-widest self-center shrink-0">
                Block:
              </span>
            )}
            {tacticalSuffixes.filter(ts => isBrutalMode || ts.suffix.length <= 3).map((ts) => {
              const isBlocked = blockedSuffixes.has(ts.suffix);
              return (
                <button
                  key={ts.id}
                  onClick={() => {
                    if (isBlockMode) {
                      setBlockedSuffixes(prev => {
                        const next = new Set(prev);
                        isBlocked ? next.delete(ts.suffix) : next.add(ts.suffix);
                        return next;
                      });
                    } else {
                      setSearch(ts.suffix);
                    }
                  }}
                  className={`shrink-0 px-2.5 py-0.5 rounded-full text-[10px] font-black transition-all duration-300 active:scale-95 uppercase font-mono tracking-tighter ${
                    isBlocked
                      ? "bg-rose-500/20 border border-rose-500/40 text-rose-400 line-through"
                      : isBlockMode
                        ? "bg-sky-500/10 border border-sky-500/30 text-sky-400 hover:bg-rose-500/20 hover:border-rose-500/40 hover:text-rose-400"
                        : "bg-sky-500/10 border border-sky-500/30 text-sky-400 hover:bg-sky-500 hover:text-white"
                  }`}
                >
                  -{ts.suffix}
                </button>
              );
            })}
          </div>

          {searchHistory.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[9px] font-black text-white/20 uppercase tracking-widest">Recent:</span>
              {searchHistory.map(h => (
                <button
                  key={h}
                  onClick={() => setSearch(h)}
                  className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[9px] font-black text-white/40 hover:text-white hover:border-white/30 transition-all uppercase tracking-wider"
                >
                  {h}
                </button>
              ))}
              <button
                onClick={() => {
                  setSearchHistory([]);
                  localStorage.removeItem("sk_search_history");
                }}
                className="text-[9px] font-black text-white/20 hover:text-rose-400 transition-colors uppercase tracking-widest"
              >
                Clear
              </button>
            </div>
          )}
        </div>
      )}

      <div className="mt-4 border-t border-white/5 pt-4">

        {/* Fast mode: mobile tab switcher */}
        {searchMode === "fast" && effectiveShowSuffix && (
          <div className="flex lg:hidden gap-2 mb-4">
            <button
              onClick={() => setMobileTab("prefix")}
              className={`flex-1 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${
                mobileTab === "prefix"
                  ? "bg-orange-500/20 border border-orange-500/40 text-orange-400"
                  : "bg-white/5 border border-white/10 text-white/40"
              }`}
            >
              Prefix <span className="opacity-60">{prefixData.totalCount > 0 ? prefixData.totalCount.toLocaleString() : ""}</span>
            </button>
            <button
              onClick={() => setMobileTab("suffix")}
              className={`flex-1 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${
                mobileTab === "suffix"
                  ? "bg-orange-500/20 border border-orange-500/40 text-orange-400"
                  : "bg-white/5 border border-white/10 text-white/40"
              }`}
            >
              Suffix <span className="opacity-60">{suffixData.totalCount > 0 ? suffixData.totalCount.toLocaleString() : ""}</span>
            </button>
          </div>
        )}

        {/* Legend — hidden on mobile */}
        <div className="hidden lg:flex items-center justify-center gap-6 mb-8 py-3 px-6 rounded-2xl bg-white/[0.01] border border-white/[0.05] w-fit mx-auto">
          <div className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">Status Legend</div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
            <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Verified</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(251,146,60,0.5)]" />
            <span className="text-[10px] font-black text-orange-400 uppercase tracking-widest">Unverified</span>
          </div>
          {dangerousTails.size > 0 && (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]" />
              <span className="text-[10px] font-black text-rose-400 uppercase tracking-widest">Risky</span>
            </div>
          )}
        </div>

        {/* ── NORMAL MODE: single combo results panel ── */}
        {searchMode === "normal" && (
          <div className="space-y-6 p-4 lg:p-6 rounded-2xl bg-orange-500/5 border border-orange-500/20 shadow-[0_0_30px_rgba(251,146,60,0.05)] min-h-[60vh]">
            <div className="flex flex-col border-b border-orange-500/10 pb-4 px-1">
              <div className="flex items-center gap-3 pt-2 mb-4">
                <h2 className="text-3xl lg:text-4xl font-black text-orange-400 italic tracking-tighter drop-shadow-[0_0_15px_rgba(251,146,60,0.2)] uppercase">RESULTS</h2>
              </div>
              <div className="flex items-center justify-between w-full pt-3 border-t border-orange-500/5">
                <div className="flex items-center gap-2 flex-wrap text-[10px] font-black text-white/60 uppercase tracking-widest">
                  {prefixSearch && (
                    <span className="flex items-center gap-1">
                      <span className="text-white/30">starts</span>
                      <span className="px-1.5 py-0.5 rounded bg-orange-500/10 text-orange-400 border border-orange-500/20 font-mono">&quot;{prefixSearch}&quot;</span>
                    </span>
                  )}
                  {prefixSearch && suffixSearch && <span className="text-white/20">+</span>}
                  {suffixSearch && (
                    <span className="flex items-center gap-1">
                      <span className="text-white/30">ends</span>
                      <span className="px-1.5 py-0.5 rounded bg-orange-500/10 text-orange-400 border border-orange-500/20 font-mono">&quot;{suffixSearch}&quot;</span>
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black text-orange-400/60 uppercase tracking-widest">{comboData.totalCount.toLocaleString()} TOTAL</span>
                  {comboData.hasMore && (
                    <Badge variant="outline" className="bg-orange-500/10 text-orange-400 border-orange-500/20 text-[9px] font-black animate-pulse">
                      + MORE (Reach Limit)
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Combo pagination */}
            {isComboPaged && comboTotalPages > 1 && (
              <div className="flex items-center justify-between gap-2">
                <button
                  onClick={() => { setComboPage(p => Math.max(1, p - 1)); window.scrollTo({ top: 0, behavior: 'instant' }); }}
                  disabled={comboPage === 1}
                  className="flex-1 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest bg-white/5 border border-white/10 text-white/50 hover:text-white hover:border-white/30 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  ← Prev
                </button>
                <span className="text-[10px] font-black text-white/40 uppercase tracking-widest whitespace-nowrap">
                  {comboPage} / {comboTotalPages}
                </span>
                <button
                  onClick={() => { setComboPage(p => Math.min(comboTotalPages, p + 1)); window.scrollTo({ top: 0, behavior: 'instant' }); }}
                  disabled={comboPage === comboTotalPages}
                  className="flex-1 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest bg-white/5 border border-white/10 text-white/50 hover:text-white hover:border-white/30 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  Next →
                </button>
              </div>
            )}

            <div className={`space-y-10 transition-opacity duration-150 ${isSearching ? "opacity-40 pointer-events-none" : "opacity-100"}`}>
              {sortedComboLetters.length > 0 ? (
                sortedComboLetters.map((letter) => (
                  <div key={letter} className="space-y-3">
                    <div className="flex items-center gap-2 px-1">
                      <span className="text-xl font-black text-orange-400/80">{letter}</span>
                      <div className="h-[1px] flex-1 bg-orange-500/10" />
                      <span className="text-[9px] font-black text-white/20 uppercase tracking-widest">{groupedCombo[letter].length}</span>
                    </div>
                    <div className="flex flex-wrap gap-2 content-start">
                      {groupedCombo[letter].map((wordObj: any) => (
                        <WordCard
                          key={wordObj.id}
                          word={wordObj.word}
                          search={prefixSearch || suffixSearch}
                          searchMode={prefixSearch ? "prefix" : "suffix"}
                          isSuperUser={isSuperUser}
                          isVerified={wordObj.isVerified}
                          onAccept={isSuperUser ? () => handleVerifyWord(wordObj.id, wordObj.isVerified) : undefined}
                          onDelete={isSuperUser ? () => handleDeleteWord(wordObj.id) : undefined}
                        />
                      ))}
                    </div>
                  </div>
                ))
              ) : (hasAnySearch && !isSearching) ? (
                <div className="py-20 text-center animate-in fade-in zoom-in duration-500">
                  <div className="inline-flex flex-col items-center">
                    <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-4 border border-white/10">
                      <X className="w-6 h-6 text-orange-400 opacity-80" />
                    </div>
                    <p className="text-sm font-black text-white tracking-widest uppercase opacity-80">No results</p>
                    <p className="text-[10px] text-white/60 mt-1 font-bold italic">Try a different combination</p>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        )}

        {/* ── FAST MODE: prefix + suffix panels ── */}
        {searchMode === "fast" && (
          <div className={`grid grid-cols-1 ${effectiveShowSuffix ? "lg:grid-cols-2" : ""} gap-6 items-start min-h-[60vh]`}>
          {/* Prefix Container */}
          <div className={`space-y-6 p-4 lg:p-6 rounded-2xl bg-orange-500/5 border border-orange-500/20 shadow-[0_0_30px_rgba(251,146,60,0.05)] transition-all duration-500 flex-1 ${!effectiveShowSuffix ? "col-span-full" : ""} ${effectiveShowSuffix && mobileTab !== "prefix" ? "hidden lg:block" : ""}`}>
            <div className="flex flex-col border-b border-orange-500/10 pb-4 px-1">
              <div className="flex-1 space-y-4">
                <div className="flex items-center gap-3 h-10 pt-2">
                  <h2 className="text-3xl lg:text-4xl font-black text-orange-400 italic tracking-tighter drop-shadow-[0_0_15px_rgba(251,146,60,0.2)] uppercase">PREFIX</h2>
                  {!effectiveShowSuffix && (
                    <Badge variant="outline" className="bg-orange-500/10 text-orange-400 border-orange-500/20 text-[10px] font-black tracking-widest uppercase">Full Width</Badge>
                  )}
                </div>

                <div className="min-h-[32px] flex items-center">
                  {isSearching ? (
                    <div className="flex items-center gap-2 animate-pulse">
                      <div className="w-2 h-2 rounded-full bg-orange-500/40" />
                      <div className="h-2 w-24 bg-orange-500/20 rounded" />
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2 group/nav">
                      {(prefixPageGroups[prefixPage - 1] ?? []).map((suffix) => (
                        <button
                          key={suffix}
                          onClick={() => {
                            const el = document.getElementById(`prefix-group-${suffix}`);
                            el?.scrollIntoView({ behavior: 'instant', block: 'center' });
                          }}
                          className={`flex items-center gap-1.5 px-2 h-6 rounded border text-[9px] font-black transition-all duration-200 active:scale-95 cursor-pointer uppercase ${getSuffixBadgeClass(suffix)}`}
                        >
                          {suffix}
                          <span className="opacity-50 font-medium">{groupedPrefix[suffix].words.length}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between w-full pt-4 border-t border-orange-500/5 mt-auto">
                <div className="text-[10px] font-black text-white tracking-widest uppercase flex items-center gap-2">
                  <span className="opacity-80 whitespace-nowrap italic">Starts with</span>
                  <span className="px-1.5 py-0.5 rounded bg-orange-500/10 text-orange-400 border border-orange-500/20 shadow-inner font-mono">&quot;{search}&quot;</span>
                </div>
                <div className="flex items-center gap-2">
                  {isDangerousLoading && (
                    <span className="text-[9px] font-black text-rose-400/60 uppercase tracking-widest animate-pulse">Analyzing...</span>
                  )}
                  {!isDangerousLoading && riskyWordCount > 0 && (
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-black text-rose-400/80 uppercase tracking-widest">{riskyWordCount} risky</span>
                      <button
                        onClick={() => setHideRisky(!hideRisky)}
                        className={`text-[9px] font-black uppercase tracking-widest underline transition-colors ${hideRisky ? "text-rose-400" : "text-rose-400/60 hover:text-rose-400"}`}
                      >
                        {hideRisky ? "Show" : "Hide"}
                      </button>
                      <button
                        onClick={() => setBlockedSuffixes(new Set())}
                        className="text-[9px] font-black text-rose-400/60 hover:text-rose-400 uppercase tracking-widest underline transition-colors"
                      >
                        Clear
                      </button>
                    </div>
                  )}
                  <span className="text-[10px] font-black text-orange-400/60 uppercase tracking-widest">{prefixData.totalCount.toLocaleString()} TOTAL</span>
                  {prefixData.hasMore && (
                    <Badge variant="outline" className="bg-orange-500/10 text-orange-400 border-orange-500/20 text-[9px] font-black animate-pulse">
                      + MORE (Reach Limit)
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {isPrefixPaged && prefixTotalPages > 1 && (
              <div className="flex items-center justify-between gap-2">
                <button
                  onClick={() => { setPrefixPage(p => Math.max(1, p - 1)); window.scrollTo({ top: 0, behavior: 'instant' }); }}
                  disabled={prefixPage === 1}
                  className="flex-1 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest bg-white/5 border border-white/10 text-white/50 hover:text-white hover:border-white/30 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  ← Prev
                </button>
                <span className="text-[10px] font-black text-white/40 uppercase tracking-widest whitespace-nowrap">
                  {prefixPage} / {prefixTotalPages}
                </span>
                <button
                  onClick={() => { setPrefixPage(p => Math.min(prefixTotalPages, p + 1)); window.scrollTo({ top: 0, behavior: 'instant' }); }}
                  disabled={prefixPage === prefixTotalPages}
                  className="flex-1 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest bg-white/5 border border-white/10 text-white/50 hover:text-white hover:border-white/30 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  Next →
                </button>
              </div>
            )}

            <div className={`space-y-10 transition-opacity duration-150 ${isSearching ? "opacity-40 pointer-events-none" : "opacity-100"}`}>
              {(prefixPageGroups[prefixPage - 1] ?? []).length > 0 ? (
                (prefixPageGroups[prefixPage - 1] ?? []).map((suffix) => (
                  <div key={suffix} id={`prefix-group-${suffix}`} className="relative scroll-mt-60 space-y-3">
                    <div className="flex items-center justify-between gap-2 px-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xl font-black text-orange-400/80 drop-shadow-[0_0_10px_rgba(251,146,60,0.1)]">
                          {suffix.toUpperCase()}
                          <span className="text-[10px] ml-2 opacity-50 font-medium uppercase tracking-widest italic">
                            ({groupedPrefix[suffix].words.length} words{prefixData.hasMore && suffix === (prefixPageGroups[prefixPage - 1] ?? [])[prefixPageGroups[prefixPage - 1]?.length - 1] ? ", and more" : ""})
                          </span>
                        </span>
                        <div className="h-[1px] w-12 bg-orange-500/10" />
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 content-start">
                      {groupedPrefix[suffix].words.filter((wordObj: any) => !(hideRisky && isWordRisky(wordObj.word))).map((wordObj: any) => {
                        const risky = isWordRisky(wordObj.word);
                        return (
                          <div
                            key={wordObj.id}
                            className={risky ? "rounded-lg ring-1 ring-rose-500/50 shadow-[0_0_8px_rgba(244,63,94,0.15)]" : ""}
                          >
                            <WordCard
                              word={wordObj.word}
                              search={search}
                              searchMode="prefix"
                              isSuperUser={isSuperUser}
                              isVerified={wordObj.isVerified}
                              onAccept={isSuperUser ? () => handleVerifyWord(wordObj.id, wordObj.isVerified) : undefined}
                              onDelete={isSuperUser ? () => handleDeleteWord(wordObj.id) : undefined}
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))
              ) : (search && !isSearching) ? (
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
          {effectiveShowSuffix && (
            <div className={`space-y-6 p-4 lg:p-6 rounded-2xl bg-orange-500/5 border border-orange-500/20 shadow-[0_0_30px_rgba(251,146,60,0.05)] flex-1 animate-in fade-in slide-in-from-right-4 duration-500 ${mobileTab !== "suffix" ? "hidden lg:block" : ""}`}>
              <div className="flex flex-col border-b border-orange-500/10 pb-4 px-1">
                <div className="flex-1 space-y-4">
                  <div className="flex items-center gap-3 pt-2">
                    <h2 className="text-3xl lg:text-4xl font-black text-orange-400 italic tracking-tighter drop-shadow-[0_0_15px_rgba(251,146,60,0.2)] uppercase">SUFFIX</h2>
                  </div>
                </div>

                <div className="flex items-center justify-between w-full pt-4 border-t border-orange-500/5 mt-auto">
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

              {isSuffixPaged && suffixTotalPages > 1 && (
                <div className="flex items-center justify-between gap-2">
                  <button
                    onClick={() => { setSuffixPage(p => Math.max(1, p - 1)); window.scrollTo({ top: 0, behavior: 'instant' }); }}
                    disabled={suffixPage === 1}
                    className="flex-1 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest bg-white/5 border border-white/10 text-white/50 hover:text-white hover:border-white/30 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  >
                    ← Prev
                  </button>
                  <span className="text-[10px] font-black text-white/40 uppercase tracking-widest whitespace-nowrap">
                    {suffixPage} / {suffixTotalPages}
                  </span>
                  <button
                    onClick={() => { setSuffixPage(p => Math.min(suffixTotalPages, p + 1)); window.scrollTo({ top: 0, behavior: 'instant' }); }}
                    disabled={suffixPage === suffixTotalPages}
                    className="flex-1 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest bg-white/5 border border-white/10 text-white/50 hover:text-white hover:border-white/30 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  >
                    Next →
                  </button>
                </div>
              )}

              <div className={`space-y-10 transition-opacity duration-150 ${isSearching ? "opacity-40 pointer-events-none" : "opacity-100"}`}>
                {sortedSuffixLetters.length > 0 ? (
                  sortedSuffixLetters.map((letter) => (
                    <div key={letter} id={`letter-${letter}`} className="relative scroll-mt-60 space-y-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xl font-black text-orange-400/80 drop-shadow-[0_0_10px_rgba(251,146,60,0.1)]">{letter}</span>
                        <div className="h-[1px] flex-1 bg-orange-500/10" />
                      </div>
                      <div className="flex flex-wrap gap-2 content-start">
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
                ) : (search && !isSearching) ? (
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
        )}
      </div>

      {!hasAnySearch && (
        <div className="flex flex-col items-center justify-center py-32 gap-4 text-white/80">
          <BookOpen className="w-16 h-16 opacity-20" />
          <div className="text-center space-y-1">
            <p className="text-lg font-black tracking-widest uppercase italic font-mono opacity-60">
              {wordCount.toLocaleString()} active tokens
            </p>
            <p className="text-[11px] font-bold text-white/30 uppercase tracking-widest">
              {searchMode === "fast"
                ? "Type a word or tap a suffix above to begin"
                : "Type prefix, suffix, or both to find matching words"}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
