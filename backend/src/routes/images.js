import { Router } from 'express';
import prisma from '../prismaClient.js';

const router = Router();

router.get('/:id', async (req, res) => {
  const imageId = Number(req.params.id);

  const image = await prisma.image.findUnique({
    where: { id: imageId },
    include: {
      characters: {
        select: { id: true, name: true }
      }
    }
  });

  if (!image) {
    return res.status(404).json({ error: 'Image not found' });
  }

  res.json(image);
});

export default router;