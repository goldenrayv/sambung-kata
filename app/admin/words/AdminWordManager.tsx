"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Search, Plus, CheckCircle2, AlertCircle, Loader2, Sparkles, Database, X } from "lucide-react";
import { checkNewWords, insertBulkWords } from "@/app/actions";
import { toast } from "sonner";

export default function AdminWordManager() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Search State
  const [search, setSearch] = useState(searchParams.get("q") || "");

  // Debounce search update to URL
  useEffect(() => {
    const timer = setTimeout(() => {
      const currentSearchParams = new URLSearchParams(Array.from(searchParams.entries()));
      const urlQ = currentSearchParams.get("q") || "";

      if (search.trim() !== urlQ) {
        if (search.trim()) {
          currentSearchParams.set("q", search.trim());
        } else {
          currentSearchParams.delete("q");
        }
        currentSearchParams.set("page", "1");
        router.push(`/admin/words?${currentSearchParams.toString()}`);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [search, router, searchParams]);

  // Bulk Add State
  const [bulkInput, setBulkInput] = useState("");
  const [isChecking, setIsChecking] = useState(false);
  const [isInserting, setIsInserting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  
  const [validationResult, setValidationResult] = useState<{
    newWords: string[];
    existingWords: string[];
  } | null>(null);

  const handleVerify = async () => {
    if (!bulkInput.trim()) return;
    
    setIsChecking(true);
    try {
      const words = bulkInput.split(/\s+/).filter(Boolean);
      const result = await checkNewWords(words);
      setValidationResult(result);
      setDialogOpen(true);
    } catch (error) {
      console.error(error);
      toast.error("Failed to verify words.");
    } finally {
      setIsChecking(false);
    }
  };

  const handleAccept = async () => {
    if (!validationResult || validationResult.newWords.length === 0) {
      setDialogOpen(false);
      setBulkInput("");
      return;
    }

    setIsInserting(true);
    try {
      const result = await insertBulkWords(validationResult.newWords);
      
      if (result.success) {
        toast.success(`Successfully added ${validationResult.newWords.length} words!`);
        setDialogOpen(false);
        setBulkInput("");
        
        if (search) {
          setSearch("");
        }
        router.refresh();
      } else {
        toast.error(result.error || "Failed to insert words.");
      }
    } catch (error: any) {
      console.error(error);
      toast.error("An unexpected error occurred.");
    } finally {
      setIsInserting(false);
    }
  };

  return (
    <>
      <div className="w-full bg-neutral-950/50 border-b border-white/5 backdrop-blur-md sticky top-0 z-30 px-6 py-6 space-y-6">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Row 1: Search Logic */}
          <div className="flex flex-col md:flex-row items-center gap-4">
            <div className="relative group flex-1 w-full">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-orange-500/20 to-rose-500/20 rounded-xl blur opacity-0 group-focus-within:opacity-100 transition duration-500" />
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-orange-500 transition-colors" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Filter key terms..."
                  className="w-full pl-12 bg-neutral-900/40 border-white/10 text-white placeholder-white/40 focus:ring-orange-500/10 focus:border-orange-500/30 rounded-lg h-9 pr-4 font-mono text-[10px] tracking-widest transition-all shadow-inner"
                />
                {search && (
                   <button
                     onClick={() => setSearch("")}
                     className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 hover:text-white transition-colors"
                   >
                     <X className="w-3 h-3" />
                   </button>
                )}
              </div>
            </div>
          </div>

          <div className="h-[1px] w-full bg-white/5" />

          {/* Row 2: Ingest Logic */}
          <div className="flex flex-col sm:flex-row items-center gap-4">
            {/* Label & Context */}
            <div className="flex items-center gap-3 shrink-0">
              <div className="w-10 h-10 rounded-2xl bg-orange-500/10 flex items-center justify-center border border-orange-500/20 shadow-[0_0_20px_rgba(249,115,22,0.1)]">
                <Sparkles className="w-5 h-5 text-orange-500" />
              </div>
              <div className="hidden lg:block">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/70 leading-none">Repository Sync</h3>
                <p className="text-[9px] text-white/40 font-mono mt-0.5 font-bold italic">Real-time Validation</p>
              </div>
            </div>
            
            {/* Input Area */}
            <div className="relative flex-1 group w-full">
              <Textarea
                value={bulkInput}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setBulkInput(e.target.value)}
                placeholder="Ingest to repository..."
                className="w-full bg-neutral-900/40 border-white/5 text-white placeholder:text-white/40 focus:ring-orange-500/10 focus:border-orange-500/30 rounded-lg min-h-[32px] h-[32px] py-1.5 px-4 font-mono text-[10px] tracking-widest transition-all shadow-inner resize-y scrollbar-hide"
              />
              {bulkInput.trim() && (
                 <div className="absolute right-3 top-2.5 pointer-events-none animate-in fade-in zoom-in duration-300">
                   <span className="text-[10px] font-black text-orange-500/60 bg-orange-500/10 px-2 py-0.5 rounded border border-orange-500/20 uppercase tracking-tighter">
                     {bulkInput.split(/\s+/).filter(Boolean).length} prep
                   </span>
                 </div>
              )}
            </div>

            {/* Action Button */}
            <Button 
              onClick={handleVerify} 
              disabled={isChecking || !bulkInput.trim()}
              className="bg-white text-black hover:bg-neutral-100 font-bold h-9 px-6 rounded-lg transition-all shadow-xl active:scale-95 disabled:opacity-30 uppercase tracking-[0.1em] text-[10px] flex items-center gap-2 group shrink-0 w-full sm:w-auto"
            >
              {isChecking ? (
                <Loader2 className="w-4 h-4 animate-spin text-orange-500" />
              ) : (
                <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" />
              )}
              <span>Sync to Core</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-neutral-950 border border-white/10 text-white max-w-2xl rounded-[28px] p-0 overflow-hidden shadow-[0_0_80px_rgba(249,115,22,0.15)]">
          <div className="p-6 space-y-6 max-h-[80vh] flex flex-col font-sans">
            <DialogHeader>
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center border border-orange-500/20 shadow-inner">
                        <Database className="w-5 h-5 text-orange-500" />
                    </div>
                    <div>
                        <DialogTitle className="text-xl font-black uppercase tracking-tight">Sync Review</DialogTitle>
                        <DialogDescription className="text-[10px] text-white/60 font-black uppercase tracking-widest">
                        Validation Complete
                        </DialogDescription>
                    </div>
                </div>
            </DialogHeader>
            
            <div className="flex-1 overflow-y-auto pr-1 space-y-8 py-2 scrollbar-hide">
                {validationResult?.newWords && validationResult.newWords.length > 0 && (
                <div className="space-y-3">
                    <div className="flex items-center justify-between border-b border-emerald-500/10 pb-2">
                        <h4 className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-emerald-400">
                          <CheckCircle2 className="w-3.5 h-3.5" /> 
                          Ready ({validationResult.newWords.length})
                        </h4>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                    {validationResult.newWords.map((w, i) => (
                        <div key={i} className="px-2 py-1 text-[9px] font-black font-mono bg-emerald-500/5 text-emerald-400 border border-emerald-500/10 rounded-lg tracking-widest italic leading-none">
                        {w}
                        </div>
                    ))}
                    </div>
                </div>
                )}

                {validationResult?.existingWords && validationResult.existingWords.length > 0 && (
                <div className="space-y-3">
                    <div className="flex items-center justify-between border-b border-white/5 pb-2">
                        <h4 className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-white/60">
                          <AlertCircle className="w-3.5 h-3.5" /> 
                          Duplicates ({validationResult.existingWords.length})
                        </h4>
                    </div>
                    <div className="flex flex-wrap gap-1.5 hover:opacity-100 transition-opacity">
                    {validationResult.existingWords.map((w, i) => (
                        <div key={i} className="px-2 py-1 text-[9px] font-black font-mono bg-white/5 text-white/70 border border-white/5 rounded-lg tracking-widest leading-none">
                        {w}
                        </div>
                    ))}
                    </div>
                </div>
                )}
                
                {validationResult?.newWords.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 gap-4 bg-white/[0.02] rounded-2xl border border-white/5 mx-2">
                    <div className="p-3 rounded-full bg-orange-500/5 border border-orange-500/10 animate-pulse text-orange-500/20">
                        <Database className="w-6 h-6" />
                    </div>
                    <div className="text-center space-y-1">
                        <p className="text-[11px] text-white font-black tracking-widest uppercase">No Unique Tokens Found</p>
                        <p className="text-[9px] text-white/60 font-bold px-6 italic font-mono uppercase tracking-tighter">Entries already exist in core repository.</p>
                    </div>
                </div>
                )}
            </div>

            <DialogFooter className="gap-2 border-t border-white/5 pt-6 mt-2">
                <Button variant="ghost" onClick={() => setDialogOpen(false)} className="flex-1 h-11 rounded-xl text-[10px] font-black uppercase tracking-widest text-white/70 hover:text-white hover:bg-white/5 transition-all">
                Cancel
                </Button>
                <Button 
                onClick={handleAccept} 
                disabled={isInserting || validationResult?.newWords.length === 0}
                className="flex-[2] bg-orange-500 hover:bg-orange-400 text-white h-11 rounded-xl font-black shadow-lg shadow-orange-500/20 transition-all active:scale-95 disabled:opacity-20 uppercase tracking-[0.1em] text-[10px]"
                >
                {isInserting ? <Loader2 className="w-3 h-3 animate-spin mr-2" /> : null}
                {validationResult?.newWords.length === 0 ? "Understood" : "Commit to Core"}
                </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

