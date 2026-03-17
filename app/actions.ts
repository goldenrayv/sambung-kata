"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// Words Management
export async function getActiveWords() {
  return await prisma.word.findMany({
    where: { isActive: true },
    select: { word: true },
  }).then(rows => rows.map(r => r.word));
}

export async function getAllWordsAdmin() {
  return await prisma.word.findMany({
    orderBy: { word: 'asc' },
    take: 500, // Limit for admin view initially
  });
}

export async function toggleWordStatus(id: string, currentlyActive: boolean) {
  await prisma.word.update({
    where: { id },
    data: { isActive: !currentlyActive },
  });
  revalidatePath("/admin");
}

export async function addWord(word: string) {
  try {
    await prisma.word.create({
      data: { word: word.toLowerCase().trim() },
    });
    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Word already exists or invalid." };
  }
}

// User/Token Management
export async function getUsers() {
  return await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
  });
}

export async function createToken(username: string, token: string, days: number = 30) {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + days);

  try {
    await prisma.user.create({
      data: {
        username,
        token,
        expiresAt,
      },
    });
    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Username or Token already exists." };
  }
}

export async function deleteUser(id: string) {
  await prisma.user.delete({ where: { id } });
  revalidatePath("/admin");
}

export async function validateToken(token: string) {
  const user = await prisma.user.findUnique({
    where: { token },
  });

  if (!user) return { valid: false };
  
  // Check expiry
  if (user.expiresAt < new Date()) return { valid: false, error: "Token expired" };

  return { valid: true, username: user.username };
}

