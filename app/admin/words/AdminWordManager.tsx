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
import { Search, Plus, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
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
      const urlPage = currentSearchParams.get("page") || "1";

      // Only push if the query differs OR if we need to reset the page
      if (search.trim() !== urlQ) {
        if (search.trim()) {
          currentSearchParams.set("q", search.trim());
        } else {
          currentSearchParams.delete("q");
        }
        currentSearchParams.set("page", "1"); // reset to page 1 on new search
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
      // Split by whitespace (spaces, newlines, tabs)
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
        
        // Clear URL search if we just added words so they show up at the top
        if (search) {
          setSearch("");
        }
        router.refresh(); // Refresh current page data
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
      <div className="flex flex-col gap-6 p-6 bg-white/5 border-b border-white/10">
        
        {/* Search Bar */}
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search words..."
            className="w-full pl-10 bg-neutral-800 border-white/10 text-white placeholder-white/40 focus:ring-orange-500 rounded-lg h-10"
          />
        </div>

        {/* Bulk Insert Area */}
        <div className="flex flex-col gap-3">
          <label className="text-sm font-semibold text-white/80">Bulk Add Words (Space or Newline separated)</label>
          <div className="flex gap-4 items-start">
            <Textarea
              value={bulkInput}
              onChange={(e) => setBulkInput(e.target.value)}
              placeholder="e.g. WORD1 WORD2 WORD3..."
              className="flex-1 bg-neutral-800 border-white/10 text-white placeholder-white/40 focus:ring-orange-500 rounded-lg min-h-[40px] max-h-[200px]"
            />
            <Button 
              onClick={handleVerify} 
              disabled={isChecking || !bulkInput.trim()}
              className="bg-orange-600 hover:bg-orange-500 text-white font-medium px-6 h-[40px] rounded-lg transition-colors flex items-center gap-2 shrink-0 mb-auto"
            >
              {isChecking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Insert
            </Button>
          </div>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-neutral-900 border border-white/10 text-white sm:max-w-md max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Confirm Word Insertion</DialogTitle>
            <DialogDescription className="text-white/60">
              Review the words to be added to the repository.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto pr-2 space-y-6 py-4">
            {validationResult?.newWords && validationResult.newWords.length > 0 && (
              <div className="space-y-2">
                <h4 className="flex items-center gap-2 text-sm font-bold text-green-400">
                  <CheckCircle2 className="w-4 h-4" /> 
                  New Words ({validationResult.newWords.length})
                </h4>
                <div className="flex flex-wrap gap-2">
                  {validationResult.newWords.map((w, i) => (
                    <span key={i} className="px-2 py-1 text-[10px] font-mono bg-green-500/10 text-green-400 border border-green-500/20 rounded">
                      {w}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {validationResult?.existingWords && validationResult.existingWords.length > 0 && (
              <div className="space-y-2">
                <h4 className="flex items-center gap-2 text-sm font-bold text-white/40">
                  <AlertCircle className="w-4 h-4" /> 
                  Already Exist ({validationResult.existingWords.length})
                </h4>
                <div className="flex flex-wrap gap-2">
                  {validationResult.existingWords.map((w, i) => (
                    <span key={i} className="px-2 py-1 text-[10px] font-mono bg-white/5 text-white/40 border border-white/10 rounded">
                      {w}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            {validationResult?.newWords.length === 0 && (
              <div className="text-center py-6 text-white/40 text-sm">
                All these words already exist in the database!
              </div>
            )}
          </div>

          <DialogFooter className="pt-4 border-t border-white/10">
            <Button variant="ghost" onClick={() => setDialogOpen(false)} className="text-white/60 hover:text-white hover:bg-white/5">
              Cancel
            </Button>
            <Button 
              onClick={handleAccept} 
              disabled={isInserting || validationResult?.newWords.length === 0}
              className="bg-orange-600 hover:bg-orange-500 text-white px-8"
            >
              {isInserting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              {validationResult?.newWords.length === 0 ? "Got it" : "Accept"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
