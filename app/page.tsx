"use client";

import { useState, useEffect, useMemo } from "react";
import { Search, Sparkles, BookOpen, SearchX, ShieldCheck, LogOut, ArrowRight, AlertCircle } from "lucide-react";
import { getActiveWords, validateToken } from "@/app/actions";

export default function Home() {
  const [words, setWords] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [searchMode, setSearchMode] = useState<"contains" | "prefix" | "suffix">("contains");
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [tokenInput, setTokenInput] = useState("");
  const [authError, setAuthError] = useState("");
  const [user, setUser] = useState<{username: string} | null>(null);

  // Check for saved token on load
  useEffect(() => {
    const savedToken = localStorage.getItem("sk_token");
    if (savedToken) {
      handleAuth(savedToken);
    } else {
      setIsAuthenticated(false);
      setLoading(false);
    }
  }, []);

  const handleAuth = async (token: string) => {
    setLoading(true);
    setAuthError("");
    const result = await validateToken(token);
    
    if (result.valid) {
      localStorage.setItem("sk_token", token);
      setUser({ username: result.username! });
      setIsAuthenticated(true);
      // Fetch data now that authenticated
      const allWords = await getActiveWords();
      setWords(allWords);
    } else {
      setIsAuthenticated(false);
      setAuthError(result.error || "Invalid Access Token");
      localStorage.removeItem("sk_token");
    }
    setLoading(false);
  };

  const handleLogout = () => {
    localStorage.removeItem("sk_token");
    setIsAuthenticated(false);
    setUser(null);
    setWords([]);
  };

  // Filter words optimally
  const filteredWords = useMemo(() => {
    if (!search.trim()) return [];
    const lowerSearch = search.toLowerCase();
    const results = [];
    for (let i = 0; i < words.length; i++) {
        const word = words[i].toLowerCase();
        let isMatch = false;
        if (searchMode === "contains") isMatch = word.includes(lowerSearch);
        else if (searchMode === "prefix") isMatch = word.startsWith(lowerSearch);
        else if (searchMode === "suffix") isMatch = word.endsWith(lowerSearch);

        if (isMatch) {
            results.push(words[i]);
            if (results.length >= 100) break;
        }
    }
    return results;
  }, [search, words, searchMode]);

  const getHighlightCue = (word: string, searchPrefix: string) => {
     const w = word.toLowerCase();
     const s = searchPrefix.toLowerCase();
     if (w.startsWith(s)) return "Prefix Match";
     if (w.endsWith(s)) return "Suffix Match";
     return null;
  };

  // Loading State
  if (isAuthenticated === null || (isAuthenticated && loading && words.length === 0)) {
     return (
        <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-rose-500/30 border-t-rose-500 rounded-full animate-spin"></div>
        </div>
     );
  }

  // Auth Screen
  if (!isAuthenticated) {
    return (
      <main className="min-h-screen bg-neutral-950 text-white flex flex-col items-center justify-center p-6 bg-[radial-gradient(circle_at_top_left,rgba(244,63,94,0.1),transparent_40%)]">
        <div className="w-full max-w-md space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
          <div className="text-center space-y-4">
            <div className="inline-flex p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 mb-2">
                <ShieldCheck className="w-8 h-8" />
            </div>
            <h1 className="text-4xl font-bold tracking-tight">Access Protected</h1>
            <p className="text-neutral-400">Please enter your unique access token to use the Sambung Kata cheat sheet.</p>
          </div>

          <div className="bg-neutral-900/50 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-2xl space-y-6">
            <div className="space-y-2">
                <label className="text-sm font-medium text-neutral-400 ml-1">Access Token</label>
                <div className="relative group">
                    <input 
                    type="password"
                    value={tokenInput}
                    onChange={(e) => setTokenInput(e.target.value)}
                    placeholder="sk_••••••••••••"
                    className="w-full bg-neutral-800 border border-white/10 rounded-xl px-4 py-4 text-white placeholder-neutral-600 focus:ring-2 focus:ring-rose-500 outline-none transition-all pr-12"
                    onKeyDown={(e) => e.key === 'Enter' && handleAuth(tokenInput)}
                    />
                    <button 
                      onClick={() => handleAuth(tokenInput)}
                      className="absolute right-2 top-2 bottom-2 aspect-square bg-rose-600 hover:bg-rose-500 flex items-center justify-center rounded-lg transition-colors group-hover:scale-105 active:scale-95 shadow-lg"
                    >
                        <ArrowRight className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {authError && (
                <div className="flex items-center gap-2 text-red-400 text-sm bg-red-400/5 border border-red-400/20 p-3 rounded-xl animate-in shake duration-300">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{authError}</span>
                </div>
            )}
            
            <p className="text-xs text-center text-neutral-500">
                Contact your administrator to request a new key.
            </p>
          </div>
        </div>
      </main>
    );
  }

  // Main App (Authenticated)
  return (
    <main className="min-h-screen bg-neutral-950 text-white selection:bg-rose-500/30 font-sans p-6 md:p-12 lg:p-24 flex flex-col items-center">
      
      {/* Background Decorators */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-rose-500/10 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-orange-500/10 rounded-full blur-[120px]"></div>
      </div>

      {/* Top Bar */}
      <div className="w-full max-w-4xl flex items-center justify-between mb-8 animate-in fade-in duration-500">
         <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-rose-500 to-orange-500 flex items-center justify-center font-bold text-white shadow-lg">
                {user?.username?.[0]?.toUpperCase()}
            </div>
            <div className="hidden sm:block">
                <p className="text-xs text-neutral-500">Welcome back,</p>
                <p className="text-sm font-semibold text-white">{user?.username}</p>
            </div>
         </div>
         
         <button 
           onClick={handleLogout}
           className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-neutral-400 hover:text-white transition-all text-sm font-medium"
         >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
         </button>
      </div>

      {/* Header section */}
      <div className="w-full max-w-3xl flex flex-col items-center text-center space-y-6 mb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-sm text-neutral-300 font-medium tracking-wide">
          <Sparkles className="w-4 h-4 text-rose-500" />
          <span>Authenticated Access Only</span>
        </div>
        
        <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight bg-gradient-to-br from-white via-white to-neutral-500 text-transparent bg-clip-text">
          Sambung Kata <br className="hidden md:block" />
          <span className="text-3xl md:text-4xl lg:text-5xl font-medium text-neutral-400 mt-2 block">Cheat Sheet</span>
        </h1>
      </div>

      {/* Main Search Interface */}
      <div className="w-full max-w-2xl relative z-10">
        
        {/* Search Input Container */}
        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-rose-500/20 to-orange-500/20 rounded-2xl blur-xl transition-all duration-500 opacity-0 group-focus-within:opacity-100"></div>
          
          <div className="relative bg-neutral-900/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden transition-all duration-300 ring-2 ring-transparent focus-within:ring-rose-500/50">
            <div className="flex items-center px-6 py-5">
              <Search className="w-6 h-6 text-neutral-500 mr-4" />
              <input 
                type="text" 
                placeholder="Type syllables... (e.g., 'kan')"
                className="w-full bg-transparent text-2xl text-white placeholder-neutral-600 outline-none"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                autoFocus
              />
              {loading && words.length === 0 && (
                <div className="w-5 h-5 border-2 border-rose-500/30 border-t-rose-500 rounded-full animate-spin"></div>
              )}
            </div>
            
            {/* Search Mode Filters */}
            <div className="flex items-center justify-center gap-1 sm:gap-4 p-3 bg-neutral-900/50 border-t border-white/5">
                {(["contains", "prefix", "suffix"] as const).map((mode) => (
                    <button
                        key={mode}
                        onClick={() => setSearchMode(mode)}
                        className={`px-4 py-1.5 rounded-full text-sm font-medium capitalize transition-all duration-300 ${
                            searchMode === mode 
                            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' 
                            : 'bg-transparent text-neutral-500 hover:text-neutral-300 hover:bg-white/5 border border-transparent'
                        }`}
                    >
                        {mode}
                    </button>
                ))}
            </div>
          </div>
        </div>

        {/* Results Area */}
        <div className="mt-8 transition-all duration-300">
            {!search && (
              <div className="flex flex-col items-center justify-center py-20 text-neutral-600">
                <BookOpen className="w-16 h-16 mb-4 opacity-50" />
                <p className="text-lg">Searching {words.length.toLocaleString()} active words...</p>
              </div>
            )}

            {search && filteredWords.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 text-neutral-500">
                <SearchX className="w-16 h-16 mb-4 opacity-50" />
                <p className="text-lg">No matches found for <span className="text-white font-medium">&quot;{search}&quot;</span></p>
              </div>
            )}

            {filteredWords.length > 0 && (
               <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {filteredWords.map((word, idx) => {
                    const cue = getHighlightCue(word, search);
                    return (
                        <div 
                           key={idx}
                           className={`p-4 rounded-xl border flex items-center justify-between group transition-all duration-300 hover:-translate-y-1 ${
                               cue 
                               ? 'bg-rose-500/10 border-rose-500/30 hover:shadow-[0_0_20px_rgba(244,63,94,0.15)] hover:bg-rose-500/20' 
                               : 'bg-neutral-900 border-white/5 hover:border-white/20 hover:bg-neutral-800'
                           }`}
                        >
                            <span className="text-lg font-medium text-white group-hover:text-rose-100 transition-colors">
                                {word}
                            </span>
                            {cue && (
                                <span className={`text-xs font-semibold px-2 py-1 rounded ${cue === 'Prefix Match' ? 'bg-rose-500/20 text-rose-300' : 'bg-orange-500/20 text-orange-300'}`}>
                                    {cue}
                                </span>
                            )}
                        </div>
                    )
                  })}
               </div>
            )}
            
            {filteredWords.length === 100 && (
                <div className="py-8 text-center text-neutral-500 italic">
                    Showing top 100 results. Keep typing to refine...
                </div>
            )}
        </div>
      </div>
    </main>
  );
}
