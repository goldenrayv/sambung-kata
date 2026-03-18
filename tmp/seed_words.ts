import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const words = [
  "ENSI", "SAO", "SAOK", "TIPS", "IAN", "ART", "ARI", "APIN", "KSAD", "KSAL", "SPIN", "LOI", "FEZ", "RAGAZ", "UKUF", "ONDERBOUW", "IFUMI", "FUSUK", "ALF", "KHAUF", "MIAK", "NGOH", "TIFOSI", "TIFLOFILI", "TIFLOFILIA", "IFTAR", "AFYAUF", "UFO", "UFOLOGI", "TEAN", "OALAH", "AMENOREA", "KOHLEA", "YOKE", "ANOI", "GOI", "NEA", "XANTIN", "XANTINA", "LOIR", "IFA", "TAZOA"
]

async function main() {
  console.log('Seeding words wave 7...')
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

  console.log(`Finished wave 7: ${added} added, ${skipped} skipped. Total unique in list: ${uniqueWords.length}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
