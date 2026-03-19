"use client";

import { useState, useEffect } from "react";
import { loginUser, getWordCount, changePassword } from "@/app/actions";
import AuthScreen from "./_components/AuthScreen";
import TopBar from "./_components/TopBar";
import WordSearch from "./_components/WordSearch";
import { toast } from "sonner";

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<{ id: string; username: string; expiresAt: Date; isSuperUser: boolean } | null>(null);
  const [wordCount, setWordCount] = useState(0);
  const [mustChangePassword, setMustChangePassword] = useState(false);

  // Restore session from localStorage on mount
  useEffect(() => {
    const savedId = localStorage.getItem("sk_user_id");
    const savedUsername = localStorage.getItem("sk_username");
    const savedExpiry = localStorage.getItem("sk_expires_at");

    const savedSuper = localStorage.getItem("sk_is_superuser") === "true";
    if (savedId && savedUsername && savedExpiry) {
      setUser({ 
        id: savedId, 
        username: savedUsername, 
        expiresAt: new Date(savedExpiry),
        isSuperUser: savedSuper
      });
      setIsAuthenticated(true);
      fetchWordCount();
      setLoading(false);
    } else {
      setIsAuthenticated(false);
      setLoading(false);
    }
  }, []);

  const fetchWordCount = async () => {
    const count = await getWordCount();
    setWordCount(count);
  };

  const handleAuth = async (username: string, password: string) => {
    setLoading(true);
    const result = await loginUser(username, password);

    if (result.success) {
      if (result.mustChangePassword) {
        setMustChangePassword(true);
        setUser({ 
            id: result.userId!, 
            username: username, 
            expiresAt: result.expiresAt!,
            isSuperUser: !!result.isSuperUser
        });
        setIsAuthenticated(false); // Stay on auth screen but in "change password" mode
      } else {
        localStorage.setItem("sk_user_id", result.userId!);
        localStorage.setItem("sk_username", username);
        localStorage.setItem("sk_expires_at", result.expiresAt!.toISOString());
        localStorage.setItem("sk_is_superuser", result.isSuperUser ? "true" : "false");
        
        setUser({ 
            id: result.userId!, 
            username: username, 
            expiresAt: result.expiresAt!,
            isSuperUser: !!result.isSuperUser
        });
        setIsAuthenticated(true);
        fetchWordCount();
      }
    } else {
      setIsAuthenticated(false);
      toast.error(result.error || "Authentication failed");
    }
    setLoading(false);
  };

  const handleChangePassword = async (current: string, newPass: string) => {
    if (!user?.id) return;
    setLoading(true);
    
    const result = await changePassword(user.id, current, newPass);
    if (result.success) {
      toast.success("Password updated successfully! Please login with your new password.");
      setMustChangePassword(false);
      setUser(null);
      setIsAuthenticated(false);
    } else {
      toast.error(result.error || "Failed to change password");
    }
    setLoading(false);
  };

  const handleLogout = () => {
    localStorage.removeItem("sk_user_id");
    localStorage.removeItem("sk_username");
    localStorage.removeItem("sk_expires_at");
    localStorage.removeItem("sk_is_superuser");
    setIsAuthenticated(false);
    setUser(null);
    setMustChangePassword(false);
  };

  // Loading spinner
  if (isAuthenticated === null || (isAuthenticated && loading)) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-rose-500/30 border-t-rose-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated || mustChangePassword) {
    return (
      <AuthScreen
        loading={loading}
        onAuth={handleAuth}
        mustChangePassword={mustChangePassword}
        onChangePassword={handleChangePassword}
        initialUsername={user?.username}
      />
    );
  }

  return (
    <main className="min-h-screen bg-neutral-950 text-white selection:bg-rose-500/30 font-sans p-4 md:p-6 w-full px-4 md:px-8">
      {/* Background glow decorators */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-rose-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-orange-500/10 rounded-full blur-[120px]" />
      </div>

      <TopBar
        username={user!.username}
        isSuperUser={user!.isSuperUser}
        expiresAt={user!.expiresAt}
        onLogout={handleLogout}
      />
      <WordSearch userId={user!.id} wordCount={wordCount} isSuperUser={user!.isSuperUser} />
    </main>
  );
}

