const form = document.getElementById('booking-form');
const messageEl = document.getElementById('message');
const departmentEl = document.getElementById('department');
const doctorEl = document.getElementById('doctor');
const timeEl = document.getElementById('time');
const dateEl = document.getElementById('date');
const API_BASE = (window.API_BASE || '').replace(/\/$/, '');

function apiUrl(path) {
  if (!API_BASE) return path;
  return `${API_BASE}${path.startsWith('/') ? path : `/${path}`}`;
}

let DEPARTMENTS = {
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

function showMessage(text, type) {
  messageEl.textContent = text;
  messageEl.className = 'message ' + type;
}

function populateDepartments() {
  departmentEl.innerHTML = '<option value="">Select department</option>';
  Object.keys(DEPARTMENTS).forEach((d) => {
    const opt = document.createElement('option');
    opt.value = d;
    opt.textContent = d;
    departmentEl.appendChild(opt);
  });
}

function populateTimeSlots(slots) {
  timeEl.innerHTML = '<option value="">Select a time</option>';
  slots.forEach((t) => {
    const opt = document.createElement('option');
    opt.value = t;
    opt.textContent = t;
    timeEl.appendChild(opt);
  });
}

const todayStr = new Date().toISOString().split('T')[0];
dateEl.min = todayStr;
populateDepartments();
populateTimeSlots(TIME_SLOTS);

async function loadMeta() {
  try {
    const res = await fetch(apiUrl('/meta'));
    if (!res.ok) throw new Error('Could not load metadata');
    const meta = await res.json();
    DEPARTMENTS = meta.departments || DEPARTMENTS;
    populateDepartments();
    populateTimeSlots(meta.timeSlots && meta.timeSlots.length ? meta.timeSlots : TIME_SLOTS);
  } catch (err) {
    showMessage('Using default departments, doctors, and time slots.', 'success');
  }
}

departmentEl.addEventListener('change', () => {
  const dept = departmentEl.value;
  doctorEl.innerHTML = '';
  if (!dept || !DEPARTMENTS[dept]) {
    doctorEl.disabled = true;
    doctorEl.innerHTML = '<option value="">Select a department first</option>';
    return;
  }
  doctorEl.disabled = false;
  doctorEl.innerHTML = '<option value="">Select a doctor</option>';
  DEPARTMENTS[dept].forEach((doc) => {
    const opt = document.createElement('option');
    opt.value = doc;
    opt.textContent = doc;
    doctorEl.appendChild(opt);
  });
});

form.addEventListener('submit', async (event) => {
  event.preventDefault();

  const payload = {
    name: document.getElementById('name').value.trim(),
    age: document.getElementById('age').value,
    gender: document.getElementById('gender').value,
    phone: document.getElementById('phone').value.trim(),
    email: document.getElementById('email').value.trim(),
    address: document.getElementById('address').value.trim(),
    department: departmentEl.value,
    doctor: doctorEl.value,
    date: dateEl.value,
    time: timeEl.value,
    reason: document.getElementById('reason').value.trim(),
    mode: (document.querySelector('input[name="mode"]:checked') || {}).value || '',
  };

  for (const [key, val] of Object.entries(payload)) {
    if (val === '' || val === null || val === undefined) {
      showMessage('Please fill in every field.', 'error');
      return;
    }
  }

  const submitBtn = form.querySelector('button[type="submit"]');
  submitBtn.disabled = true;
  showMessage('Booking your appointment...', '');

  try {
    const res = await fetch(apiUrl('/book'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();

    if (!res.ok) {
      showMessage(data.error || 'Could not book appointment.', 'error');
    } else {
      showMessage('Appointment booked successfully! Redirecting...', 'success');
      form.reset();
      doctorEl.disabled = true;
      doctorEl.innerHTML = '<option value="">Select a department first</option>';
      setTimeout(() => { window.location.href = 'appointments.html'; }, 1200);
    }
  } catch (err) {
    showMessage('Network error. Please try again.', 'error');
  } finally {
    submitBtn.disabled = false;
  }
});

loadMeta();