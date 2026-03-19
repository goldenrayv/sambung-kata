import { getAllWordsAdmin, getAllWordCountAdmin, toggleWordStatus } from "@/app/actions";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  CheckCircle, 
  XCircle, 
  BookOpen, 
  ChevronLeft, 
  ChevronRight,
  Database,
  Search,
  Zap
} from "lucide-react";
import Link from "next/link";
import AdminWordManager from "./AdminWordManager";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 50;

export default async function AdminWordsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string }>;
}) {
  const { page: pageParam, q: search } = await searchParams;
  const page = Math.max(1, parseInt(pageParam ?? "1", 10));

  let words: any[] = [];
  let totalCount = 0;
  let error: string | null = null;

  try {
    const [fetchedWords, count] = await Promise.all([
      getAllWordsAdmin(page, PAGE_SIZE, search),
      getAllWordCountAdmin(search),
    ]);
    words = fetchedWords;
    totalCount = count;
  } catch (e: any) {
    error = e.message || "Unknown database error";
    console.error("Prisma Error:", e);
  }

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  return (
    <div className="space-y-10 max-w-7xl mx-auto pb-12">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-white/5">
        <div className="space-y-1">
          <h1 className="text-5xl font-black tracking-tight bg-gradient-to-br from-white via-white to-white/40 text-transparent bg-clip-text font-heading">
            Word Repository
          </h1>
          <p className="text-white/40 text-sm font-medium tracking-wide uppercase">
            {totalCount.toLocaleString()} {search ? `matches for "${search}"` : "total words indexed"}
          </p>
        </div>
        <div className="flex items-center gap-3 text-white/40 text-xs font-mono bg-white/5 px-4 py-2 rounded-full border border-white/5">
          <Database className="w-3.5 h-3.5 text-orange-500" />
          <span>Syncing with Global Dictionary</span>
        </div>
      </header>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 p-6 rounded-2xl text-red-400 text-sm font-mono flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center shrink-0">
             <XCircle className="w-5 h-5" />
          </div>
          <div>
            <strong className="block text-base mb-1">Database Sync Error</strong>
            <p className="opacity-80 leading-relaxed">{error}</p>
          </div>
        </div>
      )}

      <section className="space-y-8">
        <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center border border-orange-500/20 shadow-[0_0_20px_rgba(249,115,22,0.1)]">
                <BookOpen className="w-5 h-5 text-orange-500" />
            </div>
            <h2 className="text-2xl font-bold text-white font-heading tracking-tight">
              Inventory Controls
            </h2>
        </div>

        <Card className="bg-neutral-900/40 border-white/5 rounded-3xl overflow-hidden shadow-2xl backdrop-blur-sm">
          <AdminWordManager />

          <CardContent className="p-0 overflow-x-auto">
            <Table className="w-full">
              <TableHeader>
                <TableRow className="border-b border-white/5 bg-white/[0.01] hover:bg-transparent">
                  <TableHead className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-white/30 w-[60%]">Term / Notation</TableHead>
                  <TableHead className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-white/30">Lifecycle Status</TableHead>
                  <TableHead className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-white/30 text-right">Operation</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {words.length > 0 ? (
                  words.map((word) => {
                    const toggleAction = toggleWordStatus.bind(null, word.id, word.isActive);
                    return (
                      <TableRow
                        key={word.id}
                        className="group hover:bg-white/[0.02] transition-all border-white/5"
                      >
                        <TableCell className="px-8 py-6">
                           <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/5 group-hover:border-orange-500/20 group-hover:bg-orange-500/5 transition-all">
                                    <span className="text-white/40 font-bold uppercase text-[10px]">{word.word.slice(0, 1)}</span>
                                </div>
                                <span className="text-lg font-black tracking-widest text-white uppercase font-mono">
                                    {word.word}
                                </span>
                           </div>
                        </TableCell>
                        <TableCell className="px-8 py-6">
                          {word.isActive ? (
                            <Badge
                              variant="outline"
                              className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 rounded-lg px-2.5 py-1 text-[10px] font-bold uppercase tracking-tighter"
                            >
                              <CheckCircle className="w-3 h-3 mr-1.5" />
                              Active Entry
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="bg-white/5 text-white/40 border-white/10 rounded-lg px-2.5 py-1 text-[10px] font-bold uppercase tracking-tighter"
                            >
                              <XCircle className="w-3 h-3 mr-1.5" />
                              Standby Mode
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="px-8 py-6 text-right">
                          <form action={toggleAction}>
                            <Button
                              type="submit"
                              variant="ghost"
                              size="sm"
                              className={cn(
                                "h-9 px-4 rounded-xl font-bold text-[10px] uppercase tracking-wider transition-all border border-transparent",
                                word.isActive
                                ? "text-red-400 hover:bg-red-500/10 hover:border-red-500/20"
                                : "text-emerald-400 hover:bg-emerald-500/10 hover:border-emerald-500/20"
                              )}
                            >
                              <Zap className="w-3 h-3 mr-1.5" />
                              {word.isActive ? "Deactivate" : "Activate"}
                            </Button>
                          </form>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} className="px-8 py-32 text-center text-white/40">
                        <div className="flex flex-col items-center gap-3 opacity-20">
                            <Search className="w-12 h-12" />
                            <span className="italic font-mono text-sm tracking-widest uppercase">Null Results In Repository</span>
                        </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>

            <div className="flex items-center justify-between px-8 py-6 bg-white/[0.02] border-t border-white/5">
              <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-white/40 leading-none">Record Domain</span>
                  <div className="h-4 w-[1px] bg-white/10" />
                  <span className="text-xs font-mono font-bold text-white leading-none">
                    {totalCount === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, totalCount)}
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-white/20 leading-none">of</span>
                  <span className="text-xs font-mono font-bold text-orange-500 leading-none">
                    {totalCount.toLocaleString()}
                  </span>
              </div>
              
              <div className="flex gap-2">
                <Link 
                    href={page > 1 ? `/admin/words?page=${page - 1}${search ? `&q=${search}` : ""}` : "#"}
                    className={cn(page <= 1 && "pointer-events-none opacity-20")}
                >
                    <Button variant="ghost" size="icon" className="h-10 w-10 text-white hover:bg-white/10 rounded-xl border border-white/5">
                      <ChevronLeft className="w-5 h-5" />
                    </Button>
                </Link>
                
                <div className="flex items-center px-4 bg-white/5 rounded-xl border border-white/5 text-[10px] font-black font-mono">
                    <span className="text-white">{page}</span>
                    <span className="mx-2 text-white/20">/</span>
                    <span className="text-white/40">{totalPages}</span>
                </div>

                <Link 
                    href={page < totalPages ? `/admin/words?page=${page + 1}${search ? `&q=${search}` : ""}` : "#"}
                    className={cn(page >= totalPages && "pointer-events-none opacity-20")}
                >
                    <Button variant="ghost" size="icon" className="h-10 w-10 text-white hover:bg-white/10 rounded-xl border border-white/5">
                      <ChevronRight className="w-5 h-5" />
                    </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

