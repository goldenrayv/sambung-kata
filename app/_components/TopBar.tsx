"use client";

import { LogOut } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface Props {
  username: string;
  onLogout: () => void;
}

export default function TopBar({ username, onLogout }: Props) {
  return (
    <div className="w-full max-w-6xl flex items-center justify-between mb-6 animate-in fade-in duration-500 bg-white/5 backdrop-blur-md border border-white/10 p-2 pl-4 rounded-2xl">
      <div className="flex items-center gap-3">
        <h1 className="text-xl font-bold font-heading bg-gradient-to-r from-rose-400 to-orange-400 text-transparent bg-clip-text">
          Sambung Kata
        </h1>
        <Badge
          variant="outline"
          className="hidden sm:flex bg-rose-500/5 text-rose-400 border-rose-500/20 text-[10px] uppercase tracking-wider px-2 py-0"
        >
          Cheat Sheet
        </Badge>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 pr-4 border-r border-white/10">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-rose-500 to-orange-500 flex items-center justify-center font-bold text-white text-xs shadow-lg">
            {username?.[0]?.toUpperCase()}
          </div>
          <span className="hidden sm:block text-xs font-medium text-neutral-300">{username}</span>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={onLogout}
          className="text-neutral-400 hover:text-white transition-all text-xs h-8 px-2"
        >
          <LogOut className="w-3.5 h-3.5 mr-1.5" />
          Logout
        </Button>
      </div>
    </div>
  );
}
