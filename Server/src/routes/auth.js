const express = require('express');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const { authenticate, signToken } = require('../middleware/auth');
const { createError } = require('../middleware/errorHandler');

const router = express.Router();

router.post(
  '/register',
  asyncHandler(async (req, res) => {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      throw createError(400, 'name, email, and password are required');
    }
    if (password.length < 6) {
      throw createError(400, 'Password must be at least 6 characters');
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      throw createError(409, 'Email already registered');
    }

    const passwordHash = await User.hashPassword(password);
    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      passwordHash,
    });

    const token = signToken(user);
    res.status(201).json({ token, user: user.toSafeJSON() });
  })
);

router.post(
  '/login',
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
      throw createError(400, 'email and password are required');
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select(
      '+passwordHash'
    );
    if (!user || !(await user.comparePassword(password))) {
      throw createError(401, 'Invalid email or password');
    }

    const token = signToken(user);
    res.json({ token, user: user.toSafeJSON() });
  })
);

router.get(
  '/me',
  authenticate,
  asyncHandler(async (req, res) => {
    res.json({ user: req.user.toSafeJSON() });
  })
);

module.exports = router;
