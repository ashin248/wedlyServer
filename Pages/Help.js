const express = require('express');
const SupportSchema = require('../Schema/AdminSupport');
const User = require('../Schema/User');
const checkAuth = require('../Auth/checkAuth');
const adminAuth = require('../Auth/AdminAuth');

const help = express.Router();

// User submits support message
help.post('/', checkAuth, async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }
    const user = req.session.user;
    const support = new SupportSchema({
      email: user.email,
      mobile: user.mobile,
      message,
      userId: user._id
    });
    await support.save();
    res.status(201).json({ message: 'Support request submitted successfully' });
  } catch (error) {
    console.error('Error submitting support request:', error);
    res.status(500).json({ error: 'Failed to submit support request' });
  }
});

// Admin fetches all support requests
help.get('/', adminAuth, async (req, res) => {
  try {
    const supports = await SupportSchema.find().populate('userId', 'name mobile');
    res.status(200).json(supports);
  } catch (error) {
    console.error('Error fetching support requests:', error);
    res.status(500).json({ error: 'Failed to fetch support requests' });
  }
});

// Admin marks support as handled
help.post('/checkedThaDataBtn', adminAuth, async (req, res) => {
  try {
    const { id } = req.body;
    if (!id) {
      return res.status(400).json({ error: 'ID is required' });
    }
    const support = await SupportSchema.findById(id);
    if (!support) {
      return res.status(404).json({ error: 'Support request not found' });
    }
    support.supported = true;
    await support.save();
    res.status(200).json({ message: 'Support request marked as supported' });
  } catch (error) {
    console.error('Error marking support as supported:', error);
    res.status(500).json({ error: 'Failed to mark as supported' });
  }
});

module.exports = help;