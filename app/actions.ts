"use server";

import crypto from "crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma as prismaInstance } from "@/lib/prisma";
const prisma = prismaInstance as any;
import { revalidatePath } from "next/cache";



// ---------------------------------------------------------------------------
// Words — public
// ---------------------------------------------------------------------------
export async function getWordCount(): Promise<number> {
  return prisma.word.count({ 
    where: { 
      isActive: true,
      isVerified: { not: "rejected" }
    } 
  });
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
    revalidatePath("/");
  } catch {
    // Word already exists or invalid — silently ignored at the form level.
  }
}

export async function getAllWordsAdmin(page: number = 1, pageSize: number = 50, search?: string) {
  return prisma.word.findMany({
    where: {
      isVerified: { not: "rejected" },
      ...(search ? {
        word: {
          contains: search,
          mode: 'insensitive'
        }
      } : {})
    },
    orderBy: { word: "asc" },
    skip: (page - 1) * pageSize,
    take: pageSize,
  });
}

export async function getAllWordCountAdmin(search?: string): Promise<number> {
  return prisma.word.count({
    where: {
      isVerified: { not: "rejected" },
      ...(search ? {
        word: {
          contains: search,
          mode: 'insensitive'
        }
      } : {})
    }
  });
}

export async function checkNewWords(words: string[]) {
  const uniqueWords = Array.from(new Set(words.map(w => w.toUpperCase().trim()).filter(Boolean)));
  
  const existing = await prisma.word.findMany({
    where: { word: { in: uniqueWords } },
    select: { word: true }
  });
  
  const existingSet = new Set(existing.map((e: any) => e.word.toUpperCase()));
  
  const newWords = uniqueWords.filter((w: any) => !existingSet.has(w));
  const existingWords = uniqueWords.filter((w: any) => existingSet.has(w));
  
  return { newWords, existingWords };
}

export async function insertBulkWords(words: string[]) {
  if (words.length === 0) return { success: true };
  
  try {
    const uppercaseWords = Array.from(new Set(words.map(word => word.toUpperCase().trim()).filter(Boolean)));
    
    // Batch processing to avoid payload limits/timeouts in production
    const BATCH_SIZE = 1000;
    for (let i = 0; i < uppercaseWords.length; i += BATCH_SIZE) {
      const batch = uppercaseWords.slice(i, i + BATCH_SIZE);
      await prisma.word.createMany({
        data: batch.map(word => ({ 
          word,
          updatedAt: new Date()
        })),
        skipDuplicates: true,
      });
      console.log(`Inserted batch ${Math.floor(i / BATCH_SIZE) + 1} of ${Math.ceil(uppercaseWords.length / BATCH_SIZE)}`);
    }
    
    revalidatePath("/admin/words");
    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    console.error("Bulk insert failed:", error);
    return { 
      success: false, 
      error: error.message || "Failed to insert words. Please check logs." 
    };
  }
}

export async function toggleWordStatus(id: string, currentlyActive: boolean) {
  await prisma.word.update({
    where: { id },
    data: { isActive: !currentlyActive },
  });
  revalidatePath("/admin/words");
}

export async function deleteWord(id: string) {
  try {
    // Soft delete: turn isVerified to rejected
    await prisma.word.update({
      where: { id },
      data: { isVerified: "rejected" }
    });
    revalidatePath("/admin/words");
    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    console.error("Delete failed:", error);
    return { success: false, error: error.message || "Failed to delete word" };
  }
}

export async function toggleWordVerification(id: string, currentStatus: string) {
  const newStatus = currentStatus === "verified" ? "unverified" : "verified";
  await prisma.word.update({
    where: { id },
    data: { isVerified: newStatus },
  });
  revalidatePath("/admin/words");
  revalidatePath("/");
  return { success: true };
}

// ---------------------------------------------------------------------------
// Word Curation — admin
// ---------------------------------------------------------------------------

export async function getAdminWordStats() {
  const [verified, unverified, rejected] = await Promise.all([
    prisma.word.count({ where: { isVerified: "verified" } }),
    prisma.word.count({ where: { isVerified: "unverified" } }),
    prisma.word.count({ where: { isVerified: "rejected" } }),
  ]);
  
  return { verified, unverified, rejected };
}

export async function bulkVerifyWords(words: string[]) {
  if (words.length === 0) return { success: true, count: 0 };
  
  try {
    const cleanWords = Array.from(new Set(words.map(w => w.toLowerCase().trim()).filter(Boolean)));
    
    const result = await prisma.word.updateMany({
      where: {
        word: { in: cleanWords }
      },
      data: {
        isVerified: "verified"
      }
    });
    
    revalidatePath("/admin/words");
    revalidatePath("/admin");
    revalidatePath("/");
    return { success: true, count: result.count };
  } catch (error: any) {
    console.error("Bulk verification failed:", error);
    return { success: false, error: error.message };
  }
}

// ---------------------------------------------------------------------------
// Tactical Suffixes — admin
// ---------------------------------------------------------------------------

