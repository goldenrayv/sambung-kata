import { getAllWordsAdmin, getAllWordCount, addWord, toggleWordStatus } from "@/app/actions";
import { AdminSidebar } from "@/components/admin-sidebar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CheckCircle, XCircle, Plus, Book, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 50;

export default async function AdminWordsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, parseInt(pageParam ?? "1", 10));

  const [words, totalCount] = await Promise.all([
    getAllWordsAdmin(page, PAGE_SIZE),
    getAllWordCount(),
  ]);

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  return (
    <div className="flex min-h-screen bg-neutral-950 text-white">
      <AdminSidebar />
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-4xl mx-auto space-y-8">
          <header className="border-b border-white/10 pb-6">
            <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-rose-400 to-orange-400 text-transparent bg-clip-text inline-block font-heading">
              Word Repository
            </h1>
            <p className="text-neutral-400 mt-2 text-sm">
              {totalCount.toLocaleString()} total words &mdash; page {page} of {totalPages}
            </p>
          </header>

          <section className="space-y-6">
            <h2 className="text-xl font-semibold flex items-center gap-2 text-white font-heading">
              <Book className="w-5 h-5 text-orange-500" />
              Manage Words
            </h2>

            <Card className="bg-neutral-900 border-white/10 rounded-2xl overflow-hidden shadow-xl">
              {/* Add word form — action= references the server action directly, no inline "use server" */}
              <CardHeader className="p-0">
                <form
                  action={addWord}
                  className="p-6 bg-white/5 border-b border-white/10 flex gap-4"
                >
                  <Input
                    name="word"
                    placeholder="New Indonesian Word"
                    className="bg-neutral-800 border-white/10 rounded-lg focus:ring-orange-500 outline-none flex-1"
                    required
                  />
                  <Button className="bg-orange-600 hover:bg-orange-500 text-white font-medium px-6 py-2 rounded-lg transition-colors flex items-center gap-2 h-10">
                    <Plus className="w-4 h-4" />
                    Add
                  </Button>
                </form>
              </CardHeader>

              <CardContent className="p-0">
                <Table className="w-full text-left">
                  <TableHeader className="sticky top-0 z-10 bg-neutral-900">
                    <TableRow className="border-b border-white/5 bg-white/5 text-neutral-400 text-sm uppercase tracking-wider hover:bg-transparent">
                      <TableHead className="px-6 py-4">Word</TableHead>
                      <TableHead className="px-6 py-4">Status</TableHead>
                      <TableHead className="px-6 py-4">Toggle</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y divide-white/5">
                    {words.map((word) => {
                      // Bind args into the server action — no inline "use server" needed
                      const toggleAction = toggleWordStatus.bind(null, word.id, word.isActive);
                      return (
                        <TableRow
                          key={word.id}
                          className="hover:bg-white/5 transition-colors border-white/5"
                        >
                          <TableCell className="px-6 py-4 font-medium tracking-wide text-white">
                            {word.word}
                          </TableCell>
                          <TableCell className="px-6 py-4">
                            {word.isActive ? (
                              <Badge
                                variant="outline"
                                className="flex items-center gap-1.5 text-green-400 text-xs font-semibold px-2 py-0.5 rounded-full bg-green-400/10 border-green-400/20"
                              >
                                <CheckCircle className="w-3 h-3" />
                                Active
                              </Badge>
                            ) : (
                              <Badge
                                variant="outline"
                                className="flex items-center gap-1.5 text-neutral-500 text-xs font-semibold px-2 py-0.5 rounded-full bg-white/5 border-white/10"
                              >
                                <XCircle className="w-3 h-3" />
                                Hidden
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="px-6 py-4">
                            <form action={toggleAction}>
                              <Button
                                type="submit"
                                variant="ghost"
                                size="sm"
                                className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all h-auto ${
                                  word.isActive
                                    ? "text-red-400 hover:bg-red-400/10"
                                    : "text-green-400 hover:bg-green-400/10"
                                }`}
                              >
                                {word.isActive ? "Deactivate" : "Activate"}
                              </Button>
                            </form>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>

                {/* Pagination controls */}
                <div className="flex items-center justify-between p-4 bg-white/5 border-t border-white/10">
                  <span className="text-xs text-neutral-500">
                    Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, totalCount)} of{" "}
                    {totalCount.toLocaleString()}
                  </span>
                  <div className="flex gap-2">
                    {page > 1 ? (
                      <Link href={`/admin/words?page=${page - 1}`}>
                        <Button variant="ghost" size="sm" className="h-8 text-neutral-400 hover:text-white">
                          <ChevronLeft className="w-4 h-4 mr-1" />
                          Prev
                        </Button>
                      </Link>
                    ) : (
                      <Button variant="ghost" size="sm" disabled className="h-8 text-neutral-700">
                        <ChevronLeft className="w-4 h-4 mr-1" />
                        Prev
                      </Button>
                    )}
                    {page < totalPages ? (
                      <Link href={`/admin/words?page=${page + 1}`}>
                        <Button variant="ghost" size="sm" className="h-8 text-neutral-400 hover:text-white">
                          Next
                          <ChevronRight className="w-4 h-4 ml-1" />
                        </Button>
                      </Link>
                    ) : (
                      <Button variant="ghost" size="sm" disabled className="h-8 text-neutral-700">
                        Next
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>
        </div>
      </main>
    </div>
  );
}
