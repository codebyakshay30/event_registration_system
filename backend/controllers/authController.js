const jwt = require('jsonwebtoken');
const User = require('../models/User');

const makeToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
const send = (res, status, user) =>
  res.status(status).json({ token: makeToken(user._id), user: { id: user._id, name: user.name, email: user.email, role: user.role } });

exports.register = async (req, res, next) => {
  try {
    const { name, email, password, role, organizerCode } = req.body;
    if (role === 'organizer' && (!process.env.ORGANIZER_CODE || organizerCode !== process.env.ORGANIZER_CODE)) {
      return res.status(403).json({ message: 'Invalid organizer code' });
    }
    if (await User.findOne({ email })) return res.status(409).json({ message: 'Email already registered' });
    const user = await User.create({ name, email, password, role: role === 'organizer' ? 'organizer' : 'student' });
    send(res, 201, user);
  } catch (err) { next(err); }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Email and password are required' });
    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.matchPassword(password))) return res.status(401).json({ message: 'Invalid email or password' });
    send(res, 200, user);
  } catch (err) { next(err); }
};

exports.me = (req, res) => res.json({ user: req.user });
