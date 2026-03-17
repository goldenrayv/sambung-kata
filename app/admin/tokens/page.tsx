import { getUsers, deleteUser } from "@/app/actions";
import { AdminSidebar } from "@/components/admin-sidebar";
import { TokenForm } from "@/components/token-form";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, Key } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminTokensPage() {
  const users = await getUsers();

  return (
    <div className="flex min-h-screen bg-neutral-950 text-white">
      <AdminSidebar />
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-4xl mx-auto space-y-8">
          <header className="border-b border-white/10 pb-6">
            <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-rose-400 to-orange-400 text-transparent bg-clip-text inline-block font-heading">
              Access Tokens
            </h1>
            <p className="text-neutral-400 mt-2 text-sm">Issue and revoke user access keys.</p>
          </header>

          <section className="space-y-6">
            <h2 className="text-xl font-semibold flex items-center gap-2 text-white font-heading">
              <Key className="w-5 h-5 text-rose-500" />
              Issue New Key
            </h2>

            <Card className="bg-neutral-900 border-white/10 rounded-2xl overflow-hidden shadow-xl">
              <TokenForm />

              <CardContent className="p-0 overflow-x-auto">
                <Table className="w-full text-left">
                  <TableHeader>
                    <TableRow className="border-b border-white/5 bg-white/5 text-neutral-400 text-sm uppercase tracking-wider hover:bg-transparent">
                      <TableHead className="px-6 py-4">User</TableHead>
                      <TableHead className="px-6 py-4">Token (hashed)</TableHead>
                      <TableHead className="px-6 py-4">Expires</TableHead>
                      <TableHead className="px-6 py-4">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y divide-white/5">
                    {users.map((user) => {
                      // Bind the id into the server action — no inline "use server" needed
                      const deleteAction = deleteUser.bind(null, user.id);
                      return (
                        <TableRow key={user.id} className="hover:bg-white/5 transition-colors border-white/5">
                          <TableCell className="px-6 py-4 font-medium text-white">
                            {user.username}
                          </TableCell>
                          <TableCell className="px-6 py-4 text-rose-400 font-mono text-xs">
                            {user.token.slice(0, 16)}…
                          </TableCell>
                          <TableCell className="px-6 py-4 text-neutral-400 text-sm">
                            {user.expiresAt.toISOString().split("T")[0]}
                          </TableCell>
                          <TableCell className="px-6 py-4">
                            <form action={deleteAction}>
                              <Button
                                type="submit"
                                variant="ghost"
                                size="icon"
                                className="text-neutral-500 hover:text-red-500 transition-colors p-2"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </form>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </section>
        </div>
      </main>
    </div>
  );
}
