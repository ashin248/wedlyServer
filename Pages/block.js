const express = require('express');
const block = express.Router();
const mongoose = require('mongoose');
const checkAuth = require('../Auth/checkAuth');
const User = require('../Schema/User');
const Report = require('../Schema/Report');

// GET /blockedUsers: Fetch list of blocked users
block.get('/blockedUsers', checkAuth, async (req, res) => {
  try {
    const userId = req.session.user?._id;
    console.log(`Fetching blocked users for user ${userId}`);

    if (!userId) {
      console.log('No user ID in session');
      return res.status(401).json({ message: 'Unauthorized: No user ID in session' });
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      console.log('Invalid user ID format:', userId);
      return res.status(400).json({ message: 'Invalid user ID format' });
    }

    const user = await User.findById(userId).select('blockedUsers');
    if (!user) {
      console.log(`User ${userId} not found`);
      return res.status(404).json({ message: 'User not found' });
    }

    const blockedUsers = await User.find({ _id: { $in: user.blockedUsers } }).select('name DpImage');
    console.log(`Found ${blockedUsers.length} blocked users for user ${userId}`);
    res.status(200).json(blockedUsers);
  } catch (err) {
    console.error('Error fetching blocked users:', err.message, err.stack);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /block/:userId: Block a user
block.post('/block/:userId', checkAuth, async (req, res) => {
  try {
    const userId = req.session.user?._id;
    const userToBlock = req.params.userId;
    console.log(`Attempting to block user ${userToBlock} by user ${userId}`);

    if (!userId || !userToBlock) {
      console.log('Missing user ID or userToBlock ID');
      return res.status(400).json({ message: 'User ID or user to block ID missing' });
    }

    if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(userToBlock)) {
      console.log('Invalid ID format:', { userId, userToBlock });
      return res.status(400).json({ message: 'Invalid user ID format' });
    }

    if (userId === userToBlock) {
      console.log('User attempted to block themselves');
      return res.status(400).json({ message: 'Cannot block yourself' });
    }

    const user = await User.findById(userId);
    if (!user) {
      console.log(`User ${userId} not found`);
      return res.status(404).json({ message: 'User not found' });
    }

    const userToBlockExists = await User.findById(userToBlock);
    if (!userToBlockExists) {
      console.log(`User to block ${userToBlock} not found`);
      return res.status(404).json({ message: 'User to block not found' });
    }

    if (user.blockedUsers.includes(userToBlock)) {
      console.log(`User ${userToBlock} already blocked by ${userId}`);
      return res.status(400).json({ message: 'User is already blocked' });
    }

    user.blockedUsers.push(userToBlock);
    await user.save();
    console.log(`User ${userToBlock} blocked successfully by ${userId}`);

    res.status(200).json({ message: 'User blocked successfully' });
  } catch (err) {
    console.error('Block error:', err.message, err.stack);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /unblock/:userId: Unblock a user
block.post('/unblock/:userId', checkAuth, async (req, res) => {
  try {
    const userId = req.session.user?._id;
    const userToUnblock = req.params.userId;
    console.log(`Attempting to unblock user ${userToUnblock} by user ${userId}`);

    if (!userId || !userToUnblock) {
      console.log('Missing user ID or userToUnblock ID');
      return res.status(400).json({ message: 'User ID or user to unblock ID missing' });
    }

    if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(userToUnblock)) {
      console.log('Invalid ID format:', { userId, userToUnblock });
      return res.status(400).json({ message: 'Invalid user ID format' });
    }

    const user = await User.findById(userId);
    if (!user) {
      console.log(`User ${userId} not found`);
      return res.status(404).json({ message: 'User not found' });
    }

    const initialLength = user.blockedUsers.length;
    user.blockedUsers = user.blockedUsers.filter(id => id.toString() !== userToUnblock);
    if (user.blockedUsers.length < initialLength) {
      await user.save();
      console.log(`User ${userToUnblock} unblocked successfully by ${userId}`);
      res.status(200).json({ message: 'User unblocked successfully' });
    } else {
      console.log(`User ${userToUnblock} was not blocked by ${userId}`);
      res.status(400).json({ message: 'User was not blocked' });
    }
  } catch (err) {
    console.error('Unblock error:', err.message, err.stack);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /report/:userId: Report a user
block.post('/report/:userId', checkAuth, async (req, res) => {
  try {
    const userId = req.session.user?._id;
    const userToReport = req.params.userId;
    const { message } = req.body;
    console.log(`Attempting to report user ${userToReport} by user ${userId}`);

    if (!userId || !userToReport) {
      console.log('Missing user ID or userToReport ID');
      return res.status(400).json({ message: 'User ID or user to report ID missing' });
    }

    if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(userToReport)) {
      console.log('Invalid ID format:', { userId, userToReport });
      return res.status(400).json({ message: 'Invalid user ID format' });
    }

    if (!message) {
      console.log('Report message missing');
      return res.status(400).json({ message: 'Report message is required' });
    }

    const userToReportExists = await User.findById(userToReport);
    if (!userToReportExists) {
      console.log(`User to report ${userToReport} not found`);
      return res.status(404).json({ message: 'User to report not found' });
    }

    const report = new Report({
      reportedUser: userToReport,
      reporter: userId,
      message,
    });
    await report.save();
    console.log(`User ${userToReport} reported successfully by ${userId}`);

    res.status(200).json({ message: 'Report submitted successfully' });
  } catch (err) {
    console.error('Report error:', err.message, err.stack);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = block;

