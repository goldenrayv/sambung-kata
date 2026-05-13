"use client";

import { useState, useTransition } from "react";
import { Save, Eye, EyeOff } from "lucide-react";
import { saveAnnouncement } from "@/app/actions";
import { toast } from "sonner";

interface Announcement {
  id: string;
  title: string;
  body: string;
  isActive: boolean;
  updatedAt: string;
}

export default function AnnouncementForm({ initial }: { initial: Announcement | null }) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [body, setBody] = useState(initial?.body ?? "");
  const [isActive, setIsActive] = useState(initial?.isActive ?? false);
  const [pending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) {
      toast.error("Title and body are required");
      return;
    }

    const fd = new FormData();
    fd.set("title", title);
    fd.set("body", body);
    if (isActive) fd.set("isActive", "on");

    startTransition(async () => {
      const result = await saveAnnouncement(fd);
      if (result.success) {
        toast.success(isActive ? "Announcement saved & published" : "Announcement saved (hidden)");
      } else {
        toast.error(result.error || "Failed to save");
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <label className="text-[10px] font-black uppercase tracking-widest text-white/60">Title</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Maintenance notice"
          maxLength={120}
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:border-rose-500/50 focus:outline-none transition-colors font-bold"
        />
      </div>

      <div className="space-y-2">
        <label className="text-[10px] font-black uppercase tracking-widest text-white/60">Body</label>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="The corpus will be unavailable from 9–10 PM tonight for migration."
          rows={5}
          maxLength={1000}
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:border-rose-500/50 focus:outline-none transition-colors text-sm leading-relaxed resize-y"
        />
        <div className="text-[10px] text-white/30 text-right font-mono">{body.length}/1000</div>
      </div>

      <label className="flex items-center gap-3 p-4 rounded-xl bg-white/[0.02] border border-white/5 cursor-pointer hover:bg-white/[0.04] transition-colors">
        <input
          type="checkbox"
          checked={isActive}
          onChange={(e) => setIsActive(e.target.checked)}
          className="w-4 h-4 accent-rose-500"
        />
        <div className="flex-1">
          <div className="text-sm font-bold text-white flex items-center gap-2">
            {isActive ? <Eye className="w-4 h-4 text-emerald-400" /> : <EyeOff className="w-4 h-4 text-white/40" />}
            {isActive ? "Active — visible to users" : "Hidden — saved as draft"}
          </div>
        </div>
      </label>

      <button
        type="submit"
        disabled={pending}
        className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-rose-500 to-orange-500 text-white font-black uppercase tracking-widest text-sm shadow-lg hover:opacity-90 disabled:opacity-50 transition-opacity"
      >
        <Save className="w-4 h-4" />
        {pending ? "Saving..." : "Save Announcement"}
      </button>

      {initial && (
        <div className="text-[10px] text-white/40 text-center font-mono">
          last edited {new Date(initial.updatedAt).toLocaleString()}
        </div>
      )}
    </form>
  );
}
