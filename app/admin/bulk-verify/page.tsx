"use client";

import { useState } from "react";
import { ShieldCheck, Info, CheckCircle2, AlertCircle, Loader2, Database } from "lucide-react";
import { bulkVerifyWords, checkNewWords } from "@/app/actions";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ValidationResult {
  newWords: string[];
  existingWords: string[];
}

export default function BulkVerifyPage() {
  const [text, setText] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);

  const handlePreview = async () => {
    const wordList = text
      .split(/[\n,]+/)
      .map((w) => w.trim())
      .filter(Boolean);

    if (wordList.length === 0) {
      toast.error("Please enter at least one word.");
      return;
    }

    setIsPending(true);
    try {
      const result = await checkNewWords(wordList);
      setValidationResult(result);
      setDialogOpen(true);
    } catch (error) {
      toast.error("Failed to check words against repository.");
    } finally {
      setIsPending(false);
    }
  };

  const handleConfirmAction = async () => {
    if (!validationResult || validationResult.existingWords.length === 0) {
      setDialogOpen(false);
      return;
    }

    setIsVerifying(true);
    try {
      const result = await bulkVerifyWords(validationResult.existingWords);
      if (result.success) {
        toast.success(`Successfully verified ${result.count} words! ✨`);
        setText("");
        setDialogOpen(false);
      } else {
        toast.error(result.error || "Failed to verify words.");
      }
    } catch (error) {
      toast.error("An unexpected error occurred.");
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black bg-gradient-to-r from-rose-400 to-orange-400 text-transparent bg-clip-text tracking-tighter uppercase mb-1">
            Bulk Verification
          </h1>
          <p className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em]">
            Force Upgrade Tokens to Verified Status
          </p>
        </div>
        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-emerald-500" />
        </div>
      </div>

      <div className="bg-neutral-900/50 border border-white/5 rounded-2xl p-6 space-y-4">
        <div className="flex items-start gap-3 p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-xl">
          <Info className="w-4 h-4 text-emerald-400 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-[11px] font-black text-emerald-400 uppercase tracking-widest">How it works</h4>
            <p className="text-[11px] text-white/50 leading-relaxed">
              Paste a list of words separated by newlines or commas. This tool will identify words already in the repository and upgrade them to <span className="text-emerald-400 font-bold">Verified</span>. New words will be ignored.
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.15em] ml-1">
            Raw Word Stream
          </label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="KATA1, KATA2, KATA3..."
            className="w-full h-80 bg-neutral-950 border border-white/5 rounded-xl p-4 text-sm font-mono text-white/80 focus:outline-none focus:border-rose-500/50 transition-colors resize-none placeholder:text-white/5"
          />
        </div>

        <div className="flex justify-end">
          <Button
            onClick={handlePreview}
            disabled={isPending || !text.trim()}
            className="bg-emerald-500 hover:bg-emerald-600 text-black font-black uppercase tracking-widest px-8"
          >
            {isPending ? <Loader2 className="w-3 h-3 animate-spin mr-2" /> : null}
            Preview Verification
          </Button>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-neutral-950 border border-white/10 text-white max-w-2xl rounded-[28px] p-0 overflow-hidden shadow-[0_0_80px_rgba(16,185,129,0.15)]">
          <div className="p-6 space-y-6 max-h-[80vh] flex flex-col font-sans">
            <DialogHeader>
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 shadow-inner">
                        <ShieldCheck className="w-5 h-5 text-emerald-500" />
                    </div>
                    <div>
                        <DialogTitle className="text-xl font-black uppercase tracking-tight">Verification Review</DialogTitle>
                        <DialogDescription className="text-[10px] text-white/60 font-black uppercase tracking-widest">
                        Check existing tokens and missing entries
                        </DialogDescription>
                    </div>
                </div>
            </DialogHeader>
            
            <div className="flex-1 overflow-y-auto pr-1 space-y-8 py-2 scrollbar-hide">
                {validationResult?.existingWords && validationResult.existingWords.length > 0 && (
                <div className="space-y-3">
                    <div className="flex items-center justify-between border-b border-emerald-500/10 pb-2">
                        <h4 className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-emerald-400">
                          <CheckCircle2 className="w-3.5 h-3.5" /> 
                          Ready to Verify ({validationResult.existingWords.length})
                        </h4>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                    {validationResult.existingWords.map((w, i) => (
                        <div key={i} className="px-2 py-1 text-[9px] font-black font-mono bg-emerald-500/5 text-emerald-400 border border-emerald-500/10 rounded-lg tracking-widest italic leading-none">
                        {w}
                        </div>
                    ))}
                    </div>
                </div>
                )}

                {validationResult?.newWords && validationResult.newWords.length > 0 && (
                <div className="space-y-3">
                    <div className="flex items-center justify-between border-b border-white/5 pb-2">
                        <h4 className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-white/60">
                          <AlertCircle className="w-3.5 h-3.5" /> 
                          Ignored / Not in Repository ({validationResult.newWords.length})
                        </h4>
                    </div>
                    <p className="text-[10px] text-white/40 italic">These words do not exist in the database and will be skipped.</p>
                    <div className="flex flex-wrap gap-1.5 opacity-50">
                    {validationResult.newWords.map((w, i) => (
                        <div key={i} className="px-2 py-1 text-[9px] font-black font-mono bg-white/5 text-white/70 border border-white/5 rounded-lg tracking-widest leading-none">
                        {w}
                        </div>
                    ))}
                    </div>
                </div>
                )}
                
                {validationResult?.existingWords.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 gap-4 bg-white/[0.02] rounded-2xl border border-white/5 mx-2">
                    <div className="p-3 rounded-full bg-rose-500/5 border border-rose-500/10 animate-pulse text-rose-500/20">
                        <AlertCircle className="w-6 h-6" />
                    </div>
                    <div className="text-center space-y-1">
                        <p className="text-[11px] text-white font-black tracking-widest uppercase">No Matches Found</p>
                        <p className="text-[9px] text-white/60 font-bold px-6 italic font-mono uppercase tracking-tighter">None of your words exist in the repository yet.</p>
                    </div>
                </div>
                )}
            </div>

            <DialogFooter className="gap-2 border-t border-white/5 pt-6 mt-2">
                <Button variant="ghost" onClick={() => setDialogOpen(false)} className="flex-1 h-11 rounded-xl text-[10px] font-black uppercase tracking-widest text-white/70 hover:text-white hover:bg-white/5 transition-all">
                Cancel
                </Button>
                <Button 
                onClick={handleConfirmAction} 
                disabled={isVerifying || validationResult?.existingWords.length === 0}
                className="flex-[2] bg-emerald-500 hover:bg-emerald-400 text-black h-11 rounded-xl font-black shadow-lg shadow-emerald-500/20 transition-all active:scale-95 disabled:opacity-20 uppercase tracking-[0.1em] text-[10px]"
                >
                {isVerifying ? <Loader2 className="w-3 h-3 animate-spin mr-2" /> : null}
                {validationResult?.existingWords.length === 0 ? "Understood" : "Verify Tokens"}
                </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
