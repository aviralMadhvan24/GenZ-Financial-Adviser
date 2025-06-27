import express from 'express';
import prisma from '../prisma/client.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { checkRole } from '../middleware/checkRole.js';

const router = express.Router();

// XP required per level (adjust as needed)
const getXpForNextLevel = (level) => 100 + level * 20;

/**
 * Get current user's XP logs
 */
router.get('/logs', authMiddleware, async (req, res) => {
  try {
    const logs = await prisma.xpLog.findMany({
      where: { userId: req.user.id },
      orderBy: { date: 'desc' },
    });

    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch XP logs', details: err.message });
  }
});

/**
 * Get user XP summary (level, total XP, progress)
 */
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { xp: true, level: true },
    });

    const xpNeeded = getXpForNextLevel(user.level);
    const progress = Math.min(100, Math.round((user.xp / xpNeeded) * 100));

    res.json({
      xp: user.xp,
      level: user.level,
      xpForNextLevel: xpNeeded,
      progressPercent: progress,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to calculate XP summary', details: err.message });
  }
});

/**
 * (Optional) Admin manually grants XP to user
 */
router.post('/grant', authMiddleware, checkRole(['ADMIN']), async (req, res) => {
  const { userId, points, reason } = req.body;

  if (!userId || !points) {
    return res.status(400).json({ error: 'userId and points are required' });
  }

  try {
    await prisma.xpLog.create({
      data: {
        userId,
        points,
        source: reason || 'Manual grant',
      },
    });

    await prisma.user.update({
      where: { id: userId },
      data: {
        xp: { increment: points },
      },
    });

    res.json({ message: `Granted ${points} XP to user ${userId}` });
  } catch (err) {
    res.status(500).json({ error: 'Failed to grant XP', details: err.message });
  }
});

export default router;
