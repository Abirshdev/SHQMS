const router = require('express').Router();
const Department = require('../models/Department');
const { protect, role } = require('../middleware/auth');

// Get all active departments (public)
router.get('/', async (req, res) => {
  try {
    const departments = await Department.find({ isActive: true });
    res.json(departments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create department (admin)
router.post('/', protect, role('admin'), async (req, res) => {
  try {
    const dept = await Department.create(req.body);
    res.status(201).json(dept);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update department (admin)
router.put('/:id', protect, role('admin'), async (req, res) => {
  try {
    const dept = await Department.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(dept);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete department (admin)
router.delete('/:id', protect, role('admin'), async (req, res) => {
  try {
    await Department.findByIdAndDelete(req.params.id);
    res.json({ message: 'Department deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
