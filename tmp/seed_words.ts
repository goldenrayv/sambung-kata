import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const words = [
  "AKTIF", "ADAPTIF", "ADIKTIF", "ADITIF", "ADMINISTRATIF", "AFEKTIF", "AGRESIF", 
  "ALTERNATIF", "ARGUMENTATIF", "ASOSIATIF", "ATRAKTIF", "ALIF", "ARIF", "ADJEKTIF", 
  "ASERTIF", "ASUMTIF", "AKUMULATIF", "ABORTIF", "AFIRMATIF", "AGITATIF", "AKOMODATIF", 
  "ANTISIPATIF", "APLIKATIF", "AKUSATIF", "AMELIORATIF", "ASIMILATIF", "ATRIBUTIF", 
  "AUDITIF", "APOSITIF", "AKSELERATIF", "AGLUTINATIF", "ADSORPTIF", "APERITIF", 
  "ADHESIF", "ABLATIF", "DEDUKTIF", "DEFINITIF", "DEFORMATIF", "DESKRIPTIF", 
  "DEMONSTRATIF", "DETEKTIF", "DIREKTIF", "DISTRIBUTIF", "DEFENSIF", "DEGRADATIF", 
  "DEKLARATIF", "DEKORATIF", "DELUSIF", "DENOTATIF", "DEPRESIF", "DERIVATIF", 
  "DESTRUKTIF", "DETERMINATIF", "DIGESTIF", "DIMINUTIF", "DISJUNGTIF", "DISKURSIF", 
  "DISOSIATIF", "DEGENERATIF", "DEFEKTIF", "DISKRIMINATIF", "DATIF", "DURATIF", 
  "EDUKATIF", "EFEKTIF", "EKSPANSIF", "EKSPRESIF", "EKSPLORATIF", "EKSTENSIF", 
  "EVALUATIF", "EVOKATIF", "EJEKTIF", "EKSKLUSIF", "EKSKURSIF", "EKSEKUTIF", 
  "EKSPLIKATIF", "EKSPLOSIF", "EKUATIF", "ELUSIF", "EMANSIPATIF", "EMOTIF", 
  "EVOLUTIF", "EKSPLOITATIF"
]

async function main() {
  console.log('Seeding words wave 10...')
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

  console.log(`Finished wave 10: ${added} added, ${skipped} skipped. Total unique in list: ${uniqueWords.length}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
