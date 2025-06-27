import express from 'express';
import prisma from '../prisma/client.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { validateBody, schemas } from '../middleware/validate.js';

const router = express.Router();

/**
 * Create a financial goal
 */
router.post(
  '/',
  authMiddleware,
  validateBody(schemas.goal),
  async (req, res) => {
    const { type, title, amount, targetDate } = req.body;

    try {
      const goal = await prisma.goal.create({
        data: {
          userId: req.user.id,
          type,
          title,
          amount,
          targetDate: new Date(targetDate),
          progress: 0,
        },
      });

      res.status(201).json(goal);
    } catch (err) {
      res.status(500).json({ error: 'Failed to create goal', details: err.message });
    }
  }
);

/**
 * Get all goals for user
 */
router.get('/', authMiddleware, async (req, res) => {
  try {
    const goals = await prisma.goal.findMany({
      where: { userId: req.user.id },
      orderBy: { targetDate: 'asc' },
    });

    res.json(goals);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch goals', details: err.message });
  }
});

/**
 * Update goal progress
 */
router.patch('/:id/progress', authMiddleware, async (req, res) => {
  const { progress } = req.body;
  const goalId = req.params.id;

  try {
    const goal = await prisma.goal.findFirst({
      where: {
        id: goalId,
        userId: req.user.id,
      },
    });

    if (!goal) return res.status(404).json({ error: 'Goal not found' });

    const isCompleted = Number(progress) >= Number(goal.amount);

    const updated = await prisma.goal.update({
      where: { id: goalId },
      data: {
        progress,
        updatedAt: new Date(),
      },
    });

    // Award XP if completed
    if (isCompleted && goal.progress < goal.amount) {
      await prisma.xpLog.create({
        data: {
          userId: req.user.id,
          source: `Completed Goal: ${goal.title}`,
          points: 10,
        },
      });

      await prisma.user.update({
        where: { id: req.user.id },
        data: { xp: { increment: 10 } },
      });
    }

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update progress', details: err.message });
  }
});

export default router;
