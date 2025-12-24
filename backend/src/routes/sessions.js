import { Router } from 'express';
import prisma from '../prismaClient.js';

const router = Router();

// Criar nova sessão
router.post('/', async (req, res) => {
  try {
    const { imageId } = req.body;

    const imageExists = await prisma.image.findUnique({
      where: { id: imageId }
    });

    if (!imageExists) {
      return res.status(400).json({
        error: 'Image not found'
      });
    }

    const session = await prisma.gameSession.create({
      data: {
        imageId
      }
    });

    res.status(201).json({ sessionId: session.id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create session' });
  }
});

export default router;