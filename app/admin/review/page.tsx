import { getWordReviews, getWordReviewCount, processWordReview } from "@/app/actions";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  CheckCircle, 
  XCircle, 
  ClipboardCheck, 
  ChevronLeft, 
  ChevronRight,
  ShieldCheck,
  Search,
  Check,
  X
} from "lucide-react";
import Link from "next/link";
import AdminReviewManager from "./AdminReviewManager";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 50;

export default async function AdminReviewPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, parseInt(pageParam ?? "1", 10));

  let reviews: any[] = [];
  let totalCount = 0;
  let error: string | null = null;

  try {
    const [fetchedReviews, count] = await Promise.all([
      getWordReviews(page, PAGE_SIZE),
      getWordReviewCount(),
    ]);
    reviews = fetchedReviews;
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
            Quality Control
          </h1>
          <p className="text-white/40 text-sm font-medium tracking-wide uppercase">
            {totalCount.toLocaleString()} words awaiting system verification
          </p>
        </div>
        <div className="flex items-center gap-3 text-white/40 text-xs font-mono bg-white/5 px-4 py-2 rounded-full border border-white/5">
          <ShieldCheck className="w-3.5 h-3.5 text-rose-500" />
          <span>Restricted Protocol Engagement</span>
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
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center border border-rose-500/20 shadow-[0_0_20px_rgba(244,63,94,0.1)]">
                <ClipboardCheck className="w-5 h-5 text-rose-500" />
            </div>
            <h2 className="text-2xl font-bold text-white font-heading tracking-tight">
              Review Queue
            </h2>
        </div>

        <Card className="bg-neutral-900/40 border-white/5 rounded-3xl overflow-hidden shadow-2xl backdrop-blur-sm">
          <AdminReviewManager />

          <CardContent className="p-0 overflow-x-auto">
            <Table className="w-full">
              <TableHeader>
                <TableRow className="border-b border-white/5 bg-white/[0.01] hover:bg-transparent">
                  <TableHead className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-white/30 w-[60%]">Term Candidate</TableHead>
                  <TableHead className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-white/30">Current Status</TableHead>
                  <TableHead className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-white/30 text-right">Review Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reviews.length > 0 ? (
                  reviews.map((review) => {
                    
                    return (
                      <TableRow
                        key={review.id}
                        className="group hover:bg-white/[0.02] transition-all border-white/5"
                      >
                        <TableCell className="px-8 py-4">
                           <div className="flex items-center gap-4">
                                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center border border-white/5 group-hover:border-rose-500/20 group-hover:bg-rose-500/5 transition-all">
                                    <span className="text-white/40 font-bold uppercase text-[9px]">{review.word.slice(0, 1)}</span>
                                </div>
                                <span className="text-sm font-bold tracking-widest text-white uppercase font-mono">
                                    {review.word}
                                </span>
                           </div>
                        </TableCell>
                        <TableCell className="px-8 py-4">
                            <Badge
                              variant="outline"
                              className="bg-neutral-800 text-white/60 border-white/10 rounded-lg px-2 py-0.5 text-[9px] font-bold uppercase tracking-tighter"
                            >
                              Verification Required
                            </Badge>
                        </TableCell>
                        <TableCell className="px-8 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                             <form action={async () => {
                                "use server";
                                await processWordReview(review.id, 'accept');
                             }}>
                                <Button
                                  type="submit"
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 px-3 rounded-lg font-bold text-[9px] uppercase tracking-wider transition-all text-emerald-400/60 hover:text-emerald-400 hover:bg-emerald-500/10 border border-transparent hover:border-emerald-500/20"
                                >
                                  <Check className="w-3 h-3 mr-1.5" />
                                  Accept
                                </Button>
                             </form>
                             <form action={async () => {
                                "use server";
                                await processWordReview(review.id, 'reject');
                             }}>
                                <Button
                                  type="submit"
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 px-3 rounded-lg font-bold text-[9px] uppercase tracking-wider transition-all text-red-400/60 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20"
                                >
                                  <X className="w-3 h-3 mr-1.5" />
                                  Reject
                                </Button>
                             </form>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} className="px-8 py-32 text-center text-white/40">
                        <div className="flex flex-col items-center gap-3 opacity-20">
                            <Search className="w-12 h-12" />
                            <span className="italic font-mono text-sm tracking-widest uppercase">Null Queue / Ready for Intake</span>
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
                  <span className="text-xs font-mono font-bold text-rose-500 leading-none">
                    {totalCount.toLocaleString()}
                  </span>
              </div>
              
              <div className="flex gap-2">
                <Link 
                    href={page > 1 ? `/admin/review?page=${page - 1}` : "#"}
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
                    href={page < totalPages ? `/admin/review?page=${page + 1}` : "#"}
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
