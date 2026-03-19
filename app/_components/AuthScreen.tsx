"use client";

import { useState } from "react";
import { ArrowRight, AlertCircle, ShieldCheck, User, Lock, KeyRound, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface Props {
  loading: boolean;
  onAuth: (username: string, password: string) => void;
  mustChangePassword?: boolean;
  onChangePassword?: (current: string, newPass: string) => void;
  initialUsername?: string;
}

export default function AuthScreen({
  loading,
  onAuth,
  mustChangePassword = false,
  onChangePassword,
  initialUsername = "",
}: Props) {
  const [username, setUsername] = useState(initialUsername);
  const [password, setPassword] = useState("");
  
  // Change Password State
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [showForgotMessage, setShowForgotMessage] = useState(false);

  const handleLogin = () => {
    if (!username || !password) {
      setError("Please enter both username and password.");
      return;
    }
    setError("");
    onAuth(username, password);
  };

  const handleChangePassword = () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError("Please fill in all fields.");
      return;
    }
    if (newPassword.length < 6) {
      setError("New password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setError("");
    onChangePassword?.(currentPassword, newPassword);
  };

  return (
    <main className="min-h-screen bg-neutral-950 text-white flex flex-col items-center justify-center p-6 bg-[radial-gradient(circle_at_top_left,rgba(244,63,94,0.1),transparent_40%)]">
      <div className="w-full max-w-md space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
        <div className="text-center space-y-4">
          <div className="inline-flex p-4 rounded-3xl bg-rose-500/10 border border-rose-500/20 text-rose-500 mb-2 shadow-[0_0_30px_rgba(244,63,94,0.1)]">
            {mustChangePassword ? <KeyRound className="w-8 h-8" /> : <ShieldCheck className="w-8 h-8" />}
          </div>
          <h1 className="text-4xl font-black tracking-tight font-heading">
            {mustChangePassword ? "Security Update" : "Terminal Access"}
          </h1>
          <p className="text-white/70 text-sm font-black uppercase tracking-widest italic">
            {mustChangePassword 
              ? "Mandatory password rotation required" 
              : "Authentication required to enter core system"}
          </p>
        </div>

        <Card className="bg-neutral-900/40 backdrop-blur-2xl border-white/5 shadow-2xl overflow-hidden rounded-[40px]">
          <CardContent className="p-10 space-y-8">
            {!mustChangePassword ? (
              // Login Form
              <div className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-white/60 ml-1">Identity Node</label>
                    <div className="relative group">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 group-focus-within:text-rose-500 transition-colors" />
                      <Input
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="Username"
                        className="w-full bg-white/[0.02] border-white/5 rounded-2xl pl-12 pr-4 py-7 text-white placeholder-white/40 focus:ring-rose-500/20 focus:border-rose-500/40 outline-none transition-all text-lg font-bold tracking-tight"
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-white/60 ml-1">Access Key</label>
                    <div className="relative group">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 group-focus-within:text-rose-500 transition-colors" />
                      <Input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-white/[0.02] border-white/5 rounded-2xl pl-12 pr-4 py-7 text-white placeholder-white/40 focus:ring-rose-500/20 focus:border-rose-500/40 outline-none transition-all text-lg font-bold tracking-tight"
                        onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                        disabled={loading}
                      />
                    </div>
                  </div>
                </div>

                <Button
                  onClick={handleLogin}
                  disabled={loading}
                  className="w-full h-14 bg-white text-black hover:bg-neutral-200 transition-all shadow-xl rounded-2xl text-xs font-black uppercase tracking-widest active:scale-[0.98] disabled:opacity-50"
                >
                  {loading ? "Decrypting..." : "Initialize Session"}
                  {!loading && <ArrowRight className="w-4 h-4 ml-2" />}
                </Button>

                <div className="flex justify-center pt-2">
                  <button
                    type="button"
                    onClick={() => setShowForgotMessage(!showForgotMessage)}
                    className="text-[10px] font-black text-white/50 hover:text-rose-500 uppercase tracking-widest transition-colors"
                  >
                    Forgot Password?
                  </button>
                </div>

                {showForgotMessage && (
                  <div className="bg-rose-500/5 border border-rose-500/10 p-4 rounded-2xl flex flex-col gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                      <div className="flex gap-3 items-start">
                        <AlertCircle className="w-4 h-4 text-rose-500 mt-0.5 shrink-0" />
                        <p className="text-[11px] leading-relaxed text-rose-200/90 font-black italic">
                            Credential recovery requires administrative intervention. Please contact your system supervisor to reset your access key.
                        </p>
                      </div>
                      <div className="h-[1px] bg-rose-500/10 w-full" />
                      <p className="text-[10px] text-rose-400 font-black uppercase tracking-wider text-center">
                        Contact TikTok <span className="text-rose-500">@vlodex</span> for access
                      </p>
                  </div>
                )}
              </div>
            ) : (
              // Change Password Form
              <div className="space-y-6">
                <div className="bg-orange-500/5 border border-orange-500/10 p-4 rounded-2xl flex gap-3 items-start">
                    <AlertCircle className="w-4 h-4 text-orange-500 mt-0.5 shrink-0" />
                    <p className="text-[11px] leading-relaxed text-orange-200/90 font-black italic">
                        Your account requires a password update before proceeding. New password must be at least 6 characters.
                    </p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-white/60 ml-1">Current Key</label>
                    <Input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Current password"
                      className="w-full bg-white/[0.02] border-white/5 rounded-2xl px-5 py-6 text-white placeholder-white/40 focus:ring-rose-500/20 focus:border-rose-500/40 outline-none transition-all text-base font-bold tracking-tight"
                      disabled={loading}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-white/60 ml-1">New Access Key</label>
                    <Input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="New password (min 6 chars)"
                      className="w-full bg-white/[0.02] border-white/5 rounded-2xl px-5 py-6 text-white placeholder-white/40 focus:ring-rose-500/20 focus:border-rose-500/40 outline-none transition-all text-base font-bold tracking-tight"
                      disabled={loading}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-white/60 ml-1">Confirm New Key</label>
                    <Input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm new password"
                      className="w-full bg-white/[0.02] border-white/5 rounded-2xl px-5 py-6 text-white placeholder-white/40 focus:ring-rose-500/20 focus:border-rose-500/40 outline-none transition-all text-base font-bold tracking-tight"
                      onKeyDown={(e) => e.key === "Enter" && handleChangePassword()}
                      disabled={loading}
                    />
                  </div>
                </div>

                <Button
                  onClick={handleChangePassword}
                  disabled={loading}
                  className="w-full h-14 bg-emerald-500 text-white hover:bg-emerald-400 transition-all shadow-xl shadow-emerald-500/10 rounded-2xl text-xs font-black uppercase tracking-widest active:scale-[0.98] disabled:opacity-50"
                >
                  {loading ? "Syncing..." : "Update & Sync"}
                  {!loading && <CheckCircle2 className="w-4 h-4 ml-2" />}
                </Button>
              </div>
            )}

            {(error || (mustChangePassword === false && initialUsername === "" && error === "" && username === "" && password === "" && "")) && (
              <div className={cn(
                "flex items-center gap-2 text-sm p-4 rounded-2xl animate-in shake duration-300",
                error ? "text-red-400 bg-red-400/5 border border-red-400/10" : "hidden"
              )}>
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span className="font-bold tracking-tight">{error}</span>
              </div>
            )}

            <div className="space-y-2">
              <p className="text-[10px] text-center text-white/50 font-black uppercase tracking-[0.2em]">
                Authorized Personnel Only
              </p>
              <p className="text-[9px] text-center text-rose-500/80 font-black uppercase tracking-widest italic">
                Contact TikTok @vlodex to gain access
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

