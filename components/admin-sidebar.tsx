"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, Book, ClipboardCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { adminLogout } from "@/app/actions";
import { LogOut, Home } from "lucide-react";

const menuItems = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { name: "User Management", href: "/admin/users", icon: Users },
  { name: "Word Repository", href: "/admin/words", icon: Book },
  { name: "Word Review", href: "/admin/review", icon: ClipboardCheck },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-neutral-900 border-r border-white/10 flex flex-col h-screen sticky top-0 shrink-0">
      <div className="p-6 border-b border-white/10">
        <h2 className="text-xl font-bold font-heading bg-gradient-to-r from-rose-400 to-orange-400 text-transparent bg-clip-text">
          Admin Portal
        </h2>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => (
          <Link
            key={item.name}
            href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200",
                // Exact match for dashboard, startswith for others
                (item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href))
                  ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                  : "text-white hover:bg-white/5"
              )}
          >
            <item.icon className="w-4 h-4" />
            {item.name}
          </Link>
        ))}
      </nav>

      <div className="p-4 border-t border-white/10 space-y-1">
        {/* Back to the user-facing app */}
        <Link
          href="/"
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-white hover:bg-white/5 transition-all"
        >
          <Home className="w-4 h-4" />
          Back to App
        </Link>

        {/* Admin logout — clears the session cookie */}
        <form action={adminLogout}>
          <button
            type="submit"
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-white hover:text-red-400 hover:bg-red-400/5 transition-all"
          >
            <LogOut className="w-4 h-4" />
            Admin Logout
          </button>
        </form>
      </div>
    </aside>
  );
}
