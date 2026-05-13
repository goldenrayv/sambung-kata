import { getLatestAnnouncement } from "@/app/actions";
import { Megaphone } from "lucide-react";
import AnnouncementForm from "./AnnouncementForm";

export const dynamic = "force-dynamic";

export default async function AdminAnnouncementsPage() {
  const announcement = await getLatestAnnouncement();

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black bg-gradient-to-r from-rose-400 to-orange-400 text-transparent bg-clip-text tracking-tighter uppercase flex items-center gap-3">
          <Megaphone className="w-8 h-8 text-rose-500" />
          Announcement
        </h1>
        <div className="text-[9px] font-black text-white/50 tracking-[0.2em] uppercase bg-white/5 px-2 py-0.5 rounded border border-white/5">
          {announcement?.isActive ? "Live" : "Hidden"}
        </div>
      </div>

      <div className="bg-neutral-950 border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
        <div className="p-8">
          <div className="max-w-2xl">
            <h2 className="text-xl font-black text-white mb-2 uppercase tracking-tight italic">
              Site-wide Banner
            </h2>
            <p className="text-sm text-white/60 mb-8 leading-relaxed">
              Shown to every authenticated user on each visit. Users can dismiss it for{" "}
              <span className="text-rose-400 font-mono">24 hours</span>; editing the content resets the dismissal.
              Toggle <span className="text-orange-400 font-mono">Active</span> off to hide it without losing the draft.
            </p>

            <AnnouncementForm initial={announcement} />
          </div>
        </div>
      </div>
    </div>
  );
}
