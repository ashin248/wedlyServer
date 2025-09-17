
const express = require('express');
const router = express.Router();
const User = require('../Schema/User');
const bcrypt = require('bcrypt');

router.post('/', async (req, res) => {
  try {
    const { email, mobile, password } = req.body;
    if (!email || !mobile || !password) {
      return res.status(400).json({ message: 'Email, mobile, and password are required' });
    }

    const user = await User.findOne({ email, mobile });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    req.session.user = {
      _id: user._id.toString(),
      name: user.name,
      email: user.email,
      mobile: user.mobile,
      DpImage: user.DpImage,
    };
    console.log('Session set after login:', req.session.user);

    res.status(200).json({ message: 'Login successful' });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;