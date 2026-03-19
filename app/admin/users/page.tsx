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
    <div className="space-y-8 max-w-5xl mx-auto pb-8">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-white/5">
        <div className="space-y-1">
          <h1 className="text-3xl font-black tracking-tight bg-gradient-to-br from-white via-white to-white/40 text-transparent bg-clip-text font-heading">
            User Management
          </h1>
          <p className="text-white/60 text-[10px] font-black tracking-widest uppercase">System Access & Identity Control</p>
        </div>
        <div className="flex items-center gap-3 text-white/70 text-xs font-mono bg-white/5 px-4 py-2 rounded-full border border-white/5">
          <Users className="w-3.5 h-3.5 text-rose-500" />
          <span className="font-black tracking-tight">{users.length} Active Accounts</span>
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

      <section className="space-y-6">
        <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-rose-500/10 flex items-center justify-center border border-rose-500/20">
                <UserCircle className="w-4 h-4 text-rose-500" />
            </div>
            <h2 className="text-lg font-bold text-white font-heading tracking-tight uppercase">
              Provisional Enrollment
            </h2>
        </div>

        <Card className="bg-neutral-900/40 border-white/5 rounded-2xl overflow-hidden shadow-2xl backdrop-blur-sm">
          <UserForm />

          <div className="px-6 py-4 border-b border-white/5 bg-white/[0.01]">
            <div className="relative max-w-xs">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/20" />
              <form method="GET" className="flex gap-2">
                <Input
                  name="q"
                  defaultValue={query}
                  placeholder="FILTER_ACCOUNTS..."
                  className="pl-11 bg-neutral-950/40 border-white/10 rounded-lg h-10 flex-1 placeholder-white/30 text-white text-xs font-mono tracking-widest focus:ring-rose-500/20"
                />
              </form>
            </div>
          </div>

          <CardContent className="p-0 overflow-x-auto">
            <Table className="w-full">
              <TableHeader>
                <TableRow className="border-b border-white/5 bg-white/[0.01] hover:bg-transparent">
                  <TableHead className="px-6 py-4 text-[9px] font-black uppercase tracking-[0.2em] text-white/50">User Context</TableHead>
                  <TableHead className="px-6 py-4 text-[9px] font-black uppercase tracking-[0.2em] text-white/50">Auth Status</TableHead>
                  <TableHead className="px-6 py-4 text-[9px] font-black uppercase tracking-[0.2em] text-white/50">Expiration</TableHead>
                  <TableHead className="px-6 py-4 text-[9px] font-black uppercase tracking-[0.2em] text-white/50 text-right">Actions</TableHead>
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
                      <TableRow
                        key={user.id}
                        className="group hover:bg-white/[0.01] transition-all border-white/5"
                      >
                        <TableCell className="px-4 py-2 border-r border-white/5">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-md bg-white/5 flex items-center justify-center border border-white/5 group-hover:border-rose-500/20 group-hover:bg-rose-500/5 transition-all">
                              <span className="text-white/80 font-bold text-[10px]">{user.username.slice(0, 1).toUpperCase()}</span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-[11px] font-black tracking-tight text-white leading-tight">
                                {user.username}
                              </span>
                              <span className="text-[8px] font-mono text-white/30 group-hover:text-white/50 transition-colors uppercase tracking-widest">
                                ID:{user.id.slice(-6)}
                              </span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="px-4 py-2 text-center border-r border-white/5">
                          {user.isSuperUser ? (
                            <Badge className="bg-rose-500/10 text-rose-300 border-rose-500/20 rounded-md px-1.5 py-0 text-[8px] font-black uppercase tracking-[0.1em] h-4 leading-none inline-flex">
                              Super
                            </Badge>
                          ) : (
                            <Badge className="bg-white/10 text-white/70 border-white/10 rounded-md px-1.5 py-0 text-[8px] font-black uppercase tracking-[0.1em] h-4 leading-none inline-flex">
                              Standard
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="px-4 py-2 border-r border-white/5">
                            <div className="flex flex-col items-center">
                                <span className={cn(
                                    "text-[9px] font-mono font-black tracking-tight leading-none",
                                    isExpired ? "text-red-400" : "text-white"
                                )}>
                                    {user.expiresAt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                </span>
                                <span className={cn(
                                    "text-[8px] font-black uppercase tracking-widest mt-0.5",
                                    isExpired ? "text-red-500/70" : "text-white/40"
                                )}>
                                    {isExpired ? "EXPIRED" : `${diffDays}D_LEFT`}
                                </span>
                            </div>
                        </TableCell>
                        <TableCell className="px-4 py-2 text-right">
                          <div className="flex items-center justify-end scale-75 origin-right">
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

