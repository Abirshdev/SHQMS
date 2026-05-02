const router = require('express').Router();
const User = require('../models/User');
const Department = require('../models/Department');

const departments = [
  { name: 'General Outpatient', description: 'General medical consultations' },
  { name: 'Emergency', description: 'Urgent and emergency care' },
  { name: 'Pediatrics', description: 'Children health services' },
  { name: 'Maternity', description: 'Maternal and newborn care' },
  { name: 'Laboratory', description: 'Blood tests and diagnostics' },
];

router.post('/run', async (req, res) => {
  try {
    // Create departments
    for (const dept of departments) {
      await Department.findOneAndUpdate({ name: dept.name }, dept, { upsert: true });
    }

    // Create admin
    const existing = await User.findOne({ phone: '0900000000' });
    if (!existing) {
      await User.create({ name: 'Admin', phone: '0900000000', password: 'admin123', role: 'admin' });
    }

    res.json({ message: 'Seed completed successfully', admin: { phone: '0900000000', password: 'admin123' } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
