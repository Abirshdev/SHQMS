/**
 * Seed script — creates an admin account and sample departments.
 * Run once: node seed.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Department = require('./models/Department');

const departments = [
  { name: 'General Outpatient', description: 'General medical consultations' },
  { name: 'Emergency', description: 'Urgent and emergency care' },
  { name: 'Pediatrics', description: 'Children health services' },
  { name: 'Maternity', description: 'Maternal and newborn care' },
  { name: 'Laboratory', description: 'Blood tests and diagnostics' },
];

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to DB');

  // Create departments
  for (const dept of departments) {
    await Department.findOneAndUpdate({ name: dept.name }, dept, { upsert: true });
  }
  console.log('Departments seeded');

  // Create admin
  const existing = await User.findOne({ phone: '0900000000' });
  if (!existing) {
    await User.create({ name: 'Admin', phone: '0900000000', password: 'admin123', role: 'admin' });
    console.log('Admin created — phone: 0900000000, password: admin123');
  } else {
    console.log('Admin already exists');
  }

  await mongoose.disconnect();
  console.log('Done');
}

seed().catch(console.error);
