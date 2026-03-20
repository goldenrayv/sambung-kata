"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, Book, ShieldCheck, Target } from "lucide-react";
import { cn } from "@/lib/utils";
import { adminLogout } from "@/app/actions";
import { LogOut, Home } from "lucide-react";

const menuItems = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { name: "User Management", href: "/admin/users", icon: Users },
  { name: "Word Repository", href: "/admin/words", icon: Book },
  { name: "Bulk Verification", href: "/admin/bulk-verify", icon: ShieldCheck },
  { name: "Tactical Config", href: "/admin/tactical", icon: Target },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-60 bg-neutral-950 border-r border-white/5 flex flex-col h-screen sticky top-0 shrink-0">
      <div className="px-6 py-5 border-b border-white/5">
        <h2 className="text-lg font-black uppercase tracking-widest bg-gradient-to-r from-rose-400 to-orange-400 text-transparent bg-clip-text font-heading">
          Admin
        </h2>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {menuItems.map((item) => (
          <Link
            key={item.name}
            href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-2.5 rounded-xl text-[13px] font-bold tracking-tight transition-all duration-200",
                // Exact match for dashboard, startswith for others
                (item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href))
                  ? "bg-rose-500/10 text-rose-400 border border-rose-500/10 shadow-[0_0_15px_rgba(244,63,94,0.05)]"
                  : "text-white/70 hover:text-white hover:bg-white/5 border border-transparent"
              )}
          >
            <item.icon className="w-4 h-4" />
            {item.name}
          </Link>
        ))}
      </nav>

      <div className="p-3 border-t border-white/5 space-y-1 bg-white/[0.01]">
        {/* Back to the user-facing app */}
        <Link
          href="/"
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
    </aside>
  );
}
