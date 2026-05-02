const router = require('express').Router();
const Queue = require('../models/Queue');
const Department = require('../models/Department');
const { protect, role } = require('../middleware/auth');

const today = () => new Date().toISOString().split('T')[0];

// SMS helper (stub — replace with real gateway)
async function sendSMS(phone, message) {
  console.log(`[SMS] To: ${phone} | Message: ${message}`);
  // TODO: integrate real SMS gateway (e.g., Africa's Talking, Twilio)
}

// Join queue (patient)
router.post('/join', protect, role('patient'), async (req, res) => {
  try {
    const { departmentId } = req.body;
    const date = today();

    // Check if already in queue today
    const existing = await Queue.findOne({
      patient: req.user._id,
      department: departmentId,
      date,
      status: { $in: ['waiting', 'serving'] }
    });
    if (existing) return res.status(400).json({ message: 'Already in queue for this department today' });

    // Get next ticket number
    const last = await Queue.findOne({ department: departmentId, date }).sort({ ticketNumber: -1 });
    const ticketNumber = last ? last.ticketNumber + 1 : 1;

    const entry = await Queue.create({
      patient: req.user._id,
      department: departmentId,
      ticketNumber,
      date
    });

    // Count waiting ahead
    const ahead = await Queue.countDocuments({
      department: departmentId,
      date,
      status: 'waiting',
      ticketNumber: { $lt: ticketNumber }
    });

    const dept = await Department.findById(departmentId);
    await sendSMS(req.user.phone, `You joined the queue for ${dept.name}. Your ticket: #${ticketNumber}. People ahead: ${ahead}.`);

    const io = req.app.get('io');
    io.emit('queue-update', { departmentId });

    res.status(201).json({ ...entry.toObject(), ahead });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get queue status for a department (public)
router.get('/department/:deptId', async (req, res) => {
  try {
    const date = today();
    const queue = await Queue.find({
      department: req.params.deptId,
      date,
      status: { $in: ['waiting', 'serving'] }
    })
      .populate('patient', 'name phone')
      .sort({ ticketNumber: 1 });

    const dept = await Department.findById(req.params.deptId);
    res.json({ currentServing: dept.currentServing, queue });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get patient's own queue entries
router.get('/my', protect, role('patient'), async (req, res) => {
  try {
    const entries = await Queue.find({ patient: req.user._id, date: today() })
      .populate('department', 'name currentServing');
    res.json(entries);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Call next patient (doctor)
router.post('/next/:deptId', protect, role('doctor', 'admin'), async (req, res) => {
  try {
    const date = today();
    const deptId = req.params.deptId;

    // Mark current serving as completed
    await Queue.updateMany(
      { department: deptId, date, status: 'serving' },
      { status: 'completed' }
    );

    // Get next waiting
    const next = await Queue.findOne({ department: deptId, date, status: 'waiting' })
      .sort({ ticketNumber: 1 })
      .populate('patient', 'name phone');

    if (!next) return res.json({ message: 'No more patients in queue' });

    next.status = 'serving';
    await next.save();

    await Department.findByIdAndUpdate(deptId, { currentServing: next.ticketNumber });

    // Notify next patient
    await sendSMS(next.patient.phone, `It's your turn! Please proceed to the doctor. Ticket #${next.ticketNumber}.`);

    // Notify the one after (heads-up)
    const upcoming = await Queue.findOne({ department: deptId, date, status: 'waiting' })
      .sort({ ticketNumber: 1 })
      .populate('patient', 'name phone');
    if (upcoming) {
      await sendSMS(upcoming.patient.phone, `You're next in line! Ticket #${upcoming.ticketNumber}. Please be ready.`);
    }

    const io = req.app.get('io');
    io.emit('queue-update', { departmentId: deptId, currentServing: next.ticketNumber });

    res.json(next);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Cancel queue entry (patient or admin)
router.put('/cancel/:id', protect, async (req, res) => {
  try {
    const entry = await Queue.findById(req.params.id);
    if (!entry) return res.status(404).json({ message: 'Queue entry not found' });

    // Patient can only cancel their own
    if (req.user.role === 'patient' && entry.patient.toString() !== req.user._id.toString())
      return res.status(403).json({ message: 'Not allowed' });

    entry.status = 'cancelled';
    await entry.save();

    const io = req.app.get('io');
    io.emit('queue-update', { departmentId: entry.department });

    res.json({ message: 'Queue entry cancelled' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Admin: get all queues today across all departments
router.get('/admin/today', protect, role('admin'), async (req, res) => {
  try {
    const queues = await Queue.find({ date: today() })
      .populate('patient', 'name phone')
      .populate('department', 'name')
      .sort({ createdAt: 1 });
    res.json(queues);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
