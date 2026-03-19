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
    await prisma.word.delete({
      where: { id },
    });
    revalidatePath("/admin/words");
    return { success: true };
  } catch (error: any) {
    console.error("Delete failed:", error);
    return { success: false, error: error.message || "Failed to delete word" };
  }
}

// ---------------------------------------------------------------------------
// Word Review — admin
// ---------------------------------------------------------------------------

export async function getWordReviewCount(): Promise<number> {
  return prisma.wordReview.count({ where: { status: "new" } });
}

export async function getWordReviews(page: number = 1, pageSize: number = 50, search?: string) {
  return prisma.wordReview.findMany({
    where: { 
      status: "new",
      ...(search ? { word: { startsWith: search, mode: 'insensitive' } } : {})
    },
    orderBy: { createdAt: "desc" },
    skip: (page - 1) * pageSize,
    take: pageSize,
  });
}

export async function insertBulkWordReviews(words: string[]) {
  if (words.length === 0) return { success: true };
  
  try {
    const uppercaseWords = Array.from(new Set(words.map(word => word.toUpperCase().trim()).filter(Boolean)));
    
    // Batch processing
    const BATCH_SIZE = 1000;
    for (let i = 0; i < uppercaseWords.length; i += BATCH_SIZE) {
      const batch = uppercaseWords.slice(i, i + BATCH_SIZE);
      await prisma.wordReview.createMany({
        data: batch.map(word => ({ 
          word,
        })),
      });
    }
    
    revalidatePath("/admin/review");
    return { success: true };
  } catch (error: any) {
    console.error("Bulk review insert failed:", error);
    return { 
      success: false, 
      error: error.message || "Failed to insert words for review." 
    };
  }
}

export async function processWordReview(id: string, action: 'accept' | 'reject') {
  try {
    const reviewItem = await prisma.wordReview.findUnique({ where: { id } });
    if (!reviewItem) return { success: false, error: "Review item not found" };

    if (action === 'accept') {
      // Check if word already exists in Word table to avoid unique constraint error
      const existing = await prisma.word.findUnique({ where: { word: reviewItem.word } });
      if (!existing) {
        await prisma.word.create({ data: { word: reviewItem.word } });
      }
      
      await prisma.wordReview.update({
        where: { id },
        data: { status: "accepted" }
      });
    } else {
      await prisma.wordReview.update({
        where: { id },
        data: { status: "rejected" }
      });
    }

    revalidatePath("/admin/review");
    revalidatePath("/admin/words");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
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
      isActive: true,
      createdAt: true,
    },
    orderBy: { word: 'asc' }
  });

  const wordReviews = await prisma.wordReview.findMany({
    select: {
      id: true,
      word: true,
      status: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' }
  });

  return { 
    users: users.map((u: any) => ({ ...u, expiresAt: u.expiresAt.toISOString(), createdAt: u.createdAt.toISOString() })), 
    words: words.map((w: any) => ({ ...w, createdAt: w.createdAt.toISOString() })), 
    reviews: wordReviews.map((r: any) => ({ ...r, createdAt: r.createdAt.toISOString() }))
  };
}
