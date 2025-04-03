import { Router } from 'express';
import redis from '../lib/redis';

const router = Router();

// Store the server start time to help with hot reloading
const SERVER_START_TIME = Date.now();

router.get('/api/health', async (req, res) => {
  try {
    // Test Redis connectivity
    await redis.ping();
    
    // Include server start time for hot reload detection
    res.json({ 
      status: 'healthy', 
      redis: 'connected',
      serverStartTime: SERVER_START_TIME
    });
  } catch (err) {
    // Handle the error safely
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    res.status(503).json({ 
      status: 'unhealthy', 
      redis: 'disconnected',
      error: errorMessage,
      serverStartTime: SERVER_START_TIME
    });
  }
});

export default router;
