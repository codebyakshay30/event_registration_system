const router = require('express').Router();
const c = require('../controllers/eventController');
const { protect, authorize } = require('../middleware/auth');

router.get('/registrations/mine', protect, authorize('student'), c.myRegistrations);

router.get('/', protect, c.getEvents);
router.get('/:id', protect, c.getEvent);

// Organizer-only routes
router.post('/', protect, authorize('organizer'), c.createEvent);
router.put('/:id', protect, authorize('organizer'), c.updateEvent);
router.delete('/:id', protect, authorize('organizer'), c.deleteEvent);
router.get('/:id/participants', protect, authorize('organizer'), c.getParticipants);

// Student-only routes
router.post('/:id/register', protect, authorize('student'), c.registerForEvent);
router.delete('/:id/register', protect, authorize('student'), c.cancelRegistration);

module.exports = router;
