import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Checking for duplicates...')
  
  // Get all words
  const allWords = await prisma.word.findMany({
    select: { word: true }
  })

  const counts: Record<string, number> = {}
  const duplicates: string[] = []

  for (const { word } of allWords) {
    const upper = word.toUpperCase()
    counts[upper] = (counts[upper] || 0) + 1
    if (counts[upper] === 2) {
      duplicates.push(upper)
    }
  }

  if (duplicates.length === 0) {
    console.log('No duplicates found! All entries are unique (case-insensitive).')
  } else {
    console.log(`Found ${duplicates.length} duplicate word patterns (case-insensitive):`)
    for (const dup of duplicates) {
      console.log(`- ${dup} (appears ${counts[dup]} times)`)
    }
  }

  console.log(`Total words in database: ${allWords.length}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
