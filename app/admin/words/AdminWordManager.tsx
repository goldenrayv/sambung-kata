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
import { Search, Plus, CheckCircle2, AlertCircle, Loader2, Sparkles, Database } from "lucide-react";
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
      <div className="flex flex-col gap-8 p-10 bg-white/[0.02] border-b border-white/5">
        
        {/* Search Bar */}
        <div className="relative group max-w-xl">
          <div className="absolute -inset-1 bg-gradient-to-r from-orange-500/20 to-rose-500/20 rounded-2xl blur opacity-25 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-orange-500 transition-colors" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search repository term..."
              className="w-full pl-12 bg-neutral-900 border-white/5 text-white placeholder-white/20 focus:ring-orange-500/20 focus:border-orange-500/40 rounded-xl h-12 transition-all shadow-inner"
            />
          </div>
        </div>

        {/* Bulk Insert Area */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-white/40 uppercase tracking-widest flex items-center gap-2">
                <Sparkles className="w-3 h-3 text-orange-500" />
                Batch Ingest Controller
            </label>
            <span className="text-[10px] text-white/20 font-mono">Separator: Space or Line break</span>
          </div>
          
          <div className="flex gap-4 items-stretch">
            <div className="relative flex-1 group">
                <Textarea
                value={bulkInput}
                onChange={(e) => setBulkInput(e.target.value)}
                placeholder="INGEST_WORD_1 INGEST_WORD_2..."
                className="w-full bg-neutral-900 border-white/5 text-white placeholder-white/10 focus:ring-orange-500/10 focus:border-orange-500/30 rounded-2xl min-h-[50px] max-h-[250px] p-4 font-mono text-sm tracking-widest scrollbar-hide resize-none transition-all shadow-inner"
                />
                <div className="absolute bottom-3 right-3 opacity-0 group-focus-within:opacity-100 transition-opacity">
                    <span className="text-[10px] font-bold text-orange-500/40 bg-orange-500/5 px-2 py-1 rounded-md border border-orange-500/10 uppercase tracking-tighter">Ready to sync</span>
                </div>
            </div>
            <Button 
              onClick={handleVerify} 
              disabled={isChecking || !bulkInput.trim()}
              className="bg-white text-black hover:bg-neutral-200 font-black px-8 rounded-2xl transition-all flex flex-col items-center justify-center gap-1 shrink-0 h-auto shadow-xl active:scale-95 disabled:opacity-20 uppercase tracking-tighter text-xs"
            >
              {isChecking ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
              <span>Sync</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-neutral-950 border border-white/10 text-white max-w-2xl rounded-[32px] p-0 overflow-hidden shadow-[0_0_100px_rgba(249,115,22,0.1)]">
          <div className="p-8 space-y-8 max-h-[85vh] flex flex-col">
            <DialogHeader className="space-y-2">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-orange-500/10 flex items-center justify-center border border-orange-500/20">
                        <Database className="w-6 h-6 text-orange-500" />
                    </div>
                    <div>
                        <DialogTitle className="text-3xl font-black font-heading tracking-tight">Sync Validation</DialogTitle>
                        <DialogDescription className="text-white/40 font-medium">
                        Verify entries before commit to repository.
                        </DialogDescription>
                    </div>
                </div>
            </DialogHeader>
            
            <div className="flex-1 overflow-y-auto pr-4 space-y-10 py-2 scrollbar-hide">
                {validationResult?.newWords && validationResult.newWords.length > 0 && (
                <div className="space-y-4">
                    <h4 className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-emerald-400">
                    <CheckCircle2 className="w-4 h-4" /> 
                    New Entries ({validationResult.newWords.length})
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                    {validationResult.newWords.map((w, i) => (
                        <div key={i} className="px-3 py-2 text-[11px] font-black font-mono bg-emerald-500/5 text-emerald-400 border border-emerald-500/10 rounded-xl tracking-widest text-center truncate">
                        {w}
                        </div>
                    ))}
                    </div>
                </div>
                )}

                {validationResult?.existingWords && validationResult.existingWords.length > 0 && (
                <div className="space-y-4">
                    <h4 className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-white/20">
                    <AlertCircle className="w-4 h-4" /> 
                    Duplicate Blocked ({validationResult.existingWords.length})
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                    {validationResult.existingWords.map((w, i) => (
                        <div key={i} className="px-3 py-2 text-[11px] font-black font-mono bg-white/5 text-white/20 border border-white/5 rounded-xl tracking-widest text-center truncate">
                        {w}
                        </div>
                    ))}
                    </div>
                </div>
                )}
                
                {validationResult?.newWords.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <div className="p-4 rounded-full bg-white/5">
                        <Database className="w-10 h-10 text-white/20" />
                    </div>
                    <div className="text-center space-y-1">
                        <p className="text-white font-bold tracking-tight">System Desynchronized</p>
                        <p className="text-white/40 text-sm italic">All proposed entries already exist in the central repository.</p>
                    </div>
                </div>
                )}
            </div>

            <DialogFooter className="gap-3 border-t border-white/5 p-8 -mx-8 -mb-8 bg-white/[0.02]">
                <Button variant="ghost" onClick={() => setDialogOpen(false)} className="px-8 h-12 rounded-2xl text-white/40 hover:text-white hover:bg-white/5 font-bold transition-all">
                Abort Sync
                </Button>
                <Button 
                onClick={handleAccept} 
                disabled={isInserting || validationResult?.newWords.length === 0}
                className="bg-orange-500 hover:bg-orange-400 text-white px-12 h-12 rounded-2xl font-black shadow-xl shadow-orange-500/20 transition-all active:scale-95 disabled:opacity-20 uppercase tracking-tighter text-sm"
                >
                {isInserting ? <Loader2 className="w-4 h-4 animate-spin mr-3" /> : null}
                {validationResult?.newWords.length === 0 ? "Understood" : "Commit to Core"}
                </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

