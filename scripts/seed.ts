import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();

async function main() {
  console.log("Reading KBBI dictionary...");
  const p = path.join(process.cwd(), "public", "kbbi.json");
  const data = JSON.parse(fs.readFileSync(p, "utf-8")) as string[];
  
  console.log(`Found ${data.length} words. Prepping database...`);

  // We can insert them in batches of 3,000 to prevent SQLite query size limits
  const batchSize = 3000;
  let count = 0;

  for (let i = 0; i < data.length; i += batchSize) {
    const batch = data.slice(i, i + batchSize).map((word) => ({ word }));
    await prisma.word.createMany({
      data: batch,
    });
    count += batch.length;
    console.log(`Inserted ${count}/${data.length}...`);
  }

  // Also create a test admin user
  const adminRawToken = "VIP-TEST";
  
  await prisma.user.upsert({
    where: { username: "admin" },
    update: {},
    create: {
      username: "admin",
      token: adminRawToken,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365), // 1 year expiry
    },
  });

  console.log("Database successfully seeded!");
  console.log("Test Login Token: VIP-TEST");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
