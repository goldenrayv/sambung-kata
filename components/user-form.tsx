"use client";

import { useState } from "react";
import { UserPlus, Copy, CheckCircle2, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createUser } from "@/app/actions";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

export function UserForm() {
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [isSuperUser, setIsSuperUser] = useState(false);
  const [createdUser, setCreatedUser] = useState<{
    username: string;
    password: string;
    expiryDate: string;
    isSuperUser: boolean;
  } | null>(null);

  const generatePassword = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let password = "";
    for (let i = 0; i < 6; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const username = formData.get("username") as string;
    const days = parseInt(formData.get("days") as string) || 30;
    const password = generatePassword();

    const result = await createUser(username, password, days, isSuperUser);

    if (result.success) {
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + days);
      
      setCreatedUser({
        username,
        password,
        isSuperUser: isSuperUser,
        expiryDate: expiryDate.toLocaleDateString('en-GB', { 
          day: '2-digit', 
          month: 'long', 
          year: 'numeric' 
        }),
      });
      setShowModal(true);
      setIsSuperUser(false);
      (e.target as HTMLFormElement).reset();
    } else {
      toast.error(result.error || "Failed to create user");
    }
    setLoading(false);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="p-8 bg-neutral-900/50 border-b border-white/5 flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row gap-4 items-end">
          <div className="flex-1 space-y-2">
            <label className="text-xs font-medium text-white/50 uppercase tracking-wider ml-1">Username</label>
            <Input
              name="username"
              placeholder="e.g. john_doe"
              className="bg-neutral-800/50 border-white/10 rounded-xl focus:ring-rose-500/20 focus:border-rose-500/50 outline-none h-12 placeholder-white/20 text-white transition-all"
              required
            />
          </div>
          <div className="w-full sm:w-[160px] space-y-2">
            <label className="text-xs font-medium text-white/50 uppercase tracking-wider ml-1">Duration</label>
            <Select name="days" defaultValue="30">
              <SelectTrigger className="bg-neutral-800/50 border-white/10 rounded-xl text-white h-12 focus:ring-rose-500/20 focus:border-rose-500/50 outline-none transition-all border">
                <SelectValue placeholder="Expiry" />
              </SelectTrigger>
              <SelectContent className="bg-neutral-900 border-white/10 text-white shadow-2xl">
                <SelectItem value="1">1 Day</SelectItem>
                <SelectItem value="3">3 Days</SelectItem>
                <SelectItem value="7">7 Days</SelectItem>
                <SelectItem value="14">14 Days</SelectItem>
                <SelectItem value="30">30 Days</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2 bg-neutral-800/50 border border-white/10 rounded-xl px-4 h-12 transition-all hover:bg-neutral-800/80">
            <input 
              type="checkbox" 
              id="isSuperUser" 
              checked={isSuperUser}
              onChange={(e) => setIsSuperUser(e.target.checked)}
              className="w-4 h-4 rounded border-white/20 bg-neutral-700 text-rose-500 focus:ring-rose-500/20"
            />
            <label htmlFor="isSuperUser" className="text-xs font-bold text-white/70 uppercase tracking-widest cursor-pointer select-none">
              Super User
            </label>
          </div>
          <Button 
            disabled={loading}
            className="bg-rose-600 hover:bg-rose-500 text-white font-bold h-12 px-8 rounded-xl transition-all shadow-lg shadow-rose-900/20 active:scale-[0.98] disabled:opacity-50"
          >
            <UserPlus className="w-5 h-5 mr-2" />
            {loading ? "Creating..." : "+ add"}
          </Button>
        </div>
      </form>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="bg-neutral-900 border-white/10 text-white max-w-md rounded-3xl p-8 overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5">
             <Shield className="w-32 h-32 text-rose-500" />
          </div>
          
          <DialogHeader className="relative z-10">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/20 flex items-center justify-center mb-4">
              <CheckCircle2 className="w-6 h-6 text-rose-500" />
            </div>
            <DialogTitle className="text-2xl font-bold font-heading">User Created Successfully</DialogTitle>
            <DialogDescription className="text-white/60">
              Please share these credentials with the user. They will be asked to change their password upon first login.
            </DialogDescription>
          </DialogHeader>

          {createdUser && (
            <div className="space-y-4 my-6 relative z-10">
              <div className="space-y-1.5 p-4 rounded-2xl bg-white/5 border border-white/5">
                <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Username</span>
                <div className="flex items-center justify-between group">
                  <span className="text-lg font-mono font-bold text-white tracking-tight">{createdUser.username}</span>
                </div>
              </div>

              <div className="space-y-1.5 p-4 rounded-2xl bg-rose-500/5 border border-rose-500/10">
                <span className="text-[10px] font-bold text-rose-500/60 uppercase tracking-widest">Temporary Password</span>
                <div className="flex items-center justify-between group">
                  <span className="text-lg font-mono font-black text-rose-400 tracking-wider">
                    {createdUser.password}
                  </span>
                </div>
              </div>

              <div className="space-y-1.5 p-4 rounded-2xl bg-white/5 border border-white/5">
                <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Account Type</span>
                <div className="text-sm font-bold text-white tracking-widest uppercase flex items-center gap-2">
                   {createdUser.isSuperUser ? (
                       <>
                           <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                           <span className="text-rose-400">System Superuser</span>
                       </>
                   ) : (
                       <span className="text-white/60">Standard Account</span>
                   )}
                </div>
              </div>

              <div className="space-y-1.5 p-4 rounded-2xl bg-white/5 border border-white/5">
                <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Expires On</span>
                <div className="text-sm font-medium text-white/80">{createdUser.expiryDate}</div>
              </div>
            </div>
          )}

          <DialogFooter className="relative z-10">
            <div className="flex flex-col gap-3 w-full relative z-10">
              <Button 
                  onClick={() => {
                    const text = `Username: ${createdUser?.username}\nPassword: ${createdUser?.password}\nAccount Type: ${createdUser?.isSuperUser ? "Superuser" : "Standard"}\nExpires On: ${createdUser?.expiryDate}`;
                    copyToClipboard(text);
                  }}
                  className="w-full bg-rose-600 hover:bg-rose-500 text-white h-12 rounded-2xl font-bold transition-all flex items-center justify-center gap-2"
              >
                <Copy className="w-4 h-4" />
                Copy All Credentials
              </Button>
              <Button 
                  onClick={() => setShowModal(false)}
                  variant="ghost"
                  className="w-full text-white/40 hover:text-white hover:bg-white/5 h-10 rounded-xl font-bold transition-all"
              >
                Done & Close
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
