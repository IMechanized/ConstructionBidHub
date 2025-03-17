import { Router } from 'express';
import { cacheMiddleware, clearCache } from '../middleware/cache';
import { db } from '../db';
import { rfps } from '@shared/schema';

const router = Router();

// Cache RFP list for 5 minutes
router.get('/api/rfps', 
  cacheMiddleware({ prefix: 'rfps', ttl: 300 }), 
  async (req, res) => {
    try {
      const allRfps = await db.select().from(rfps);
      res.json(allRfps);
    } catch (error) {
      console.error('Error fetching RFPs:', error);
      res.status(500).json({ error: 'Failed to fetch RFPs' });
    }
  }
);

// Clear RFP cache when a new RFP is created
router.post('/api/rfps', async (req, res) => {
  try {
    const result = await db.insert(rfps).values(req.body);
    await clearCache('rfps');
    res.status(201).json(result);
  } catch (error) {
    console.error('Error creating RFP:', error);
    res.status(500).json({ error: 'Failed to create RFP' });
  }
});

export default router;
