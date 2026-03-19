import { getUsers } from "@/app/actions";
import { User } from "@prisma/client";
import { UserForm } from "@/components/user-form";
import { UserActions } from "@/components/user-actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  Search, 
  UserCircle,
  Clock,
  ExternalLink
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ q?: string }>;
}

export default async function AdminUsersPage({ searchParams }: PageProps) {
  const query = (await searchParams).q || "";
  let users: User[] = [];
  let error: string | null = null;

  try {
    users = await getUsers(query);
  } catch (e: any) {
    error = e.message || "Unknown database error";
    console.error("Prisma Error:", e);
  }

  return (
    <div className="space-y-10 max-w-7xl mx-auto pb-12">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-white/5">
        <div className="space-y-1">
          <h1 className="text-5xl font-black tracking-tight bg-gradient-to-br from-white via-white to-white/40 text-transparent bg-clip-text font-heading">
            User Management
          </h1>
          <p className="text-white/40 text-sm font-medium tracking-wide uppercase">Manage system access and credentials</p>
        </div>
        <div className="flex items-center gap-3 text-white/40 text-xs font-mono bg-white/5 px-4 py-2 rounded-full border border-white/5">
          <Users className="w-3.5 h-3.5 text-rose-500" />
          <span>{users.length} Active Accounts</span>
        </div>
      </header>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 p-6 rounded-2xl text-red-400 text-sm font-mono flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center shrink-0">
             <ExternalLink className="w-5 h-5" />
          </div>
          <div>
            <strong className="block text-base mb-1">Database Connectivity Issue</strong>
            <p className="opacity-80 leading-relaxed">{error}</p>
          </div>
        </div>
      )}

      <section className="space-y-8">
        <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center border border-rose-500/20">
                <UserCircle className="w-5 h-5 text-rose-500" />
            </div>
            <h2 className="text-2xl font-bold text-white font-heading tracking-tight">
              Create New Account
            </h2>
        </div>

        <Card className="bg-neutral-900/40 border-white/5 rounded-3xl overflow-hidden shadow-2xl backdrop-blur-sm">
          <UserForm />

          <div className="px-8 py-6 border-b border-white/5 bg-white/[0.02]">
            <div className="relative max-w-sm">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
              <form method="GET" className="flex gap-2">
                <Input
                  name="q"
                  defaultValue={query}
                  placeholder="Search by username..."
                  className="pl-11 bg-neutral-800/40 border-white/5 rounded-xl h-11 flex-1 placeholder-white/20 text-white focus:ring-rose-500/20"
                />
              </form>
            </div>
          </div>

          <CardContent className="p-0 overflow-x-auto">
            <Table className="w-full">
              <TableHeader>
                <TableRow className="border-b border-white/5 bg-white/[0.01] hover:bg-transparent">
                  <TableHead className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-white/30">User Identity & Level</TableHead>
                  <TableHead className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-white/30">Auth Status</TableHead>
                  <TableHead className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-white/30">Expiraton Profile</TableHead>
                  <TableHead className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-white/30 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="px-8 py-20 text-center">
                        <div className="flex flex-col items-center gap-3 opacity-20">
                            <Users className="w-12 h-12" />
                            <span className="italic font-mono text-sm tracking-widest uppercase">No verified accounts found</span>
                        </div>
                    </TableCell>
                  </TableRow>
                ) : (
                      users.map((u) => {
                    const user = u as any;
                    const now = new Date();
                    const diffTime = user.expiresAt.getTime() - now.getTime();
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    const isExpired = diffDays <= 0;
                    const isWarning = diffDays > 0 && diffDays <= 3;

                    return (
                      <TableRow key={user.id} className="group hover:bg-white/[0.02] transition-all border-white/5">
                        <TableCell className="px-8 py-6">
                           <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/5 group-hover:border-rose-500/20 group-hover:bg-rose-500/5 transition-all">
                                    <span className="text-white/40 font-bold uppercase text-xs">{user.username.slice(0, 2)}</span>
                                </div>
                                <div className="flex flex-col">
                                    <div className="flex items-center gap-2">
                                        <span className="text-base font-bold text-white tracking-tight">{user.username}</span>
                                        {user.isSuperUser && (
                                            <Badge variant="outline" className="bg-rose-500/10 text-rose-500 border-rose-500/20 text-[9px] h-4 px-1.5 font-black uppercase tracking-tighter">
                                                Super
                                            </Badge>
                                        )}
                                    </div>
                                    <span className="text-[10px] text-white/30 font-mono">ID: {user.id.slice(0, 8)}...</span>
                                </div>
                           </div>
                        </TableCell>
                        <TableCell className="px-8 py-6">
                           <div className="flex flex-col gap-1.5">
                               {user.isFirstTimePasswordChange ? (
                                   <Badge variant="outline" className="w-fit bg-emerald-500/10 text-emerald-400 border-emerald-500/20 rounded-lg px-2 py-0.5 text-[10px] font-bold uppercase tracking-tighter">
                                       Verified
                                   </Badge>
                               ) : (
                                   <Badge variant="outline" className="w-fit bg-orange-500/10 text-orange-400 border-orange-500/20 rounded-lg px-2 py-0.5 text-[10px] font-bold uppercase tracking-tighter">
                                       Pending Change
                                   </Badge>
                               )}
                           </div>
                        </TableCell>
                        <TableCell className="px-8 py-6">
                           <div className="flex items-start gap-3">
                                <Clock className={cn(
                                    "w-4 h-4 mt-0.5",
                                    isExpired ? "text-red-500" : isWarning ? "text-orange-400" : "text-white/20"
                                )} />
                                <div className="flex flex-col">
                                    <span className="text-white text-sm font-bold tabular-nums">
                                        {user.expiresAt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                    </span>
                                    <span className={cn(
                                    "text-[10px] font-bold uppercase tracking-widest",
                                    isExpired ? "text-red-500" : isWarning ? "text-orange-400" : "text-white/40"
                                    )}>
                                    {isExpired ? "Access Terminated" : `${diffDays} days functional`}
                                    </span>
                                </div>
                           </div>
                        </TableCell>
                        <TableCell className="px-8 py-6 text-right">
                          <div className="flex items-center justify-end gap-2">
                             <UserActions userId={user.id} />
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

