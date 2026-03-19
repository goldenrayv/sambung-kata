"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Loader2, Sparkles } from "lucide-react";
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
    <div className="w-full bg-neutral-950/50 border-b border-white/5 backdrop-blur-md sticky top-0 z-30 px-6 py-4">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center gap-4">
        {/* Label & Context */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-10 h-10 rounded-2xl bg-rose-500/10 flex items-center justify-center border border-rose-500/20 shadow-[0_0_20px_rgba(244,63,94,0.1)]">
            <Sparkles className="w-5 h-5 text-rose-500" />
          </div>
          <div className="hidden lg:block">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/70 leading-none">Queue Ingest</h3>
            <p className="text-[9px] text-white/40 font-mono mt-0.5 font-bold italic">Space/Return delimited</p>
          </div>
        </div>
        
        {/* Input Area */}
        <div className="relative flex-1 group w-full">
          <Textarea
            value={bulkInput}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setBulkInput(e.target.value)}
            placeholder="Ingest to review queue..."
            className="w-full bg-neutral-900/40 border-white/5 text-white placeholder:text-white/40 focus:ring-rose-500/10 focus:border-rose-500/30 rounded-lg min-h-[32px] h-[32px] py-1.5 px-4 font-mono text-[10px] tracking-widest transition-all shadow-inner resize-y scrollbar-hide"
          />
          {bulkInput.trim() && (
             <div className="absolute right-3 top-2.5 pointer-events-none animate-in fade-in zoom-in duration-300">
               <span className="text-[10px] font-black text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20 uppercase tracking-tighter">
                 {bulkInput.split(/\s+/).filter(Boolean).length} pending
               </span>
             </div>
          )}
        </div>

        {/* Action Button */}
        <Button 
          onClick={handleIngest} 
          disabled={isInserting || !bulkInput.trim()}
          className="bg-white text-black hover:bg-neutral-100 font-bold h-9 px-6 rounded-lg transition-all shadow-xl active:scale-95 disabled:opacity-30 uppercase tracking-[0.1em] text-[10px] flex items-center gap-2 group shrink-0 w-full sm:w-auto"
        >
          {isInserting ? (
            <Loader2 className="w-4 h-4 animate-spin text-rose-500" />
          ) : (
            <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" />
          )}
          <span>Ingest to Review</span>
        </Button>
      </div>
    </div>
  );
}
