// src/routes/auth.js
import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../prisma/client.js';
import { validateBody, schemas } from '../middleware/validate.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

// Register
router.post('/register', validateBody(schemas.signup), async (req, res) => {
  const { name, email, password, age } = req.body;

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) return res.status(400).json({ error: 'Email already exists' });

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: { name, email, passwordHash, age },
  });

  const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

  res.status(201).json({ user, token });
});

// Login
router.post('/login', validateBody(schemas.login), async (req, res) => {
  const { email, password } = req.body;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

  res.json({ user, token });
});

// Logout (Client deletes token)
router.post('/logout', (_req, res) => {
  res.json({ message: 'Logged out (token removed on client)' });
});

// Get current user
router.get('/me', authMiddleware, async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: { id: true, name: true, email: true, xp: true, level: true },
  });

  res.json(user);
});

export default router;
