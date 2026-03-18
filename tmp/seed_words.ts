import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const words = [
  // Image 1
  "SEDATIF", "SELEKTIF", "SENSITIF", "SEGREGATIF", "SOLUTIF", "SPEKULATIF", "SPORTIF", 
  "STATIF", "SUBORDINATIF", "SUBVERSIF", "SUBJEKTIF", "SUBSTANTIF", "SUGESTIF", 
  "SUKSESIF", "SUMATIF", "SUPORTIF", "SUPRESIF", "SYARIF", "TARIF", "TRANSFORMATIF", 
  "TENTATIF", "TRANSITIF", "TRANSLATIF",
  // Image 2
  "VEGETATIF", "VARIATIF", "VERIFIKATIF", "YUDIKATIF"
]

async function main() {
  console.log('Seeding words wave 12...')
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

  console.log(`Finished wave 12: ${added} added, ${skipped} skipped. Total unique in list: ${uniqueWords.length}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
