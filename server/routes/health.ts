import { Router } from 'express';

const router = Router();

// Store the server start time to help with hot reloading
const SERVER_START_TIME = Date.now();

router.get('/', async (req, res) => {
  try {
    // Include server start time for hot reload detection
    res.json({ 
      status: 'healthy',
      serverStartTime: SERVER_START_TIME
    });
  } catch (err) {
    // Handle the error safely
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    res.status(503).json({ 
      status: 'unhealthy',
      error: errorMessage,
      serverStartTime: SERVER_START_TIME
    });
  }
});

// Authentication status check route (for debugging)
router.get('/auth-status', (req, res) => {
  res.json({
    isAuthenticated: req.isAuthenticated?.() || false,
    user: req.user ? { id: req.user.id } : null,
    sessionID: req.sessionID || null,
    environment: process.env.NODE_ENV || 'development',
    isVercel: Boolean(process.env.VERCEL_URL),
    vercelUrl: process.env.VERCEL_URL || null,
    cookieSettings: {
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      secure: process.env.NODE_ENV === 'production'
    }
  });
});

export default router;
