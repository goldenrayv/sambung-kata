"use client";

import { useState } from "react";
import { ShieldCheck, Info } from "lucide-react";
import { bulkVerifyWords } from "@/app/actions";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export default function BulkVerifyPage() {
  const [text, setText] = useState("");
  const [isPending, setIsPending] = useState(false);

  const handleVerify = async () => {
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
      const result = await bulkVerifyWords(wordList);
      if (result.success) {
        toast.success(`Successfully verified ${result.count} words! ✨`);
        setText("");
      } else {
        toast.error(result.error || "Failed to verify words.");
      }
    } catch (error) {
      toast.error("An unexpected error occurred.");
    } finally {
      setIsPending(false);
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
              Paste a list of words separated by newlines or commas. Any words already in the repository will have their status updated to <span className="text-emerald-400 font-bold">Verified</span>. This is an destructive, immediate action.
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
            onClick={handleVerify}
            disabled={isPending || !text.trim()}
            className="bg-emerald-500 hover:bg-emerald-600 text-black font-black uppercase tracking-widest px-8"
          >
            {isPending ? "Verifying..." : "Verify Tokens"}
          </Button>
        </div>
      </div>
    </div>
  );
}
