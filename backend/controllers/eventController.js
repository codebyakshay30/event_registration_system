const Event = require('../models/Event');
const Registration = require('../models/Registration');

// ---------- CRUD (organizer) ----------
exports.createEvent = async (req, res, next) => {
  try {
    const { title, description, venue, date, maxCapacity } = req.body;
    const event = await Event.create({ title, description, venue, date, maxCapacity, organizer: req.user._id });
    res.status(201).json(event);
  } catch (err) { next(err); }
};

exports.getEvents = async (req, res, next) => {
  try {
    res.json(await Event.find().populate('organizer', 'name').sort({ date: 1 }));
  } catch (err) { next(err); }
};

exports.getEvent = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id).populate('organizer', 'name');
    if (!event) return res.status(404).json({ message: 'Event not found' });
    res.json(event);
  } catch (err) { next(err); }
};

// Only the organizer who created the event can edit/delete/view participants
const findOwnEvent = async (req, res) => {
  const event = await Event.findById(req.params.id);
  if (!event) { res.status(404).json({ message: 'Event not found' }); return null; }
  if (event.organizer.toString() !== req.user._id.toString()) {
    res.status(403).json({ message: 'You can only manage your own events' }); return null;
  }
  return event;
};

exports.updateEvent = async (req, res, next) => {
  try {
    const event = await findOwnEvent(req, res);
    if (!event) return;
    const { title, description, venue, date, maxCapacity } = req.body;
    if (maxCapacity !== undefined && Number(maxCapacity) < event.registeredCount) {
      return res.status(400).json({ message: `Capacity cannot be less than already registered (${event.registeredCount})` });
    }
    const changes = { title, description, venue, date, maxCapacity };
    Object.keys(changes).forEach((k) => { if (changes[k] !== undefined) event[k] = changes[k]; });
    await event.save(); // validators run again
    res.json(event);
  } catch (err) { next(err); }
};

exports.deleteEvent = async (req, res, next) => {
  try {
    const event = await findOwnEvent(req, res);
    if (!event) return;
    await Registration.deleteMany({ event: event._id }); // remove its registrations too
    await event.deleteOne();
    res.json({ message: 'Event deleted' });
  } catch (err) { next(err); }
};

// ---------- Registration (student) ----------
exports.registerForEvent = async (req, res, next) => {
  try {
    const { phone, department, year } = req.body;
    const eventId = req.params.id;

    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ message: 'Event not found' });
    if (new Date(event.date) < new Date()) return res.status(400).json({ message: 'This event has already happened' });

    if (await Registration.findOne({ event: eventId, student: req.user._id })) {
      return res.status(409).json({ message: 'You are already registered for this event' });
    }

    // Validate the form BEFORE taking a seat
    const registration = new Registration({ event: eventId, student: req.user._id, phone, department, year });
    await registration.validate();

    // CAPACITY CHECK: one atomic database operation.
    // "Add 1 to registeredCount ONLY IF registeredCount < maxCapacity".
    // Even if 100 students click at the same instant, the limit can never be crossed.
    const updated = await Event.findOneAndUpdate(
      { _id: eventId, $expr: { $lt: ['$registeredCount', '$maxCapacity'] } },
      { $inc: { registeredCount: 1 } },
      { new: true }
    );
    if (!updated) return res.status(400).json({ message: 'Registration closed: event is full' });

    try {
      await registration.save();
    } catch (err) {
      await Event.findByIdAndUpdate(eventId, { $inc: { registeredCount: -1 } }); // give the seat back
      throw err;
    }
    res.status(201).json({ message: 'Registered successfully', registration, event: updated });
  } catch (err) { next(err); }
};

exports.cancelRegistration = async (req, res, next) => {
  try {
    const reg = await Registration.findOneAndDelete({ event: req.params.id, student: req.user._id });
    if (!reg) return res.status(404).json({ message: 'You are not registered for this event' });
    await Event.findByIdAndUpdate(req.params.id, { $inc: { registeredCount: -1 } });
    res.json({ message: 'Registration cancelled' });
  } catch (err) { next(err); }
};

exports.myRegistrations = async (req, res, next) => {
  try {
    res.json(await Registration.find({ student: req.user._id }).populate('event', 'title date venue'));
  } catch (err) { next(err); }
};

// Organizer views the participant list of their own event
exports.getParticipants = async (req, res, next) => {
  try {
    const event = await findOwnEvent(req, res);
    if (!event) return;
    const participants = await Registration.find({ event: event._id }).populate('student', 'name email').sort({ createdAt: 1 });
    res.json({ event: { id: event._id, title: event.title, registeredCount: event.registeredCount, maxCapacity: event.maxCapacity }, participants });
  } catch (err) { next(err); }
};
