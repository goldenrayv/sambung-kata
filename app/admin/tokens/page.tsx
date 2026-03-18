import { getUsers, deleteUser, extendUserToken } from "@/app/actions";
import { User } from "@prisma/client";
import { TokenForm } from "@/components/token-form";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, Key, Search, CalendarPlus, MoreHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ q?: string }>;
}

export default async function AdminTokensPage({ searchParams }: PageProps) {
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
    <div className="space-y-8">
      <header className="border-b border-white/10 pb-6">
        <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-rose-400 to-orange-400 text-transparent bg-clip-text inline-block font-heading">
          Access Tokens
        </h1>
        <p className="text-white mt-2 text-sm">Issue and revoke user access keys.</p>
      </header>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl text-red-400 text-sm font-mono whitespace-pre-wrap">
          <strong>Database Connection Error:</strong><br />
          {error}
          <p className="mt-2 text-xs text-white/60">Check DATABASE_URL in Vercel settings and ensure the database is reachable.</p>
        </div>
      )}

      <section className="space-y-6">
        <h2 className="text-xl font-semibold flex items-center gap-2 text-white font-heading">
          <Key className="w-5 h-5 text-rose-500" />
          Issue New Key
        </h2>

        <Card className="bg-neutral-900 border-white/10 rounded-2xl overflow-hidden shadow-xl">
          <TokenForm />

          <div className="p-6 border-b border-white/10 bg-white/5">
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <form method="GET" className="flex gap-2">
                <Input
                  name="q"
                  defaultValue={query}
                  placeholder="Search username..."
                  className="pl-10 bg-neutral-800 border-white/10 rounded-lg h-10 flex-1 h-10"
                />
              </form>
            </div>
          </div>

          <CardContent className="p-0 overflow-x-auto">
            <Table className="w-full text-left">
              <TableHeader>
                <TableRow className="border-b border-white/5 bg-white/5 text-white text-sm uppercase tracking-wider hover:bg-transparent">
                  <TableHead className="px-6 py-4">User</TableHead>
                  <TableHead className="px-6 py-4">Token (hashed)</TableHead>
                  <TableHead className="px-6 py-4">Expires</TableHead>
                  <TableHead className="px-6 py-4 text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-white/5">
                {users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="px-6 py-12 text-center text-white/40 italic font-mono">
                      No users found.
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user) => {
                    const deleteAction = deleteUser.bind(null, user.id);
                    const now = new Date();
                    const diffTime = user.expiresAt.getTime() - now.getTime();
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    const isExpired = diffDays <= 0;
                    const isWarning = diffDays > 0 && diffDays <= 3;

                    return (
                      <TableRow key={user.id} className="hover:bg-white/5 transition-colors border-white/5 font-mono">
                        <TableCell className="px-6 py-4 font-medium text-white">
                          {user.username}
                        </TableCell>
                        <TableCell className="px-6 py-4 text-rose-400 font-mono text-xs">
                          {user.token.slice(0, 16)}…
                        </TableCell>
                        <TableCell className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="text-white text-sm">
                              {user.expiresAt.toISOString().split("T")[0]}
                            </span>
                            <span className={cn(
                              "text-[10px] font-medium uppercase tracking-wider",
                              isExpired ? "text-red-500" : isWarning ? "text-orange-400" : "text-white/40"
                            )}>
                              {isExpired ? "Expired" : `${diffDays} days remaining`}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                             <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon-sm" className="text-white">
                                    <MoreHorizontal className="w-4 h-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="bg-neutral-900 border-white/10 text-white">
                                  <DropdownMenuLabel>Manage Access</DropdownMenuLabel>
                                  <DropdownMenuSeparator className="bg-white/5" />
                                  <DropdownMenuLabel className="text-[10px] text-white/40 uppercase">Extend Expiry</DropdownMenuLabel>
                                  {[1, 3, 7, 14, 30].map((d) => (
                                    <DropdownMenuItem
                                      key={d}
                                      onClick={async () => {
                                        "use server";
                                        await extendUserToken(user.id, d);
                                      }}
                                      className="flex items-center gap-2 cursor-pointer focus:bg-rose-500/20 focus:text-rose-400"
                                    >
                                      <CalendarPlus className="w-3.5 h-3.5" />
                                      Add {d} Day{d > 1 ? "s" : ""}
                                    </DropdownMenuItem>
                                  ))}
                                  <DropdownMenuSeparator className="bg-white/5" />
                                  <form action={deleteAction}>
                                    <DropdownMenuItem asChild>
                                      <button type="submit" className="w-full flex items-center gap-2 text-red-400 cursor-pointer focus:bg-red-500/20 focus:text-red-400">
                                        <Trash2 className="w-3.5 h-3.5" />
                                        Revoke Access
                                      </button>
                                    </DropdownMenuItem>
                                  </form>
                                </DropdownMenuContent>
                             </DropdownMenu>
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
