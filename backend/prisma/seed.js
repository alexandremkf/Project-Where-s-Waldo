import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Deleta tudo para testes repetidos
  await prisma.foundCharacter.deleteMany();
  await prisma.character.deleteMany();
  await prisma.image.deleteMany();
  await prisma.gameSession.deleteMany();

  const image = await prisma.image.create({
    data: {
      name: "Waldo Map 1",
      imageUrl: "/images/waldo.jpg",
      width: 1920,
      height: 1080,
      characters: {
        create: [
          {
            name: "Waldo",
            xMin: 0.42,
            xMax: 0.46,
            yMin: 0.60,
            yMax: 0.65
          },
          {
            name: "Wizard",
            xMin: 0.10,
            xMax: 0.14,
            yMin: 0.30,
            yMax: 0.36
          }
        ]
      }
    }
  });

  console.log("Seed complete:", image);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());