"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Loader2, Sparkles, ClipboardCheck } from "lucide-react";
import { insertBulkWordReviews } from "@/app/actions";
import { toast } from "sonner";

export default function AdminReviewManager() {
  const router = useRouter();
  const [bulkInput, setBulkInput] = useState("");
  const [isInserting, setIsInserting] = useState(false);

  const handleIngest = async () => {
    if (!bulkInput.trim()) return;
    
    setIsInserting(true);
    try {
      const words = bulkInput.split(/\s+/).filter(Boolean);
      const result = await insertBulkWordReviews(words);
      
      if (result.success) {
        toast.success(`Successfully submitted ${words.length} words for review!`);
        setBulkInput("");
        router.refresh();
      } else {
        toast.error(result.error || "Failed to submit words.");
      }
    } catch (error: any) {
      console.error(error);
      toast.error("An unexpected error occurred.");
    } finally {
      setIsInserting(false);
    }
  };

  return (
    <div className="flex flex-col gap-8 p-10 bg-white/[0.02] border-b border-white/5">
      {/* Bulk Insert Area */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-white/40 uppercase tracking-widest flex items-center gap-2">
              <Sparkles className="w-3 h-3 text-rose-500" />
              Quality Control Ingest
          </label>
          <span className="text-[10px] text-white/20 font-mono">Separator: Space or Line break</span>
        </div>
        
        <div className="flex gap-4 items-stretch">
          <div className="relative flex-1 group">
              <Textarea
              value={bulkInput}
              onChange={(e) => setBulkInput(e.target.value)}
              placeholder="ENTRY_1 ENTRY_2 ENTRY_3..."
              className="w-full bg-neutral-900 border-white/5 text-white placeholder-white/10 focus:ring-rose-500/10 focus:border-rose-500/30 rounded-2xl min-h-[50px] max-h-[250px] p-4 font-mono text-sm tracking-widest scrollbar-hide resize-none transition-all shadow-inner"
              />
              <div className="absolute bottom-3 right-3 opacity-0 group-focus-within:opacity-100 transition-opacity">
                  <span className="text-[10px] font-bold text-rose-500/40 bg-rose-500/5 px-2 py-1 rounded-md border border-rose-500/10 uppercase tracking-tighter">Ready for review</span>
              </div>
          </div>
          <Button 
            onClick={handleIngest} 
            disabled={isInserting || !bulkInput.trim()}
            className="bg-white text-black hover:bg-neutral-200 font-black px-8 rounded-2xl transition-all flex flex-col items-center justify-center gap-1 shrink-0 h-auto shadow-xl active:scale-95 disabled:opacity-20 uppercase tracking-tighter text-xs"
          >
            {isInserting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
            <span>Ingest</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
