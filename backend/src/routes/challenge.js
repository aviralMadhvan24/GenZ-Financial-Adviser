import express from 'express';
import Joi from 'joi';
import prisma from '../prisma/client.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { checkRole } from '../middleware/checkRole.js';
import { validateBody } from '../middleware/validate.js';

const router = express.Router();

/**
 * ADMIN: Create a new challenge
 */
router.post(
  '/',
  authMiddleware,
  checkRole(['ADMIN']),
  validateBody(
    Joi.object({
      title: Joi.string().required(),
      description: Joi.string().required(),
      duration: Joi.number().integer().min(1).required(),
      criteria: Joi.string().required(),
      points: Joi.number().integer().positive().required(),
    })
  ),
  async (req, res) => {
    const { title, description, duration, criteria, points } = req.body;

    const challenge = await prisma.challenge.create({
      data: { title, description, duration, criteria, points },
    });

    res.status(201).json(challenge);
  }
);

/**
 * USER: Join a challenge
 */
router.post('/join/:id', authMiddleware, async (req, res) => {
  const challengeId = req.params.id;
  const userId = req.user.id;

  const existing = await prisma.userChallenge.findUnique({
    where: {
      userId_challengeId: {
        userId,
        challengeId,
      },
    },
  });

  if (existing) {
    return res.status(400).json({ error: 'Already joined this challenge' });
  }

  const userChallenge = await prisma.userChallenge.create({
    data: {
      userId,
      challengeId,
      status: 'ACTIVE',
      startedAt: new Date(),
    },
  });

  res.status(201).json(userChallenge);
});

/**
 * USER: Update challenge progress
 */
router.patch('/progress/:id', authMiddleware, async (req, res) => {
  const challengeId = req.params.id;
  const userId = req.user.id;
  const { progress } = req.body;

  const userChallenge = await prisma.userChallenge.findUnique({
    where: {
      userId_challengeId: {
        userId,
        challengeId,
      },
    },
  });

  if (!userChallenge) {
    return res.status(404).json({ error: 'Challenge not joined' });
  }

  const isComplete = progress >= 100;

  const updated = await prisma.userChallenge.update({
    where: {
      userId_challengeId: {
        userId,
        challengeId,
      },
    },
    data: {
      progress,
      status: isComplete ? 'COMPLETED' : 'ACTIVE',
      completedAt: isComplete ? new Date() : null,
    },
  });

  // Award XP if completed
  if (isComplete) {
    const challenge = await prisma.challenge.findUnique({ where: { id: challengeId } });

    await prisma.user.update({
      where: { id: userId },
      data: {
        xp: { increment: challenge.points },
      },
    });

    await prisma.xpLog.create({
      data: {
        userId,
        source: `Challenge: ${challenge.title}`,
        points: challenge.points,
      },
    });
  }

  res.json(updated);
});

/**
 * USER: View joined challenges
 */
router.get('/my', authMiddleware, async (req, res) => {
  const challenges = await prisma.userChallenge.findMany({
    where: { userId: req.user.id },
    include: { challenge: true },
    orderBy: { startedAt: 'desc' },
  });

  res.json(challenges);
});

/**
 * PUBLIC: List all available challenges
 */
router.get('/', async (_req, res) => {
  const challenges = await prisma.challenge.findMany({
    orderBy: { createdAt: 'desc' },
  });

  res.json(challenges);
});

export default router;
