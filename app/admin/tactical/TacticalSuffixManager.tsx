"use client";

import { useState } from "react";
import { Plus, Trash2, Hash, ArrowUpDown } from "lucide-react";
import { addTacticalSuffix, deleteTacticalSuffix } from "@/app/actions";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";

interface Suffix {
  id: string;
  suffix: string;
}

export default function TacticalSuffixManager({ initialSuffixes }: { initialSuffixes: Suffix[] }) {
  const [suffixes, setSuffixes] = useState(initialSuffixes);
  const [newSuffix, setNewSuffix] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSuffix.trim()) return;
    
    setIsSubmitting(true);
    const result = await addTacticalSuffix(newSuffix);
    if (result.success) {
      toast.success("Suffix added to Kill-Zone! ✨");
      setNewSuffix("");
      // Refresh local list (naive refresh for speed, real apps might revalidate)
      window.location.reload(); 
    } else {
      toast.error(result.error || "Failed to add suffix");
    }
    setIsSubmitting(false);
  };

  const handleDelete = async (id: string, suffix: string) => {
    if (!confirm(`Remove "${suffix}" from tactical grouping?`)) return;
    
    const result = await deleteTacticalSuffix(id);
    if (result.success) {
      toast.success("Suffix removed");
      setSuffixes(suffixes.filter(s => s.id !== id));
    } else {
      toast.error("Failed to delete");
    }
  };

  return (
    <div className="space-y-12">
      {/* Add Suffix Form */}
      <form onSubmit={handleAdd} className="flex items-center gap-3">
        <div className="relative flex-1 group">
          <Input 
            value={newSuffix}
            onChange={(e) => setNewSuffix(e.target.value)}
            placeholder="ENTER NEW SUFFIX (e.g. AX, OI, TY)..."
            className="bg-white/5 border-white/10 text-white placeholder-white/20 h-12 px-6 rounded-xl font-mono tracking-widest text-sm focus:border-rose-500/50 transition-all uppercase"
            disabled={isSubmitting}
          />
        </div>
        <button
          type="submit"
          disabled={isSubmitting || !newSuffix.trim()}
          className="h-12 px-8 rounded-xl bg-gradient-to-r from-rose-500 to-orange-500 text-white font-black text-xs uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-lg disabled:opacity-50 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Suffix
        </button>
      </form>

      {/* Suffix List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-2">
            <div className="text-[10px] font-black text-white tracking-[0.2em] uppercase opacity-40 flex items-center gap-2">
                <ArrowUpDown className="w-3 h-3" />
                Sorted by lengths (Specificity)
            </div>
            <div className="text-[10px] font-black text-rose-400 tracking-[0.2em] uppercase">
                {suffixes.length} Tactical Markers
            </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
          {suffixes.map((s) => (
            <div 
              key={s.id} 
              className="group flex items-center justify-between bg-white/[0.03] border border-white/5 hover:border-rose-500/30 p-1.5 pl-4 rounded-xl transition-all duration-300"
            >
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black text-rose-500/50 font-mono italic">-</span>
                <span className="text-xs font-black text-white tracking-widest font-mono uppercase">{s.suffix}</span>
              </div>
              <button
                onClick={() => handleDelete(s.id, s.suffix)}
                className="p-2 text-white/10 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>

        {suffixes.length === 0 && (
          <div className="py-20 text-center border-2 border-dashed border-white/5 rounded-3xl">
            <div className="inline-flex flex-col items-center">
                <Hash className="w-10 h-10 text-white/10 mb-4" />
                <p className="text-xs font-black text-white/40 uppercase tracking-[0.2em]">No tactical suffixes found</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
