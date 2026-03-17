import { PrismaClient } from "@prisma/client";
import crypto from "crypto";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

async function main() {
  console.log("Reading KBBI dictionary...");
  const p = path.join(process.cwd(), "public", "kbbi.json");
  const data = JSON.parse(fs.readFileSync(p, "utf-8")) as string[];

  console.log(`Found ${data.length} words. Prepping database...`);

  // Check if we already seeded to avoid unique constraint crashes
  const existingWordsCount = await prisma.word.count();
  if (existingWordsCount > 0) {
    console.log(`Database already contains ${existingWordsCount} words. Skipping word seeding.`);
  } else {
    // Insert in batches of 3,000 to stay within SQLite query-size limits
    const batchSize = 3000;
    let count = 0;

    for (let i = 0; i < data.length; i += batchSize) {
      const batch = data.slice(i, i + batchSize).map((word) => ({ word }));
      await prisma.word.createMany({ data: batch });
      count += batch.length;
      console.log(`Inserted ${count}/${data.length}...`);
    }
  }

  // Create a test admin user — token is hashed to match actions.ts behavior
  const adminRawToken = "VIP-TEST";

  await prisma.user.upsert({
    where: { username: "admin" },
    update: { token: hashToken(adminRawToken) },
    create: {
      username: "admin",
      token: hashToken(adminRawToken),
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365), // 1 year
    },
  });

  console.log("Database successfully seeded!");
  console.log(`Test Login Token (raw — enter this in the app): ${adminRawToken}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
