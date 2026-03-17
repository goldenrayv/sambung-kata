"use client";

import { LogOut, Info, BookOpen, Sparkles, AlertCircle, X } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface Props {
  username: string;
  onLogout: () => void;
}

export default function TopBar({ username, onLogout }: Props) {
  const [showTips, setShowTips] = useState(false);

  return (
    <div className="sticky top-0 z-30 w-full max-w-full flex items-center justify-between mb-8 animate-in fade-in duration-500 bg-neutral-950/80 backdrop-blur-xl border-b border-white/5 p-4 rounded-none -mx-4 md:-mx-8 px-4 md:px-8">
      <div className="flex items-center gap-3">
        <h1 className="text-xl font-bold font-heading bg-gradient-to-r from-rose-400 to-orange-400 text-transparent bg-clip-text italic tracking-tighter">
          Sambung Kata
        </h1>
      </div>

      <div className="flex items-center gap-4 relative">
        {/* Tips Popup */}
        {showTips && (
          <div className="absolute right-0 top-12 w-80 bg-neutral-900 border border-white/10 rounded-2xl p-6 shadow-2xl animate-in fade-in zoom-in slide-in-from-top-4 duration-300 z-50">
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
                  <BookOpen className="w-3 h-3" />
                  Real-time Search
                </div>
                <p className="text-[11px] leading-relaxed text-white/60">
                  Master the dictionary. Type any letter combination to find prefix and suffix matches in real-time. Use it to verify existence and explore responses.
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-[10px] font-bold text-orange-400 uppercase tracking-tighter">
                  <Sparkles className="w-3 h-3" />
                  Survival Analytics
                </div>
                <p className="text-[11px] leading-relaxed text-white/60">
                  Strategize with win-rates. Magic Suffixes show endings that are statistically harder to answer, meaning they have many words but few follow-up responses.
                </p>
              </div>

              <div className="pt-4 border-t border-white/5">
                <div className="flex items-start gap-2 text-[9px] font-medium text-white/30 italic leading-snug">
                  <AlertCircle className="w-3 h-3 shrink-0 mt-0.5" />
                  <span>Disclaimer: Our library is extensive but may not contain every slang or regional variant. Proceed with tactical caution.</span>
                </div>
              </div>
            </div>

            {/* Pointer */}
            <div className="absolute top-[-5px] right-24 w-2 h-2 bg-neutral-900 border-l border-t border-white/10 rotate-45" />
          </div>
        )}

        <div className="flex items-center gap-2 pr-4 border-r border-white/10">
          <button 
            onClick={() => setShowTips(!showTips)}
            className="group flex items-center gap-1.5 mr-2"
          >
            <Badge
              variant="outline"
              className={`bg-rose-500/5 text-[10px] uppercase tracking-wider px-2 py-0.5 whitespace-nowrap cursor-pointer transition-all duration-300 ${
                showTips ? 'text-white border-white/40 ring-1 ring-white/20' : 'text-rose-400 border-rose-500/20 group-hover:border-rose-400'
              }`}
            >
              Strategic Tips
            </Badge>
          </button>
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-rose-500 to-orange-500 flex items-center justify-center font-bold text-white text-xs shadow-lg">
            {username?.[0]?.toUpperCase()}
          </div>
          <span className="hidden sm:block text-xs font-medium text-white">{username}</span>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={onLogout}
          className="text-white hover:text-rose-400 transition-all text-xs h-8 px-2"
        >
          <LogOut className="w-3.5 h-3.5 mr-1.5" />
          Logout
        </Button>
      </div>
    </div>
  );
}
