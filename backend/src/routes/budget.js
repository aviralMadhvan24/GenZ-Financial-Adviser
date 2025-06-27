import express from 'express';
import prisma from '../prisma/client.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { validateBody, schemas } from '../middleware/validate.js';

const router = express.Router();

/**
 * Create a new monthly budget
 */
router.post(
  '/',
  authMiddleware,
  validateBody(schemas.budget),
  async (req, res) => {
    const { category, limit, month } = req.body;

    try {
      const existing = await prisma.budget.findUnique({
        where: {
          userId_category_month: {
            userId: req.user.id,
            category,
            month,
          },
        },
      });

      if (existing) {
        return res.status(400).json({ error: 'Budget for this category/month already exists' });
      }

      const budget = await prisma.budget.create({
        data: {
          userId: req.user.id,
          category,
          limit,
          month,
          spent: 0,
        },
      });

      res.status(201).json(budget);
    } catch (err) {
      res.status(500).json({ error: 'Failed to create budget', details: err.message });
    }
  }
);

/**
 * Get all budgets for current user
 */
router.get('/', authMiddleware, async (req, res) => {
  const budgets = await prisma.budget.findMany({
    where: { userId: req.user.id },
    orderBy: { month: 'desc' },
  });

  res.json(budgets);
});

/**
 * Filter budgets by month
 * Example: /api/budget/filter?month=2025-06
 */
router.get('/filter', authMiddleware, async (req, res) => {
  const { month } = req.query;

  if (!month) {
    return res.status(400).json({ error: 'Month query param required' });
  }

  const budgets = await prisma.budget.findMany({
    where: {
      userId: req.user.id,
      month,
    },
  });

  res.json(budgets);
});

/**
 * Update spent value in a budget manually (optional)
 */
router.patch('/:id/spent', authMiddleware, async (req, res) => {
  const { spent } = req.body;

  const budget = await prisma.budget.update({
    where: {
      id: req.params.id,
    },
    data: {
      spent,
      updatedAt: new Date(),
    },
  });

  res.json(budget);
});

export default router;
