import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import authRoutes from './src/routes/auth.js';
import incomeRoutes from './src/routes/income.js';
import expenseRoutes from './src/routes/expense.js';
import goalRoutes from './src/routes/goal.js';
import budgetRoutes from './src/routes/budget.js';
import challengeRoutes from './src/routes/challenge.js';
import xpRoutes from './src/routes/xp.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/income', incomeRoutes);
app.use('/api/expense', expenseRoutes);
app.use('/api/goal', goalRoutes);
app.use('/api/budget', budgetRoutes);
app.use('/api/challenges', challengeRoutes);
app.use('/api/xp', xpRoutes);

// Health check
app.get('/', (_req, res) => res.send('💰 FinFlex API is Running 🚀'));

// Global error handler
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
