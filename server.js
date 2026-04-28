const express = require('express');
const fs = require('fs/promises');
const path = require('path');
const crypto = require('crypto');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;
const BOOKINGS_FILE = path.join(__dirname, 'data', 'bookings.json');
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
}));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const DEPARTMENTS = {
  'General Medicine': [
    'Dr. Anita Sharma',
    'Dr. Rohan Mehta',
    'Dr. Sneha Patel',
    'Dr. Kunal Desai',
    'Dr. Pooja Agarwal',
    'Dr. Amit Verma',
    'Dr. Riya Chawla',
  ],
  Cardiology: ['Dr. Vikram Iyer', 'Dr. Priya Nair'],
  Orthopedics: ['Dr. Sameer Khan', 'Dr. Lisa Thomas'],
  Pediatrics: ['Dr. Neha Verma', 'Dr. Arjun Kapoor'],
  Dermatology: ['Dr. Kavya Reddy'],
  'ENT (Ear, Nose, Throat)': ['Dr. Manish Gupta'],
  Neurology: ['Dr. Rajesh Pillai'],
  Gynecology: ['Dr. Sunita Rao'],
  Ophthalmology: ['Dr. Aisha Khan', 'Dr. Nitin Joshi'],
  Psychiatry: ['Dr. Ritu Malhotra', 'Dr. Karan Sethi'],
  Urology: ['Dr. Deepak Menon', 'Dr. Isha Batra'],
  Endocrinology: ['Dr. Meera Kulkarni', 'Dr. Rahul Bansal'],
};

const TIME_SLOTS = [
  '09:00 AM', '09:30 AM',
  '10:00 AM', '10:30 AM',
  '11:00 AM', '11:30 AM',
  '12:00 PM',
  '02:00 PM', '02:30 PM',
  '03:00 PM', '03:30 PM',
  '04:00 PM', '04:30 PM',
  '05:00 PM',
];

async function ensureStorage() {
  await fs.mkdir(path.dirname(BOOKINGS_FILE), { recursive: true });
  try {
    await fs.access(BOOKINGS_FILE);
  } catch (_err) {
    await fs.writeFile(BOOKINGS_FILE, '[]\n', 'utf8');
  }
}

async function readBookings() {
  const raw = await fs.readFile(BOOKINGS_FILE, 'utf8');
  return JSON.parse(raw);
}

async function writeBookings(bookings) {
  await fs.writeFile(BOOKINGS_FILE, `${JSON.stringify(bookings, null, 2)}\n`, 'utf8');
}

app.get('/meta', (_req, res) => {
  res.json({ departments: DEPARTMENTS, timeSlots: TIME_SLOTS });
});

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

app.post('/book', async (req, res) => {
  try {
    const {
      name, age, gender, phone, email, address,
      department, doctor, date, time, reason, mode,
    } = req.body || {};

    const missing = [];
    if (!name) missing.push('name');
    if (age === undefined || age === null || age === '') missing.push('age');
    if (!gender) missing.push('gender');
    if (!phone) missing.push('phone');
    if (!email) missing.push('email');
    if (!address) missing.push('address');
    if (!department) missing.push('department');
    if (!doctor) missing.push('doctor');
    if (!date) missing.push('date');
    if (!time) missing.push('time');
    if (!reason) missing.push('reason');
    if (!mode) missing.push('mode');
    if (missing.length) {
      return res.status(400).json({ error: 'Please fill in: ' + missing.join(', ') });
    }

    const ageNum = Number(age);
    if (!Number.isFinite(ageNum) || ageNum < 0 || ageNum > 130) {
      return res.status(400).json({ error: 'Please enter a valid age.' });
    }
    if (!isValidEmail(email)) {
      return res.status(400).json({ error: 'Please enter a valid email address.' });
    }
    if (!/^[+\d][\d\s\-()]{6,}$/.test(phone)) {
      return res.status(400).json({ error: 'Please enter a valid phone number.' });
    }
    if (!DEPARTMENTS[department]) {
      return res.status(400).json({ error: 'Unknown department.' });
    }
    if (!DEPARTMENTS[department].includes(doctor)) {
      return res.status(400).json({ error: 'Selected doctor does not belong to this department.' });
    }
    if (!TIME_SLOTS.includes(time)) {
      return res.status(400).json({ error: 'Invalid time slot.' });
    }
    if (!['Online', 'In-Person'].includes(mode)) {
      return res.status(400).json({ error: 'Please choose Online or In-Person.' });
    }

    const today = new Date(); today.setHours(0, 0, 0, 0);
    const picked = new Date(date);
    if (isNaN(picked.getTime()) || picked < today) {
      return res.status(400).json({ error: 'Please pick today or a future date.' });
    }

    const bookings = await readBookings();
    const existing = bookings.find((booking) => (
      booking.doctor === doctor && booking.date === date && booking.time === time
    ));
    if (existing) {
      return res.status(409).json({ error: 'Slot already booked' });
    }

    let meetingLink = '';
    if (mode === 'Online') {
      const id = Math.random().toString(36).slice(2, 10);
      meetingLink = `https://meet.medicare-hospital.test/${id}`;
    }

    const booking = {
      id: crypto.randomUUID(),
      name: String(name).trim(),
      age: ageNum,
      gender,
      phone: String(phone).trim(),
      email: String(email).trim().toLowerCase(),
      address: String(address).trim(),
      department,
      doctor,
      date,
      time,
      reason: String(reason).trim(),
      mode,
      meetingLink,
      createdAt: new Date().toISOString(),
    };

    bookings.push(booking);
    await writeBookings(bookings);

    res.status(201).json(booking);
  } catch (err) {
    console.error('POST /book failed:', err);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

app.get('/bookings', async (_req, res) => {
  try {
    const bookings = await readBookings();
    bookings.sort((a, b) => {
      const dateCompare = String(a.date).localeCompare(String(b.date));
      if (dateCompare !== 0) return dateCompare;
      return TIME_SLOTS.indexOf(a.time) - TIME_SLOTS.indexOf(b.time);
    });
    res.json(bookings);
  } catch (err) {
    console.error('GET /bookings failed:', err);
    res.status(500).json({ error: 'Could not load bookings.' });
  }
});

ensureStorage()
  .then(() => {
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Failed to start server:', err);
    process.exit(1);
  });