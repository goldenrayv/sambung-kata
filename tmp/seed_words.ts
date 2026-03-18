import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const words = [
  "CYANOPHYTA", "CYANUS", "CYATHEA", "CLAZMOCALYX", "CYATHULA", "CYGAS", "CYCLEA", 
  "CYCLOPHORUS", "CYLINDRICA", "CYMBOPOGON", "CYMINUM", "CYMNOGRULLUS", "CYNARA", 
  "CYNOGALE", "CYNOGLOSSIDAE", "CYNOMETRA", "CYNOPTERUS", "CYPAINOIDES", "CYPERACEAE", 
  "CYPERUS", "CYPHOMANDRA", "CYPNOPERSICUM", "CYPRINIDAE", "CYPRINIDAL", "CYPRINUS", 
  "CYPRUS", "CYPTOPTERUS", "CYRAS", "CYRTOSTACHYS", "ABSTINENCY", "AFFLUENCY", 
  "ANTIPIRACY", "ARROGANCY", "CORPULENCY", "DELEGITIMACY", "EXCELLENCY", "INCOMPETENCY", 
  "NONLEGITIMACY", "NONTRANSPARENCY", "PRODEMOCRACY", "RECALCITRANCY", "RESURGENCY", "VERDANCY"
]

async function main() {
  console.log('Seeding words wave 9...')
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

  console.log(`Finished wave 9: ${added} added, ${skipped} skipped. Total unique in list: ${uniqueWords.length}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

