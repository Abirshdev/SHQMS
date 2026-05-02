const router = require('express').Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect, role } = require('../middleware/auth');

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });

// Register (patient self-register)
router.post('/register', async (req, res) => {
  try {
    const { name, phone, password } = req.body;
    if (await User.findOne({ phone }))
      return res.status(400).json({ message: 'Phone already registered' });

    const user = await User.create({ name, phone, password });
    res.status(201).json({ token: signToken(user._id), user: { id: user._id, name: user.name, role: user.role } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { phone, password } = req.body;
    const user = await User.findOne({ phone });
    if (!user || !(await user.matchPassword(password)))
      return res.status(401).json({ message: 'Invalid credentials' });

    res.json({ token: signToken(user._id), user: { id: user._id, name: user.name, role: user.role, department: user.department } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create staff (admin only)
router.post('/create-staff', protect, role('admin'), async (req, res) => {
  try {
    const { name, phone, password, role: staffRole, department } = req.body;
    if (await User.findOne({ phone }))
      return res.status(400).json({ message: 'Phone already registered' });

    const user = await User.create({ name, phone, password, role: staffRole, department });
    res.status(201).json({ message: 'Staff created', user: { id: user._id, name: user.name, role: user.role } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get current user
router.get('/me', protect, (req, res) => res.json(req.user));

module.exports = router;