export async function getTacticalSuffixes() {
  try {
    // Use raw query to bypass missing client model during dev server lock
    const suffixes = await prisma.$queryRawUnsafe('SELECT * FROM "TacticalSuffix"');
    
    // Sort by length DESC, then alphabetical ASC (e.g., AX, EX, OX, X)
    return (suffixes as any[]).sort((a: any, b: any) => {
      if (a.suffix.length !== b.suffix.length) {
        return b.suffix.length - a.suffix.length;
      }
      return a.suffix.localeCompare(b.suffix);
    });
  } catch (error) {
    console.error("Failed to fetch tactical suffixes:", error);
    return [];
  }
}

export async function addTacticalSuffix(suffix: string) {
  const cleanSuffix = suffix.toUpperCase().trim();
  if (!cleanSuffix) return { success: false, error: "Suffix cannot be empty" };
  
  try {
    // Use raw execute to avoid missing model error
    await prisma.$executeRawUnsafe(
      'INSERT INTO "TacticalSuffix" (id, suffix, tier, "updatedAt") VALUES ($1, $2, $3, NOW())',
      crypto.randomUUID(),
      cleanSuffix,
      1
    );
    revalidatePath("/admin/tactical");
    revalidatePath("/admin/words");
    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    console.error("Add suffix failed:", error);
    return { success: false, error: "Suffix already exists or database error" };
  }
}

export async function deleteTacticalSuffix(id: string) {
  try {
    await prisma.$executeRawUnsafe('DELETE FROM "TacticalSuffix" WHERE id = $1', id);
    revalidatePath("/admin/tactical");
    revalidatePath("/admin/words");
    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: "Failed to delete suffix" };
  }
}

// ---------------------------------------------------------------------------
// Users / Credentials — admin
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

export async function extendUserExpiry(id: string, days: number) {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) return { success: false, error: "User not found" };

  const newExpiry = new Date(Math.max(user.expiresAt.getTime(), Date.now()));
  newExpiry.setDate(newExpiry.getDate() + days);

  await prisma.user.update({
    where: { id },
    data: { expiresAt: newExpiry }
  });

  revalidatePath("/admin/users");
  return { success: true };
}

export async function createUser(username: string, password: string, days: number = 30, isSuperUser: boolean = false) {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + days);

  try {
    await prisma.user.create({
      data: { username, password, expiresAt, isSuperUser },
    });
    revalidatePath("/admin/users");
    return { success: true };
  } catch {
    return { success: false, error: "Username already exists." };
  }
}

export async function deleteUser(id: string) {
  await prisma.user.delete({ where: { id } });
  revalidatePath("/admin/users");
}

// ---------------------------------------------------------------------------
// Auth — public
// ---------------------------------------------------------------------------
export async function loginUser(username: string, password: string) {
  const user = await prisma.user.findUnique({
    where: { username },
  });

  if (!user) return { success: false, error: "Invalid username or password" };
  if (user.password !== password) return { success: false, error: "Invalid username or password" };
  if (user.expiresAt < new Date()) return { success: false, error: "Account expired" };

  return { 
    success: true, 
    userId: user.id,
    username: user.username, 
    expiresAt: user.expiresAt,
    isSuperUser: user.isSuperUser,
    mustChangePassword: !user.isFirstTimePasswordChange
  };
}

export async function changePassword(id: string, oldPassword: string, newPassword: string) {
  if (newPassword.length < 6) {
    return { success: false, error: "New password must be at least 6 characters" };
  }

  const user = await prisma.user.findUnique({
    where: { id },
  });

  if (!user || user.password !== oldPassword) {
    return { success: false, error: "Invalid current password" };
  }

  await prisma.user.update({
    where: { id },
    data: { 
      password: newPassword,
      isFirstTimePasswordChange: true
    }
  });

  return { success: true };
}


// ---------------------------------------------------------------------------
// Admin session management
// ---------------------------------------------------------------------------
export async function adminLogout() {
  const cookieStore = await cookies();
  cookieStore.delete("admin_session");
  redirect("/admin-login");
}

// ---------------------------------------------------------------------------
// Export — admin
// ---------------------------------------------------------------------------
export async function exportAllData() {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      username: true,
      isSuperUser: true,
      expiresAt: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' }
  });

  const words = await prisma.word.findMany({
    select: {
      id: true,
      word: true,
      isVerified: true,
      isActive: true,
      createdAt: true,
    },
    orderBy: { word: 'asc' }
  });
  const tacticalSuffixes = await prisma.tacticalSuffix.findMany({
    orderBy: { suffix: 'asc' }
  });

  return { 
    users: users.map((u: any) => ({ ...u, expiresAt: u.expiresAt.toISOString(), createdAt: u.createdAt.toISOString() })), 
    words: words.map((w: any) => ({ ...w, createdAt: w.createdAt.toISOString() })), 
    tacticalSuffixes: tacticalSuffixes.map((s: any) => ({ ...s, createdAt: s.createdAt.toISOString() })),
  };
}
