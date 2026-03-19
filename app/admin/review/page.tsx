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
    <div className="space-y-8 max-w-[1400px] mx-auto pb-8">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-white/5">
        <div className="space-y-1">
          <h1 className="text-3xl font-black tracking-tight bg-gradient-to-br from-white via-white to-white/40 text-transparent bg-clip-text font-heading">
            Quality Control
          </h1>
          <p className="text-white/60 text-[10px] font-black tracking-widest uppercase italic">
            {totalCount.toLocaleString()} Pending Verification Segments
          </p>
        </div>
        <div className="flex items-center gap-3 text-white/70 text-xs font-mono bg-white/5 px-4 py-2 rounded-full border border-white/5">
          <ShieldCheck className="w-3.5 h-3.5 text-rose-500" />
          <span className="font-black tracking-tight italic opacity-80">Restricted Protocol Engagement</span>
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

      <section className="space-y-6">
        <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-rose-500/10 flex items-center justify-center border border-rose-500/20 shadow-[0_0_20px_rgba(244,63,94,0.1)]">
                <ClipboardCheck className="w-4 h-4 text-rose-500" />
            </div>
            <h2 className="text-lg font-bold text-white font-heading tracking-tight uppercase">
              Review Queue
            </h2>
        </div>

        <Card className="bg-neutral-950 border-white/5 rounded-2xl overflow-hidden shadow-2xl backdrop-blur-sm">
          <AdminReviewManager />

          <CardContent className="p-0 overflow-x-auto">
            <Table className="w-full">
              <TableHeader>
                <TableRow className="border-b border-white/5 bg-white/[0.01] hover:bg-transparent">
                  <TableHead className="px-6 py-4 text-[9px] font-black uppercase tracking-[0.2em] text-white/50 w-[60%] font-mono">Candidate Segment</TableHead>
                  <TableHead className="px-6 py-4 text-[9px] font-black uppercase tracking-[0.2em] text-white/50">Status</TableHead>
                  <TableHead className="px-6 py-4 text-[9px] font-black uppercase tracking-[0.2em] text-white/50 text-right">Moderation</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reviews.length > 0 ? (
                  reviews.map((review) => {
                    
                    return (
                      <TableRow
                        key={review.id}
                        className="group hover:bg-white/[0.01] transition-all border-white/5"
                      >
                        <TableCell className="px-6 py-3">
                           <div className="flex items-center gap-3">
                                <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center border border-white/5 group-hover:border-rose-500/20 group-hover:bg-rose-500/5 transition-all">
                                    <span className="text-white/40 font-bold uppercase text-[9px]">{review.word.slice(0, 1)}</span>
                                </div>
                                <span className="text-xs font-black tracking-widest text-white uppercase font-mono">
                                    {review.word}
                                </span>
                           </div>
                        </TableCell>
                        <TableCell className="px-6 py-3">
                            <Badge
                              variant="outline"
                              className="bg-white/10 text-white/70 border-white/10 rounded-md px-1.5 py-0 text-[10px] font-black uppercase tracking-tighter leading-none h-4"
                            >
                              Verification
                            </Badge>
                        </TableCell>
                        <TableCell className="px-6 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                             <form action={async () => {
                                "use server";
                                await processWordReview(review.id, 'accept');
                             }}>
                                <Button
                                  type="submit"
                                  variant="ghost"
                                  className="h-7 w-7 p-0 rounded-lg text-emerald-400/60 hover:text-emerald-400 hover:bg-emerald-500/10"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                </Button>
                             </form>
                             <form action={async () => {
                                "use server";
                                await processWordReview(review.id, 'reject');
                             }}>
                                <Button
                                  type="submit"
                                  variant="ghost"
                                  className="h-7 w-7 p-0 rounded-lg text-red-400/60 hover:text-red-400 hover:bg-red-500/10"
                                >
                                  <X className="w-3.5 h-3.5" />
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

            <div className="flex items-center justify-between px-6 py-4 bg-white/[0.01] border-t border-white/5">
              <div className="flex items-center gap-2">
                  <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/40 leading-none">Record Domain</span>
                  <div className="h-3 w-[1px] bg-white/10" />
                  <span className="text-[11px] font-mono font-black text-white/80 leading-none">
                    {totalCount === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, totalCount)}
                  </span>
                  <span className="text-[9px] font-black uppercase tracking-widest text-white/30 leading-none px-1">of</span>
                  <span className="text-[11px] font-mono font-black text-rose-500 leading-none">
                    {totalCount.toLocaleString()}
                  </span>
              </div>
              
              <div className="flex gap-1.5">
                <Link 
                    href={page > 1 ? `/admin/review?page=${page - 1}` : "#"}
                    className={cn(page <= 1 && "pointer-events-none opacity-10")}
                >
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-white hover:bg-white/5 rounded-lg border border-white/5">
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </Button>
                </Link>
                
                <div className="flex items-center px-3 bg-white/5 rounded-lg border border-white/5 text-[9px] font-black font-mono">
                    <span className="text-white">{page}</span>
                    <span className="mx-1.5 text-white/30">/</span>
                    <span className="text-white/60">{totalPages}</span>
                </div>

                <Link 
                    href={page < totalPages ? `/admin/review?page=${page + 1}` : "#"}
                    className={cn(page >= totalPages && "pointer-events-none opacity-10")}
                >
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-white hover:bg-white/5 rounded-lg border border-white/5">
                      <ChevronRight className="w-3.5 h-3.5" />
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
