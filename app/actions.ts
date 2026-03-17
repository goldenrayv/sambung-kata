"use server";

import crypto from "crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// ---------------------------------------------------------------------------
// Shared helper — hash a raw token with SHA-256 so we never store plaintext
// ---------------------------------------------------------------------------
function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

// ---------------------------------------------------------------------------
// Words — public
// ---------------------------------------------------------------------------
export async function getWordCount(): Promise<number> {
  return prisma.word.count({ where: { isActive: true } });
}

// ---------------------------------------------------------------------------
// Words — admin
// ---------------------------------------------------------------------------

/** Accepts FormData directly — usable as form action= with no inline "use server" closure.
 *  Returns void to satisfy Next.js form action type requirements. */
export async function addWord(formData: FormData): Promise<void> {
  const word = (formData.get("word") as string)?.toLowerCase().trim();
  if (!word) return;

  try {
    await prisma.word.create({ data: { word } });
    revalidatePath("/admin/words");
  } catch {
    // Word already exists or invalid — silently ignored at the form level.
  }
}

export async function getAllWordsAdmin(page: number = 1, pageSize: number = 50) {
  return prisma.word.findMany({
    orderBy: { word: "asc" },
    skip: (page - 1) * pageSize,
    take: pageSize,
  });
}

export async function getAllWordCount(): Promise<number> {
  return prisma.word.count();
}

export async function toggleWordStatus(id: string, currentlyActive: boolean) {
  await prisma.word.update({
    where: { id },
    data: { isActive: !currentlyActive },
  });
  revalidatePath("/admin/words");
}

// ---------------------------------------------------------------------------
// Users / Tokens — admin
// ---------------------------------------------------------------------------
export async function getUsers() {
  return prisma.user.findMany({ orderBy: { createdAt: "desc" } });
}

export async function createToken(username: string, token: string, days: number = 30) {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + days);

  try {
    await prisma.user.create({
      data: { username, token: hashToken(token), expiresAt },
    });
    revalidatePath("/admin/tokens");
    return { success: true };
  } catch {
    return { success: false, error: "Username or Token already exists." };
  }
}

export async function deleteUser(id: string) {
  await prisma.user.delete({ where: { id } });
  revalidatePath("/admin/tokens");
}

// ---------------------------------------------------------------------------
// Auth — public
// ---------------------------------------------------------------------------
export async function validateToken(token: string) {
  const user = await prisma.user.findUnique({
    where: { token: hashToken(token) },
  });

  if (!user) return { valid: false, error: "Invalid Access Token" };
  if (user.expiresAt < new Date()) return { valid: false, error: "Token expired" };

  return { valid: true, username: user.username };
}

// ---------------------------------------------------------------------------
// Admin session management
// ---------------------------------------------------------------------------
export async function adminLogout() {
  const cookieStore = await cookies();
  cookieStore.delete("admin_session");
  redirect("/admin-login");
}
