"use client";

import { LogOut, Info, BookOpen, Sparkles, AlertCircle, X, ArrowUpRight, ShieldCheck, BadgeCheck } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface Props {
  username: string;
  isSuperUser: boolean;
  expiresAt: Date;
  onLogout: () => void;
}

export default function TopBar({ username, isSuperUser, expiresAt, onLogout }: Props) {
  const [showTips, setShowTips] = useState(false);

  const now = new Date();
  const diffTime = new Date(expiresAt).getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const isWarning = diffDays > 0 && diffDays <= 3;

  return (
    <div className="sticky top-0 z-30 w-full max-w-full flex items-center justify-between mb-4 animate-in fade-in duration-500 bg-neutral-950/80 backdrop-blur-xl border-b border-white/5 p-2 rounded-none -mx-4 md:-mx-8 px-4 md:px-8">
      <div className="flex items-center gap-2">
        <h1 className="text-lg font-bold font-heading bg-gradient-to-r from-rose-400 to-orange-400 text-transparent bg-clip-text italic tracking-tighter">
          Sambung Kata
        </h1>
      </div>

      <div className="flex items-center gap-4 relative">
        {/* Tips Popup backdrop */}
        {showTips && (
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowTips(false)}
          />
        )}

        {/* Tips Popup */}
        {showTips && (
          <div className="absolute right-0 top-12 w-[min(320px,calc(100vw-2rem))] bg-neutral-900 border border-white/10 rounded-2xl p-6 shadow-2xl animate-in fade-in zoom-in slide-in-from-top-4 duration-300 z-50">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-rose-500" />
                Strategic Manual
              </h3>
              <button onClick={() => setShowTips(false)} className="text-white/20 hover:text-white transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-[10px] font-bold text-rose-400 uppercase tracking-tighter">
                  <ArrowUpRight className="w-3 h-3" />
                  Kill-Zone Offense
                </div>
                <p className="text-[11px] leading-relaxed text-white/60">
                  Target "Dead-End" suffixes like <span className="text-white font-mono">OA, EZ, KS, TT</span> or <span className="text-white font-mono">HIH</span>. These have high statistical win-rates because few valid words begin with these combinations.
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-[10px] font-bold text-orange-400 uppercase tracking-tighter">
                  <ShieldCheck className="w-3 h-3" />
                  Precision Defense
                </div>
                <p className="text-[11px] leading-relaxed text-white/60">
                  Toggle the <span className="text-white font-mono">Suffix</span> grid to find words that counter your opponent’s move. If a response shows 0 suffix results, it’s a trap—you’ve essentially cleared the board.
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-[10px] font-bold text-emerald-400 uppercase tracking-tighter">
                  <BadgeCheck className="w-3 h-3" />
                  Verified Tokens
                </div>
                <p className="text-[11px] leading-relaxed text-white/60">
                  Look for <span className="text-emerald-400 font-black italic">Emerald</span> highlighted cards. These are curated, professional-grade words guaranteed to be valid in competitive play.
                </p>
              </div>

              <div className="pt-4 border-t border-white/5">
                <div className="flex items-start gap-2 text-[9px] font-medium text-white/30 italic leading-snug">
                  <AlertCircle className="w-3 h-3 shrink-0 mt-0.5" />
                  <span>Disclaimer: Our library is extensive but focus on Verified tokens for the highest competitive integrity.</span>
                </div>
              </div>
            </div>

            {/* Pointer */}
            <div className="absolute top-[-5px] right-24 w-2 h-2 bg-neutral-900 border-l border-t border-white/10 rotate-45" />
          </div>
        )}

        <div className="flex items-center gap-1.5 pr-2 border-r border-white/10">
          <button 
            onClick={() => setShowTips(!showTips)}
            className="group flex items-center gap-1.5 mr-1"
          >
            <Badge
              variant="outline"
              className={`bg-rose-500/5 text-[9px] uppercase tracking-wider px-1.5 py-0 whitespace-nowrap cursor-pointer transition-all duration-300 h-4 leading-none ${
                showTips ? 'text-white border-white/40 ring-1 ring-white/20' : 'text-rose-400 border-rose-500/20 group-hover:border-rose-400'
              }`}
            >
              Strategic Tips
            </Badge>
          </button>
          
          <div className="flex flex-col items-end mr-1">
            {isWarning && (
              <span className="text-[8px] font-black text-orange-400 uppercase tracking-widest animate-pulse whitespace-nowrap">
                Expires soon!
              </span>
            )}
            <span className="text-[9px] font-bold uppercase tracking-tighter flex items-center gap-1">
              <span className={isWarning ? "text-orange-400 animate-pulse" : "text-white/60"}>
                {diffDays}d left
              </span>
            </span>
          </div>

          <div className="w-6 h-6 rounded-md bg-gradient-to-br from-rose-500 to-orange-500 flex items-center justify-center font-bold text-white text-[10px] shadow-lg">
            {username?.[0]?.toUpperCase()}
          </div>
          <div className="flex flex-col items-start mr-1">
            <span className="text-[11px] font-bold text-white leading-none">{username}</span>
            {isSuperUser ? (
              <span className="text-[8px] font-black text-rose-400 uppercase tracking-[0.1em] leading-none mt-0.5">Super</span>
            ) : (
              <span className="text-[8px] font-black text-white/50 uppercase tracking-[0.1em] leading-none mt-0.5">User</span>
            )}
          </div>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={onLogout}
          className="text-white/70 hover:text-rose-400 transition-all text-[10px] h-7 px-2 font-black uppercase tracking-widest"
        >
          <LogOut className="w-3 h-3 mr-1" />
          Logout
        </Button>
      </div>
    </div>
  );
}
