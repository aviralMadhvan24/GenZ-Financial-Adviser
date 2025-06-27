import express from 'express';
import prisma from '../prisma/client.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { validateBody, schemas } from '../middleware/validate.js';

const router = express.Router();

/**
 * Add a new income
 */
router.post(
  '/',
  authMiddleware,
  validateBody(schemas.income),
  async (req, res) => {
    const { source, amount, frequency, date } = req.body;

    try {
      const income = await prisma.income.create({
        data: {
          userId: req.user.id,
          source,
          amount,
          frequency,
          date: new Date(date),
        },
      });

      // XP reward for logging income
      await prisma.xpLog.create({
        data: {
          userId: req.user.id,
          source: `Income: ${source}`,
          points: 5,
        },
      });

      await prisma.user.update({
        where: { id: req.user.id },
        data: { xp: { increment: 5 } },
      });

      res.status(201).json(income);
    } catch (err) {
      res.status(500).json({ error: 'Failed to log income', details: err.message });
    }
  }
);

/**
 * Get all incomes for the user
 */
router.get('/', authMiddleware, async (req, res) => {
  try {
    const incomes = await prisma.income.findMany({
      where: { userId: req.user.id },
      orderBy: { date: 'desc' },
    });

    res.json(incomes);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch incomes', details: err.message });
  }
});

/**
 * Optional filter: frequency and date
 * Example: /api/income/filter?frequency=MONTHLY&start=2025-06-01&end=2025-06-30
 */
router.get('/filter', authMiddleware, async (req, res) => {
  const { frequency, start, end } = req.query;

  const filters = { userId: req.user.id };

  if (frequency) filters.frequency = frequency;
  if (start && end) {
    filters.date = {
      gte: new Date(start),
      lte: new Date(end),
    };
  }

  try {
    const incomes = await prisma.income.findMany({
      where: filters,
      orderBy: { date: 'desc' },
    });

    res.json(incomes);
  } catch (err) {
    res.status(500).json({ error: 'Failed to filter incomes', details: err.message });
  }
});

export default router;
