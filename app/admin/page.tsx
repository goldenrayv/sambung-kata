import { prisma } from "@/lib/prisma";
import { Book, Key, History, Plus, Ghost } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  // Fetch stats in parallel
  const [totalWords, activeWordsCount, hiddenWordsCount, totalTokens, recentWords, recentTokens] = await Promise.all([
    prisma.word.count(),
    prisma.word.count({ where: { isActive: true } }),
    prisma.word.count({ where: { isActive: false } }),
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
      label: "Total Words",
      value: totalWords,
      icon: Book,
      color: "text-rose-400",
      bg: "bg-rose-500/10",
      border: "border-rose-500/20",
    },
    {
      label: "Active Words",
      value: activeWordsCount,
      icon: Plus,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/20",
    },
    {
      label: "Hidden Words",
      value: hiddenWordsCount,
      icon: Ghost,
      color: "text-neutral-400",
      bg: "bg-neutral-500/10",
      border: "border-neutral-500/20",
    },
    {
      label: "Access Tokens",
      value: totalTokens,
      icon: Key,
      color: "text-orange-400",
      bg: "bg-orange-500/10",
      border: "border-orange-500/20",
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-black bg-gradient-to-r from-rose-400 to-orange-400 text-transparent bg-clip-text italic tracking-tighter">
          ADMIN DASHBOARD
        </h1>
        <div className="text-[10px] font-bold text-white/40 tracking-widest uppercase bg-white/5 px-3 py-1 rounded-full border border-white/10">
          Live Repository Metrics
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className={`p-6 rounded-2xl bg-neutral-900 border ${stat.border} relative overflow-hidden group hover:scale-[1.02] transition-all duration-300`}
          >
            <div className={`absolute top-0 right-0 p-4 ${stat.color} opacity-10 group-hover:opacity-20 transition-opacity`}>
              <stat.icon className="w-16 h-16 -mr-4 -mt-4 rotate-12" />
            </div>
            <div className="relative">
              <div className={`w-10 h-10 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center mb-4`}>
                <stat.icon className="w-5 h-5" />
              </div>
              <div className="text-3xl font-black text-white mb-1">
                {stat.value.toLocaleString()}
              </div>
              <div className="text-xs font-bold text-white/40 uppercase tracking-widest leading-none">
                {stat.label}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Words */}
        <div className="bg-neutral-900 border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
          <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
            <h3 className="text-xs font-bold text-white tracking-widest uppercase flex items-center gap-2">
              <History className="w-4 h-4 text-rose-400" />
              Recent Word Submissions
            </h3>
            <Link 
              href="/admin/words" 
              className="text-[10px] font-bold text-rose-400 hover:text-white transition-colors uppercase tracking-widest"
            >
              View All
            </Link>
          </div>
          <div className="divide-y divide-white/5">
            {recentWords.length > 0 ? (
              recentWords.map((word) => (
                <div key={word.id} className="px-6 py-4 flex items-center justify-between group hover:bg-white/[0.02] transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${word.isActive ? 'bg-emerald-500' : 'bg-neutral-500'}`} />
                    <span className="font-bold text-white">{word.word}</span>
                  </div>
                  <span className="text-[10px] font-medium text-white/20 uppercase">
                    {word.isActive ? 'Active' : 'Hidden'}
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

        {/* Recent Tokens */}
        <div className="bg-neutral-900 border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
          <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
            <h3 className="text-xs font-bold text-white tracking-widest uppercase flex items-center gap-2">
              <Key className="w-4 h-4 text-orange-400" />
              Recent Access Tokens
            </h3>
            <Link 
              href="/admin/tokens" 
              className="text-[10px] font-bold text-orange-400 hover:text-white transition-colors uppercase tracking-widest"
            >
              Manage
            </Link>
          </div>
          <div className="divide-y divide-white/5">
            {recentTokens.length > 0 ? (
              recentTokens.map((user) => (
                <div key={user.id} className="px-6 py-4 flex items-center justify-between group hover:bg-white/[0.02] transition-colors">
                  <div>
                    <div className="font-bold text-white">{user.username}</div>
                    <div className="text-[10px] font-medium text-white/20 uppercase tracking-tighter">
                        Issued {new Date(user.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="text-[10px] font-mono text-white/40 bg-white/5 px-2 py-1 rounded border border-white/10">
                    {user.token.slice(0, 8)}...
                  </div>
                </div>
              ))
            ) : (
              <div className="p-12 text-center">
                <p className="text-sm font-medium text-white/20">No access tokens issued yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
