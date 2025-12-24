import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Limpa dados anteriores para testes repetidos
  await prisma.foundCharacter.deleteMany();
  await prisma.character.deleteMany();
  await prisma.image.deleteMany();
  await prisma.gameSession.deleteMany();
  await prisma.score.deleteMany();

  // Cria imagem e personagens
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
          },
          {
            name: "Odlaw",
            xMin: 0.70,
            xMax: 0.74,
            yMin: 0.40,
            yMax: 0.45
          }
        ]
      }
    }
  });

  console.log("Image and characters seeded:", image);

  // Cria algumas pontuações de teste
  await prisma.score.createMany({
    data: [
      { playerName: "Alice", time: 120, imageId: image.id },
      { playerName: "Bob", time: 95, imageId: image.id },
      { playerName: "Charlie", time: 150, imageId: image.id }
    ]
  });

  console.log("Sample scores seeded.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());