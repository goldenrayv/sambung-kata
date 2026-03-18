import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Word Rollback Tool ---');
  
  const kbbiPath = path.join(process.cwd(), 'public', 'kbbi.json');
  if (!fs.existsSync(kbbiPath)) {
    console.error('Error: public/kbbi.json not found.');
    return;
  }
  
  const kbbiArray = JSON.parse(fs.readFileSync(kbbiPath, 'utf-8')) as string[];
  const kbbiSet = new Set(kbbiArray.map(w => w.toUpperCase().trim()));
  
  console.log(`Loaded ${kbbiSet.size} valid words from kbbi.json.`);
  
  const dbWords = await prisma.word.findMany({
    select: { id: true, word: true }
  });
  
  console.log(`Checking ${dbWords.length} words in the database...`);
  
  const garbage = dbWords.filter(dbRow => !kbbiSet.has(dbRow.word.toUpperCase()));
  
  if (garbage.length === 0) {
    console.log('No garbage words found. Database is already clean!');
    return;
  }
  
  console.log(`Found ${garbage.length} words not present in the dictionary.`);
  console.log('Sample of words to be deleted:', garbage.slice(0, 20).map(g => g.word).join(', ') + '...');
  
  console.log('Deleting garbage words...');
  
  const deleteResult = await prisma.word.deleteMany({
    where: {
      id: {
        in: garbage.map(g => g.id)
      }
    }
  });
  
  console.log(`Successfully deleted ${deleteResult.count} words.`);
  console.log('Rollback complete!');
}

main()
  .catch((e) => {
    console.error('Error during rollback:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
