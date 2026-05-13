"use client";

import { useEffect, useState } from "react";
import { Megaphone } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getActiveAnnouncement } from "@/app/actions";

interface Announcement {
  id: string;
  title: string;
  body: string;
  updatedAt: string;
}

const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const DISMISS_KEY_PREFIX = "sk_announcement_dismissed_";

function dismissKey(updatedAt: string) {
  return `${DISMISS_KEY_PREFIX}${new Date(updatedAt).getTime()}`;
}

export default function AnnouncementDialog() {
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [open, setOpen] = useState(false);
  const [dontShow24h, setDontShow24h] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const data = await getActiveAnnouncement();
      if (cancelled || !data) return;

      const key = dismissKey(data.updatedAt);
      const dismissedUntilRaw = localStorage.getItem(key);
      const dismissedUntil = dismissedUntilRaw ? parseInt(dismissedUntilRaw, 10) : 0;

      if (Number.isFinite(dismissedUntil) && dismissedUntil > Date.now()) return;

      setAnnouncement(data);
      setOpen(true);
    })();

    return () => { cancelled = true; };
  }, []);

  const handleOpenChange = (next: boolean) => {
    if (!next && announcement) {
      if (dontShow24h) {
        localStorage.setItem(dismissKey(announcement.updatedAt), String(Date.now() + ONE_DAY_MS));
      }
      // Prune older dismissal keys so localStorage doesn't bloat.
      const activeKey = dismissKey(announcement.updatedAt);
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const k = localStorage.key(i);
        if (k && k.startsWith(DISMISS_KEY_PREFIX) && k !== activeKey) {
          localStorage.removeItem(k);
        }
      }
    }
    setOpen(next);
  };

  if (!announcement) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="bg-neutral-900 border-white/10 text-white sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base font-black uppercase tracking-wide text-white">
            <Megaphone className="w-4 h-4 text-rose-400" />
            {announcement.title}
          </DialogTitle>
          <DialogDescription className="text-sm text-white/70 leading-relaxed whitespace-pre-wrap pt-2">
            {announcement.body}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="bg-white/[0.02] border-t border-white/5">
          <label className="flex items-center gap-2 text-[11px] font-bold text-white/60 mr-auto cursor-pointer">
            <input
              type="checkbox"
              checked={dontShow24h}
              onChange={(e) => setDontShow24h(e.target.checked)}
              className="w-3.5 h-3.5 accent-rose-500"
            />
            Don&apos;t show again for 24h
          </label>
          <button
            type="button"
            onClick={() => handleOpenChange(false)}
            className="px-4 py-2 rounded-lg bg-rose-500 hover:bg-rose-400 text-white text-xs font-black uppercase tracking-widest transition-colors"
          >
            Close
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
