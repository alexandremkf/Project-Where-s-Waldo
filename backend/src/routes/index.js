import { Router } from 'express';
import sessionsRouter from './sessions.js';
import validateRouter from './validate.js';
import imagesRouter from './images.js';

const router = Router();

router.use('/sessions', sessionsRouter);
router.use('/validate', validateRouter);
router.use('/images', imagesRouter);
  
router.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

export default router;