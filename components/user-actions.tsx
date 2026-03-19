"use client";

import { useState } from "react";
import { 
  Trash2, 
  MoreHorizontal, 
  Clock 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { extendUserExpiry, deleteUser } from "@/app/actions";
import { toast } from "sonner";

interface Props {
  userId: string;
}

export function UserActions({ userId }: Props) {
  const [loading, setLoading] = useState(false);

  const handleExtend = async (days: number) => {
    setLoading(true);
    try {
      const result = await extendUserExpiry(userId, days);
      if (result.success) {
        toast.success(`Access extended by ${days} days`);
      } else {
        toast.error("Failed to extend access");
      }
    } catch (e) {
      toast.error("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to revoke access? This cannot be undone.")) return;
    
    setLoading(true);
    try {
      await deleteUser(userId);
      toast.success("Access revoked");
    } catch (e) {
      toast.error("Failed to delete user");
    } finally {
      setLoading(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          disabled={loading}
          className="text-white/40 hover:text-white hover:bg-white/10 rounded-xl transition-all h-10 w-10 border border-transparent hover:border-white/10"
        >
          <MoreHorizontal className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-neutral-900 border-white/10 text-white rounded-2xl p-2 min-w-[180px] shadow-2xl">
        <DropdownMenuLabel className="px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-white/30">Security Management</DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-white/5 mx-2 my-1" />
        
        <div className="px-3 py-2 flex items-center gap-2">
           <Clock className="w-3 h-3 text-rose-500" />
           <span className="text-[10px] text-rose-500 font-bold uppercase tracking-widest">Extend Expiry</span>
        </div>
        
        <div className="grid grid-cols-2 gap-1 px-2 pb-2">
          {[1, 3, 7, 14, 30].map((d) => (
            <DropdownMenuItem
              key={d}
              disabled={loading}
              onClick={() => handleExtend(d)}
              className="flex items-center justify-center py-2 bg-white/5 border border-white/5 rounded-xl cursor-pointer hover:bg-rose-500/20 hover:text-rose-400 transition-all text-xs font-bold focus:bg-rose-500/10 focus:text-rose-400"
            >
              +{d}D
            </DropdownMenuItem>
          ))}
        </div>

        <DropdownMenuSeparator className="bg-white/5 mx-2 my-1" />
        
        <DropdownMenuItem 
          disabled={loading}
          onClick={handleDelete}
          className="w-full flex items-center gap-2 text-red-400 p-2 rounded-xl cursor-pointer hover:bg-red-500/20 transition-all text-sm font-bold focus:bg-red-500/10 focus:text-red-400"
        >
          <Trash2 className="w-4 h-4" />
          Revoke Access
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
