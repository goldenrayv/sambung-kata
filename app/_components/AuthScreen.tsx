"use client";

import { ArrowRight, AlertCircle, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

interface Props {
  tokenInput: string;
  setTokenInput: (v: string) => void;
  authError: string;
  loading: boolean;
  onAuth: (token: string) => void;
}

export default function AuthScreen({
  tokenInput,
  setTokenInput,
  authError,
  loading,
  onAuth,
}: Props) {
  return (
    <main className="min-h-screen bg-neutral-950 text-white flex flex-col items-center justify-center p-6 bg-[radial-gradient(circle_at_top_left,rgba(244,63,94,0.1),transparent_40%)]">
      <div className="w-full max-w-md space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
        <div className="text-center space-y-4">
          <div className="inline-flex p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 mb-2">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight font-heading">Access Protected</h1>
          <p className="text-white">
            Please enter your unique access token to use the Sambung Kata cheat sheet.
          </p>
        </div>

        <Card className="bg-neutral-900/50 backdrop-blur-xl border-white/10 shadow-2xl overflow-hidden rounded-3xl">
          <CardContent className="p-8 space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-white ml-1">Access Token</label>
              <div className="relative group">
                <Input
                  type="password"
                  value={tokenInput}
                  onChange={(e) => setTokenInput(e.target.value)}
                  placeholder="sk_••••••••••••"
                  className="w-full bg-neutral-800 border-white/10 rounded-xl px-4 py-8 text-white placeholder-white/40 focus:ring-2 focus:ring-rose-500 outline-none transition-all pr-14 text-lg"
                  onKeyDown={(e) => e.key === "Enter" && onAuth(tokenInput)}
                  disabled={loading}
                />
                <Button
                  size="icon"
                  onClick={() => onAuth(tokenInput)}
                  disabled={loading}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-rose-600 hover:bg-rose-500 transition-colors shadow-lg rounded-lg h-12 w-12"
                >
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </div>
            </div>

            {authError && (
              <div className="flex items-center gap-2 text-red-400 text-sm bg-red-400/5 border border-red-400/20 p-3 rounded-xl animate-in shake duration-300">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            <p className="text-xs text-center text-white/60">
              Contact your administrator to request a new key.
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
