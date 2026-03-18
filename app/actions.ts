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
  const word = (formData.get("word") as string)?.toUpperCase().trim();
  if (!word) return;

  try {
    await prisma.word.create({ data: { word } });
    revalidatePath("/admin/words");
  } catch {
    // Word already exists or invalid — silently ignored at the form level.
  }
}

export async function getAllWordsAdmin(page: number = 1, pageSize: number = 50, search?: string) {
  return prisma.word.findMany({
    where: search ? {
      word: {
        contains: search,
        mode: 'insensitive'
      }
    } : {},
    orderBy: { word: "asc" },
    skip: (page - 1) * pageSize,
    take: pageSize,
  });
}

export async function getAllWordCountAdmin(search?: string): Promise<number> {
  return prisma.word.count({
    where: search ? {
      word: {
        contains: search,
        mode: 'insensitive'
      }
    } : {}
  });
}

export async function checkNewWords(words: string[]) {
  const uniqueWords = Array.from(new Set(words.map(w => w.toUpperCase().trim()).filter(Boolean)));
  
  const existing = await prisma.word.findMany({
    where: { word: { in: uniqueWords } },
    select: { word: true }
  });
  
  const existingSet = new Set(existing.map(e => e.word.toUpperCase()));
  
  const newWords = uniqueWords.filter(w => !existingSet.has(w));
  const existingWords = uniqueWords.filter(w => existingSet.has(w));
  
  return { newWords, existingWords };
}

export async function insertBulkWords(words: string[]) {
  if (words.length === 0) return { success: true };
  
  await prisma.word.createMany({
    data: words.map(word => ({ word: word.toUpperCase() })),
    skipDuplicates: true,
  });
  
  revalidatePath("/admin/words");
  return { success: true };
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
export async function getUsers(search?: string) {
  return prisma.user.findMany({
    where: search ? {
      username: {
        contains: search,
        mode: 'insensitive'
      }
    } : {},
    orderBy: { createdAt: "desc" }
  });
}

export async function extendUserToken(id: string, days: number) {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) return { success: false, error: "User not found" };

  const newExpiry = new Date(Math.max(user.expiresAt.getTime(), Date.now()));
  newExpiry.setDate(newExpiry.getDate() + days);

  await prisma.user.update({
    where: { id },
    data: { expiresAt: newExpiry }
  });

  revalidatePath("/admin/tokens");
  return { success: true };
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

  return { valid: true, username: user.username, expiresAt: user.expiresAt };
}

// ---------------------------------------------------------------------------
// Admin session management
// ---------------------------------------------------------------------------
export async function adminLogout() {
  const cookieStore = await cookies();
  cookieStore.delete("admin_session");
  redirect("/admin-login");
}
