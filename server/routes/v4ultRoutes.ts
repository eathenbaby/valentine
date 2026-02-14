import express from 'express';
import type { Request, Response } from 'express';

const router = express.Router();

// Legacy v4ult API routes
router.get('/v4ult/stats', async (req: Request, res: Response) => {
  try {
    // Return some basic stats for v4ult compatibility
    res.json({
      status: 'ok',
      message: 'V4ult API is deprecated. Please use the new confession platform.',
      legacy: true,
    });
  } catch (error) {
    console.error('V4ult API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
