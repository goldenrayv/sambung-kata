import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ShieldCheck, ArrowRight, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

async function adminLogin(formData: FormData) {
  "use server";
  const secret = (formData.get("secret") as string)?.trim();
  const adminSecret = (process.env.ADMIN_SECRET || "").trim();

  if (secret && secret === adminSecret) {
    const cookieStore = await cookies();
    cookieStore.set("admin_session", secret, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 8, // 8 hours
      path: "/",
    });
    redirect("/admin/tokens");
  }

  redirect("/admin-login?error=1");
}

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main className="min-h-screen bg-neutral-950 text-white flex flex-col items-center justify-center p-6 bg-[radial-gradient(circle_at_top_left,rgba(244,63,94,0.1),transparent_40%)]">
      <div className="w-full max-w-md space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">

        <div className="text-center space-y-4">
          <div className="inline-flex p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 mb-2">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight font-heading">Admin Portal</h1>
          <p className="text-neutral-400">Enter the admin secret to access the dashboard.</p>
        </div>

        <Card className="bg-neutral-900/50 backdrop-blur-xl border-white/10 shadow-2xl rounded-3xl overflow-hidden">
          <CardContent className="p-8 space-y-6">
            <form action={adminLogin} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-neutral-400 ml-1">Admin Secret</label>
                <div className="relative group">
                  <Input
                    name="secret"
                    type="password"
                    placeholder="••••••••••••"
                    autoFocus
                    className="w-full bg-neutral-800 border-white/10 rounded-xl px-4 py-8 text-white placeholder-neutral-600 focus:ring-2 focus:ring-rose-500 outline-none transition-all pr-14 text-lg"
                    required
                  />
                  <Button
                    type="submit"
                    size="icon"
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-rose-600 hover:bg-rose-500 transition-colors shadow-lg rounded-lg h-12 w-12"
                  >
                    <ArrowRight className="w-5 h-5" />
                  </Button>
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 text-red-400 text-sm bg-red-400/5 border border-red-400/20 p-3 rounded-xl animate-in shake duration-300">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>Incorrect secret. Please try again.</span>
                </div>
              )}
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
