import prisma from '../prismaClient.js';

export async function checkGameFinished(sessionId) {
  const session = await prisma.gameSession.findUnique({
    where: { id: sessionId },
    include: {
      found: true,
      image: {
        include: {
          characters: true
        }
      }
    }
  });

  if (session.found.length === session.image.characters.length) {
    await prisma.gameSession.update({
      where: { id: sessionId },
      data: {
        finishedAt: new Date()
      }
    });

    return true;
  }

  return false;
}