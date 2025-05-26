import { Router } from 'express';
import { db } from '../db.js';
import { rfps } from '../../shared/schema.js';

const router = Router();

router.get('/api/rfps', async (req, res) => {
  try {
    const allRfps = await db.select().from(rfps);
    res.json(allRfps);
  } catch (error) {
    console.error('Error fetching RFPs:', error);
    res.status(500).json({ error: 'Failed to fetch RFPs' });
  }
});

router.post('/api/rfps', async (req, res) => {
  try {
    const result = await db.insert(rfps).values(req.body);
    res.status(201).json(result);
  } catch (error) {
    console.error('Error creating RFP:', error);
    res.status(500).json({ error: 'Failed to create RFP' });
  }
});

export default router;
