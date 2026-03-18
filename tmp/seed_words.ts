import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const words = [
  "LOID", "TIFOID", "IFTIRASY", "INCOMPETENCY", "IAMBUS", "HOPEA", "IAIDO", "AII", "IFFAH", "IATROGENIK"
]

async function main() {
  console.log('Seeding words wave 8...')
  let added = 0
  let skipped = 0

  const uniqueWords = [...new Set(words.map(w => w.trim().toUpperCase()))]

  for (const upperWord of uniqueWords) {
    if (!upperWord) continue

    const existing = await prisma.word.findUnique({
      where: { word: upperWord }
    })

    if (!existing) {
      await prisma.word.create({
        data: { word: upperWord }
      })
      added++
    } else {
      skipped++
    }
  }

  console.log(`Finished wave 8: ${added} added, ${skipped} skipped. Total unique in list: ${uniqueWords.length}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
