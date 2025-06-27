import express from 'express';
import prisma from '../prisma/client.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { validateBody, schemas } from '../middleware/validate.js';

const router = express.Router();

/**
 * Add a new expense
 */
router.post(
  '/',
  authMiddleware,
  validateBody(schemas.expense),
  async (req, res) => {
    const { category, amount, date, recurring } = req.body;

    try {
      const expense = await prisma.expense.create({
        data: {
          userId: req.user.id,
          category,
          amount,
          date: new Date(date),
          recurring: recurring || false,
        },
      });

      // Optional: XP reward
      await prisma.xpLog.create({
        data: {
          userId: req.user.id,
          source: `Expense: ${category}`,
          points: 5,
        },
      });

      await prisma.user.update({
        where: { id: req.user.id },
        data: { xp: { increment: 5 } },
      });

      res.status(201).json(expense);
    } catch (err) {
      res.status(500).json({ error: 'Failed to create expense', details: err.message });
    }
  }
);

/**
 * Get all expenses of current user
 */
router.get('/', authMiddleware, async (req, res) => {
  try {
    const expenses = await prisma.expense.findMany({
      where: { userId: req.user.id },
      orderBy: { date: 'desc' },
    });

    res.json(expenses);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch expenses', details: err.message });
  }
});

/**
 * Filter by category or month
 * Example: /api/expense/filter?category=Food&month=2025-06
 */
router.get('/filter', authMiddleware, async (req, res) => {
  const { category, month } = req.query;
  const filters = { userId: req.user.id };

  if (category) filters.category = category;

  if (month) {
    const [year, mon] = month.split('-');
    const start = new Date(`${year}-${mon}-01`);
    const end = new Date(new Date(start).setMonth(start.getMonth() + 1));
    filters.date = { gte: start, lt: end };
  }

  try {
    const expenses = await prisma.expense.findMany({
      where: filters,
      orderBy: { date: 'desc' },
    });

    res.json(expenses);
  } catch (err) {
    res.status(500).json({ error: 'Failed to filter expenses', details: err.message });
  }
});

export default router;
