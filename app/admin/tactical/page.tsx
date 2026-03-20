import { getTacticalSuffixes } from "@/app/actions";
import TacticalSuffixManager from "./TacticalSuffixManager";
import { Target } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminTacticalPage() {
  const suffixes = await getTacticalSuffixes();

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black bg-gradient-to-r from-rose-400 to-orange-400 text-transparent bg-clip-text tracking-tighter uppercase flex items-center gap-3">
          <Target className="w-8 h-8 text-rose-500" />
          Tactical Suffix Config
        </h1>
        <div className="text-[9px] font-black text-white/50 tracking-[0.2em] uppercase bg-white/5 px-2 py-0.5 rounded border border-white/5">
          Live Config
        </div>
      </div>

      <div className="bg-neutral-950 border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
        <div className="p-8">
          <div className="max-w-2xl">
            <h2 className="text-xl font-black text-white mb-2 uppercase tracking-tight italic">
              Dynamic Kill-Zone Control
            </h2>
            <p className="text-sm text-white/60 mb-8 leading-relaxed">
              Manage the suffixes used for tactical grouping in the main search interface. 
              Longer suffixes are prioritized automatically to ensure unique matching (e.g., <span className="text-rose-400 font-mono">AX</span> matches before <span className="text-orange-400 font-mono">X</span>).
            </p>

            <TacticalSuffixManager initialSuffixes={suffixes} />
          </div>
        </div>
      </div>
    </div>
  );
}
