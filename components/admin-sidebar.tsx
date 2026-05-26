"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { LayoutDashboard, Users, Book, ShieldCheck, Target, BarChart2, Megaphone, LogOut, Home, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { adminLogout } from "@/app/actions";

const menuItems = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { name: "User Management", href: "/admin/users", icon: Users },
  { name: "Word Repository", href: "/admin/words", icon: Book },
  { name: "Bulk Verification", href: "/admin/bulk-verify", icon: ShieldCheck },
  { name: "Tactical Config", href: "/admin/tactical", icon: Target },
  { name: "Combo Analysis", href: "/admin/analysis", icon: BarChart2 },
  { name: "Announcement", href: "/admin/announcements", icon: Megaphone },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Close the mobile drawer whenever the route changes.
  useEffect(() => { setOpen(false); }, [pathname]);

  // Lock body scroll while the mobile drawer is open.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  // Shared nav body — rendered in both the desktop sidebar and the mobile drawer.
  // `onNavigate` lets the drawer close itself when a link is tapped.
  const navBody = (onNavigate?: () => void) => (
    <>
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {menuItems.map((item) => (
          <Link
            key={item.name}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 px-4 py-2.5 rounded-xl text-[13px] font-bold tracking-tight transition-all duration-200",
              isActive(item.href)
                ? "bg-rose-500/10 text-rose-400 border border-rose-500/10 shadow-[0_0_15px_rgba(244,63,94,0.05)]"
                : "text-white/70 hover:text-white hover:bg-white/5 border border-transparent"
            )}
          >
            <item.icon className="w-4 h-4 shrink-0" />
            {item.name}
          </Link>
        ))}
      </nav>

      <div className="p-3 border-t border-white/5 space-y-1 bg-white/[0.01]">
        {/* Back to the user-facing app */}
        <Link
          href="/"
          onClick={onNavigate}
          className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-[12px] font-bold text-white/70 hover:text-white hover:bg-white/5 transition-all"
        >
          <Home className="w-4 h-4" />
          App Interface
        </Link>

        {/* Admin logout — clears the session cookie */}
        <form action={adminLogout}>
          <button
            type="submit"
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-[12px] font-bold text-white/70 hover:text-red-400 hover:bg-red-400/5 transition-all"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </form>
      </div>
    </>
  );

  const brand = (
    <h2 className="text-lg font-black uppercase tracking-widest bg-gradient-to-r from-rose-400 to-orange-400 text-transparent bg-clip-text font-heading">
      Admin
    </h2>
  );

  return (
    <>
      {/* Mobile top bar — hamburger + brand. Hidden on lg+. */}
      <header className="lg:hidden sticky top-0 z-40 flex items-center gap-3 px-4 h-14 bg-neutral-950/90 backdrop-blur-md border-b border-white/5">
        <button
          onClick={() => setOpen(true)}
          aria-label="Open admin menu"
          className="p-2 -ml-2 rounded-lg text-white/70 hover:text-white hover:bg-white/5 transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>
        {brand}
      </header>

      {/* Mobile drawer + backdrop */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => setOpen(false)}
          />
          <aside className="absolute top-0 left-0 h-full w-64 max-w-[80%] bg-neutral-950 border-r border-white/5 flex flex-col shadow-2xl animate-in slide-in-from-left-4 fade-in duration-300">
            <div className="px-6 py-5 border-b border-white/5 flex items-center justify-between">
              {brand}
              <button
                onClick={() => setOpen(false)}
                aria-label="Close admin menu"
                className="p-1.5 -mr-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/5 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {navBody(() => setOpen(false))}
          </aside>
        </div>
      )}

      {/* Desktop sidebar — static. Hidden below lg. */}
      <aside className="hidden lg:flex w-60 bg-neutral-950 border-r border-white/5 flex-col h-screen sticky top-0 shrink-0">
        <div className="px-6 py-5 border-b border-white/5">
          {brand}
        </div>
        {navBody()}
      </aside>
    </>
  );
}
