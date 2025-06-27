// src/middleware/validate.js
import Joi from 'joi';

export const validateBody = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, { abortEarly: false });
    if (error) {
      error.isJoi = true;
      return next(error);
    }
    next();
  };
};

export const validateQuery = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.query, { abortEarly: false });
    if (error) {
      error.isJoi = true;
      return next(error);
    }
    next();
  };
};

export const schemas = {
  signup: Joi.object({
    name: Joi.string().min(2).max(50).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    age: Joi.number().integer().min(13).max(120).optional(),
  }),

  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
  }),

  updateProfile: Joi.object({
    name: Joi.string().min(2).max(50).optional(),
    age: Joi.number().integer().min(13).max(120).optional(),
    avatar: Joi.string().uri().optional(),
  }),

  income: Joi.object({
    source: Joi.string().required(),
    amount: Joi.number().positive().required(),
    frequency: Joi.string()
      .valid('DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY')
      .required(),
    date: Joi.date().required(),
  }),

  expense: Joi.object({
    category: Joi.string().required(),
    amount: Joi.number().positive().required(),
    date: Joi.date().required(),
    recurring: Joi.boolean().optional(),
  }),

  goal: Joi.object({
    type: Joi.string().valid('SAVE', 'INVEST', 'PAYOFF').required(),
    title: Joi.string().required(),
    amount: Joi.number().positive().required(),
    targetDate: Joi.date().greater('now').required(),
  }),

  budget: Joi.object({
    category: Joi.string().required(),
    limit: Joi.number().positive().required(),
    month: Joi.string()
      .pattern(/^\d{4}-\d{2}$/)
      .required(),
  }),
};
