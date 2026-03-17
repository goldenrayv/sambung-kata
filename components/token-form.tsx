"use client";

import { useState } from "react";
import { UserPlus, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createToken } from "@/app/actions";

export function TokenForm() {
  const [token, setToken] = useState("");

  /** Use the Web Crypto API — cryptographically secure, unlike Math.random() */
  const generateToken = () => {
    const arr = new Uint8Array(16);
    crypto.getRandomValues(arr);
    const hex = Array.from(arr)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("")
      .toUpperCase();
    setToken("sk_" + hex);
  };

  return (
    <form
      action={async (formData) => {
        const username = formData.get("username") as string;
        const finalToken = formData.get("token") as string;
        await createToken(username, finalToken);
      }}
      className="p-6 bg-white/5 border-b border-white/10 flex flex-col gap-4"
    >
      <div className="flex flex-col sm:flex-row gap-4">
        <Input
          name="username"
          placeholder="Username"
          className="bg-neutral-800 border-white/10 rounded-lg focus:ring-rose-500 outline-none flex-1 h-10 placeholder-white/40"
          required
        />
        <div className="flex-1 flex gap-2">
          <Input
            name="token"
            placeholder="Token Key"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            className="bg-neutral-800 border-white/10 rounded-lg focus:ring-rose-500 outline-none flex-1 h-10 placeholder-white/40"
            required
          />
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={generateToken}
            className="h-10 px-3 bg-neutral-800 border border-white/10 text-white"
            title="Generate secure token"
          >
            <Sparkles className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
      <Button className="w-full bg-rose-600 hover:bg-rose-500 text-white font-semibold h-10 rounded-lg transition-all shadow-lg shadow-rose-900/20">
        <UserPlus className="w-4 h-4 mr-2" />
        Issue New Access Key
      </Button>
    </form>
  );
}
