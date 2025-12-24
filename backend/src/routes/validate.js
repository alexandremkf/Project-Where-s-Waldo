import { Router } from 'express';
import prisma from '../prismaClient.js';

const router = Router();

/*
Body esperado:
{
  sessionId,
  characterId,
  x,
  y
}
x e y normalizados (0–1)
*/

router.post('/', async (req, res) => {
  try {
    const { sessionId, characterId, x, y } = req.body;

    const character = await prisma.character.findUnique({
      where: { id: characterId }
    });

    if (!character) {
      return res.status(404).json({ error: 'Character not found' });
    }

    const isInside =
      x >= character.xMin &&
      x <= character.xMax &&
      y >= character.yMin &&
      y <= character.yMax;

    if (!isInside) {
      return res.json({ correct: false });
    }

    // Evita duplicar personagem
    await prisma.foundCharacter.create({
      data: {
        sessionId,
        characterId
      }
    });

    res.json({ correct: true });
  } catch (error) {
    if (error.code === 'P2002') {
      // personagem já encontrado
      return res.json({ correct: true });
    }

    console.error(error);
    res.status(500).json({ error: 'Validation failed' });
  }
});

export default router;