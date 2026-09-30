// Optional: npm run seed  -> creates demo organizer, student and 3 events
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Event = require('./models/Event');
const Registration = require('./models/Registration');

(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  await Promise.all([User.deleteMany(), Event.deleteMany(), Registration.deleteMany()]);
  const org = await User.create({ name: 'Demo Organizer', email: 'organizer@demo.com', password: 'organizer123', role: 'organizer' });
  await User.create({ name: 'Demo Student', email: 'student@demo.com', password: 'student123', role: 'student' });
  const d = (days) => new Date(Date.now() + days * 864e5);
  await Event.insertMany([
    { title: 'Web Dev Workshop', description: 'Hands-on Node.js and React session.', venue: 'Lab 3', date: d(7), maxCapacity: 50, organizer: org._id },
    { title: 'Hackathon 2026', description: '24-hour coding challenge.', venue: 'Main Auditorium', date: d(14), maxCapacity: 2, organizer: org._id },
    { title: 'AI Seminar', description: 'Introduction to machine learning.', venue: 'Seminar Hall', date: d(21), maxCapacity: 100, organizer: org._id }
  ]);
  console.log('Seeded. organizer@demo.com / organizer123  |  student@demo.com / student123');
  process.exit(0);
})();
