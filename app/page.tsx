"use client";

import { useState, useEffect } from "react";
import { validateToken, getWordCount } from "@/app/actions";
import AuthScreen from "./_components/AuthScreen";
import TopBar from "./_components/TopBar";
import WordSearch from "./_components/WordSearch";

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [tokenInput, setTokenInput] = useState("");
  const [authError, setAuthError] = useState("");
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<{ username: string } | null>(null);
  const [wordCount, setWordCount] = useState(0);
  const [token, setToken] = useState("");

  // Restore session from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("sk_token");
    if (saved) {
      handleAuth(saved);
    } else {
      setIsAuthenticated(false);
      setLoading(false);
    }
  }, []);

  const handleAuth = async (rawToken: string) => {
    setLoading(true);
    setAuthError("");
    const result = await validateToken(rawToken);

    if (result.valid) {
      localStorage.setItem("sk_token", rawToken);
      setToken(rawToken);
      setUser({ username: result.username! });
      setIsAuthenticated(true);
      setWordCount(await getWordCount());
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
    setToken("");
    setUser(null);
  };

  // Loading spinner
  if (isAuthenticated === null || (isAuthenticated && loading)) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-rose-500/30 border-t-rose-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <AuthScreen
        tokenInput={tokenInput}
        setTokenInput={setTokenInput}
        authError={authError}
        loading={loading}
        onAuth={handleAuth}
      />
    );
  }

  return (
    <main className="min-h-screen bg-neutral-950 text-white selection:bg-rose-500/30 font-sans p-4 md:p-6 flex flex-col items-center">
      {/* Background glow decorators */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-rose-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-orange-500/10 rounded-full blur-[120px]" />
      </div>

      <TopBar username={user!.username} onLogout={handleLogout} />
      <WordSearch token={token} wordCount={wordCount} />
    </main>
  );
}
