import { Router } from 'express';
import redis from '../lib/redis';

const router = Router();

router.get('/api/health', async (req, res) => {
  try {
    // Test Redis connectivity
    await redis.ping();
    res.json({ status: 'healthy', redis: 'connected' });
  } catch (error) {
    res.status(503).json({ 
      status: 'unhealthy', 
      redis: 'disconnected',
      error: error.message 
    });
  }
});

export default router;
