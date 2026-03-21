import { prisma } from "@/lib/prisma";
import { Book, Users, History, Download, ShieldCheck, ShieldAlert, ShieldX } from "lucide-react";
import Link from "next/link";
import AdminExportButton from "./AdminExportButton";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  // Fetch stats in parallel
  const [totalWords, verifiedWords, unverifiedWords, rejectedWords, totalUsers, recentWords, recentUsers] = await Promise.all([
    prisma.word.count(),
    prisma.word.count({ where: { isVerified: "verified" } }),
    prisma.word.count({ where: { isVerified: "unverified" } }),
    prisma.word.count({ where: { isVerified: "rejected" } }),
    prisma.user.count(),
    prisma.word.findMany({
      orderBy: { id: 'desc' }, 
      take: 5,
    }),
    prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
    })
  ]);

  const stats = [
    {
      label: "Total Corpus",
      value: totalWords,
      icon: Book,
      color: "text-white/40",
      bg: "bg-white/5",
      border: "border-white/10",
    },
    {
      label: "Verified",
      value: verifiedWords,
      icon: ShieldCheck,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/20",
    },
    {
      label: "Unverified",
      value: unverifiedWords,
      icon: ShieldAlert,
      color: "text-orange-400",
      bg: "bg-orange-500/10",
      border: "border-orange-500/20",
    },
    {
      label: "Rejected",
      value: rejectedWords,
      icon: ShieldX,
      color: "text-rose-400",
      bg: "bg-rose-500/10",
      border: "border-rose-500/20",
    },
    {
      label: "Active Users",
      value: totalUsers,
      icon: Users,
      color: "text-white/60",
      bg: "bg-white/5",
      border: "border-white/10",
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black bg-gradient-to-r from-rose-400 to-orange-400 text-transparent bg-clip-text tracking-tighter uppercase">
          Dashboard
        </h1>
        <div className="flex items-center gap-3">
          <AdminExportButton />
          <div className="text-[9px] font-black text-white/50 tracking-[0.2em] uppercase bg-white/5 px-2 py-0.5 rounded border border-white/5">
            Live Repository
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className={`p-4 rounded-xl bg-neutral-950 border ${stat.border} relative overflow-hidden group hover:bg-white/[0.01] transition-all duration-300`}
          >
            <div className={`absolute top-0 right-0 p-2 ${stat.color} opacity-5 group-hover:opacity-10 transition-opacity`}>
              <stat.icon className="w-12 h-12 -mr-2 -mt-2 rotate-12" />
            </div>
            <div className="relative">
              <div className={`w-8 h-8 rounded-lg ${stat.bg} ${stat.color} flex items-center justify-center mb-3 shadow-inner`}>
                <stat.icon className="w-4 h-4" />
              </div>
              <div className="text-xl font-black text-white mb-0.5 tracking-tight">
                {stat.value.toLocaleString()}
              </div>
              <div className="text-[9px] font-black text-white uppercase tracking-[0.15em] leading-none">
                {stat.label}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Recent Words */}
        <div className="bg-neutral-950 border border-white/5 rounded-xl overflow-hidden shadow-2xl">
          <div className="px-4 py-2.5 border-b border-white/5 flex items-center justify-between bg-white/[0.01]">
            <h3 className="text-[9px] font-black text-white tracking-[0.2em] uppercase flex items-center gap-2">
              <History className="w-3.5 h-3.5 text-rose-500" />
              Word Intake
            </h3>
            <Link 
              href="/admin/words" 
              className="text-[9px] font-black text-rose-400 hover:text-rose-300 transition-colors uppercase tracking-widest"
            >
              Logs
            </Link>
          </div>
          <div className="divide-y divide-white/5">
            {recentWords.length > 0 ? (
              recentWords.map((word) => (
                <div key={word.id} className="px-4 py-2.5 flex items-center justify-between group hover:bg-white/[0.01] transition-colors">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-1.5 h-1.5 rounded-full ${
                      word.isVerified === 'verified' ? 'bg-emerald-500' : 
                      word.isVerified === 'rejected' ? 'bg-rose-500' : 'bg-orange-500'
                    }`} />
                    <span className="font-bold text-white text-xs tracking-wide uppercase">{word.word}</span>
                  </div>
                  <span className={`text-[9px] font-black uppercase tracking-tighter ${
                    word.isVerified === 'verified' ? 'text-emerald-400' : 
                    word.isVerified === 'rejected' ? 'text-rose-400' : 'text-orange-400'
                  }`}>
                    {word.isVerified}
                  </span>
                </div>
              ))
            ) : (
              <div className="p-12 text-center">
                <p className="text-sm font-medium text-white/20">No words found in repository.</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Users */}
        <div className="bg-neutral-950 border border-white/5 rounded-xl overflow-hidden shadow-2xl">
          <div className="px-4 py-2.5 border-b border-white/5 flex items-center justify-between bg-white/[0.01]">
            <h3 className="text-[9px] font-black text-white tracking-[0.2em] uppercase flex items-center gap-2">
              <Users className="w-3.5 h-3.5 text-orange-500" />
              Access Log
            </h3>
            <Link 
              href="/admin/users" 
              className="text-[9px] font-black text-orange-400 hover:text-orange-300 transition-colors uppercase tracking-widest"
            >
              Access
            </Link>
          </div>
          <div className="divide-y divide-white/5">
            {recentUsers.length > 0 ? (
              recentUsers.map((user) => (
                <div key={user.id} className="px-4 py-2.5 flex items-center justify-between group hover:bg-white/[0.01] transition-colors">
                  <div>
                    <div className="font-bold text-white text-xs">{user.username}</div>
                    <div className="text-[9px] font-black text-white uppercase tracking-tighter opacity-60">
                        {new Date(user.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                    </div>
                  </div>
                  <div className="text-[9px] font-mono text-white bg-white/10 px-1.5 py-0.5 rounded border border-white/10">
                    {user.id.slice(0, 4)}
                  </div>
                </div>
              ))
            ) : (
              <div className="p-12 text-center">
                <p className="text-sm font-medium text-white/20">No users found.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
