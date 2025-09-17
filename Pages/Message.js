const express = require('express');
const router = express.Router();
const checkAuth = require('../Auth/checkAuth');
const User = require('../Schema/User');
const Message = require('../Schema/Message');
const path = require('path');
const multer = require('multer');
const fs = require('fs');

// Ensure upload directories exist
const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};
ensureDir(path.join(__dirname, '../Uploads/images'));
ensureDir(path.join(__dirname, '../Uploads/audio'));

// Multer storage configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    if (file.mimetype.startsWith('image/')) {
      cb(null, 'Uploads/images/');
    } else if (file.mimetype.startsWith('audio/')) {
      cb(null, 'Uploads/audio/');
    } else {
      cb(new Error('Unsupported file type'), null);
    }
  },
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedImageTypes = ['image/jpeg', 'image/png', 'image/gif'];
    const allowedAudioTypes = ['audio/webm', 'audio/mpeg', 'audio/wav'];
    if (allowedImageTypes.includes(file.mimetype) || allowedAudioTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, GIF, WEBM, MP3, and WAV are allowed.'), false);
    }
  },
});

// Exponential backoff for database queries
const exponentialBackoff = async (fn, retries = 3, delay = 100) => {
  const maxDelay = 2000;
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i < retries - 1) {
        console.warn(`Retry ${i + 1}/${retries} after ${delay}ms:`, error.message);
        await new Promise((res) => setTimeout(res, Math.min(delay, maxDelay)));
        delay = Math.min(delay * 2, maxDelay);
      } else {
        throw error;
      }
    }
  }
};

// Get interested users
router.get('/', checkAuth, async (req, res) => {
  try {
    console.log('Get Interests - User ID:', req.session.user._id);
    const user = await exponentialBackoff(() =>
      User.findById(req.session.user._id).populate('acceptedInterests', 'name DpImage').exec()
    );

    if (!user) {
      console.log('User not found for ID:', req.session.user._id);
      return res.status(404).json({ error: 'User not found.' });
    }

    const interestedUsers = (user.acceptedInterests || [])
      .filter((interestUser) => !user.blockedUsers.includes(interestUser._id))
      .map((u) => ({
        id: u._id.toString(),
        name: u.name,
        DpImage: u.DpImage || `https://placehold.co/40x40/FF69B4/FFFFFF?text=${u.name?.substring(0, 2).toUpperCase() || '?'}`,
      }));

    console.log('Pending Interests: 0 Accepted Interests:', interestedUsers.length);
    res.status(200).json(interestedUsers);
  } catch (error) {
    console.error('Error fetching interested users:', error.message, error.stack);
    res.status(500).json({ error: 'Failed to fetch interested users.' });
  }
});

// Get conversation with a specific user
router.get('/conversation/:partnerId', checkAuth, async (req, res) => {
  try {
    const senderId = req.session.user._id;
    const receiverId = req.params.partnerId;

    const [currentUser, partnerUser] = await Promise.all([
      exponentialBackoff(() => User.findById(senderId).exec()),
      exponentialBackoff(() => User.findById(receiverId).exec()),
    ]);

    if (!currentUser || !partnerUser) {
      console.log('User not found:', { senderId, receiverId });
      return res.status(404).json({ error: 'User not found.' });
    }

    if (!currentUser.acceptedInterests.includes(receiverId)) {
      return res.status(403).json({ error: 'Cannot view conversation: User is not an accepted interest.' });
    }

    if (currentUser.blockedUsers.includes(receiverId) || partnerUser.blockedUsers.includes(senderId)) {
      return res.status(403).json({ error: 'Cannot view conversation: User is blocked.' });
    }

    const messages = await exponentialBackoff(() =>
      Message.find({
        $or: [
          { senderId, receiverId },
          { senderId: receiverId, receiverId: senderId },
        ],
      }).sort({ timestamp: 1 }).exec()
    );

    res.status(200).json(messages);
  } catch (error) {
    console.error('Error fetching conversation:', error.message, error.stack);
    res.status(500).json({ error: 'Failed to fetch conversation.' });
  }
});

// Poll for new messages
router.get('/poll/:partnerId', checkAuth, async (req, res) => {
  const senderId = req.session.user._id;
  const receiverId = req.params.partnerId;
  const timeoutMs = 15000;
  const pollIntervalMs = 1000;

  try {
    const [currentUser, partnerUser] = await Promise.all([
      exponentialBackoff(() => User.findById(senderId).exec()),
      exponentialBackoff(() => User.findById(receiverId).exec()),
    ]);

    if (!currentUser || !partnerUser) {
      return res.status(404).json({ error: 'User not found.' });
    }

    if (!currentUser.acceptedInterests.includes(receiverId)) {
      return res.status(403).json({ error: 'Cannot poll messages: User is not an accepted interest.' });
    }

    if (currentUser.blockedUsers.includes(receiverId) || partnerUser.blockedUsers.includes(senderId)) {
      return res.status(403).json({ error: 'Cannot poll messages: User is blocked.' });
    }

    const startTime = Date.now();
    const lastChecked = req.query.lastChecked ? new Date(parseInt(req.query.lastChecked)) : new Date(0);

    const checkForMessages = async () => {
      try {
        const messages = await Message.find({
          $or: [
            { senderId, receiverId, timestamp: { $gt: lastChecked } },
            { senderId: receiverId, receiverId: senderId, timestamp: { $gt: lastChecked } },
          ],
        }).sort({ timestamp: 1 }).exec();

        if (messages.length > 0) {
          const latestTimestamp = messages[messages.length - 1].timestamp.getTime();
          return res.status(200).json({ messages, lastChecked: latestTimestamp });
        }

        if (Date.now() - startTime >= timeoutMs) {
          return res.status(204).json({ messages: [], lastChecked });
        }

        setTimeout(checkForMessages, pollIntervalMs);
      } catch (error) {
        console.error('Error polling messages:', error.message, error.stack);
        res.status(500).json({ error: 'Failed to poll messages.' });
      }
    };

    checkForMessages();
  } catch (error) {
    console.error('Error initiating poll:', error.message, error.stack);
    res.status(500).json({ error: 'Failed to initiate polling.' });
  }
});

// Send text message
router.post('/', checkAuth, async (req, res) => {
  try {
    const { receiverId, text } = req.body;
    const senderId = req.session.user._id;

    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'Message text is required.' });
    }

    if (senderId === receiverId) {
      return res.status(400).json({ error: 'Cannot send message to self.' });
    }

    const [currentUser, partnerUser] = await Promise.all([
      exponentialBackoff(() => User.findById(senderId).exec()),
      exponentialBackoff(() => User.findById(receiverId).exec()),
    ]);

    if (!currentUser || !partnerUser) {
      return res.status(404).json({ error: 'User not found.' });
    }

    if (!currentUser.acceptedInterests.includes(receiverId)) {
      return res.status(403).json({ error: 'Cannot send message: User is not an accepted interest.' });
    }

    if (currentUser.blockedUsers.includes(receiverId) || partnerUser.blockedUsers.includes(senderId)) {
      return res.status(403).json({ error: 'Cannot send message: User is blocked.' });
    }

    const newMessage = new Message({
      senderId,
      receiverId,
      text,
    });
    await exponentialBackoff(() => newMessage.save());
    res.status(201).json(newMessage);
  } catch (error) {
    console.error('Error sending message:', error.message, error.stack);
    res.status(500).json({ error: 'Failed to send message.' });
  }
});

// Send voice message
router.post('/messageVoice', checkAuth, upload.single('audio'), async (req, res) => {
  try {
    const { receiverId } = req.body;
    const senderId = req.session.user._id;
    const audioPath = req.file ? `Uploads/audio/${req.file.filename}` : null;

    if (!audioPath) {
      return res.status(400).json({ error: 'No audio file uploaded.' });
    }

    if (senderId === receiverId) {
      return res.status(400).json({ error: 'Cannot send message to self.' });
    }

    const [currentUser, partnerUser] = await Promise.all([
      exponentialBackoff(() => User.findById(senderId).exec()),
      exponentialBackoff(() => User.findById(receiverId).exec()),
    ]);

    if (!currentUser || !partnerUser) {
      return res.status(404).json({ error: 'User not found.' });
    }

    if (!currentUser.acceptedInterests.includes(receiverId)) {
      return res.status(403).json({ error: 'Cannot send voice message: User is not an accepted interest.' });
    }

    if (currentUser.blockedUsers.includes(receiverId) || partnerUser.blockedUsers.includes(senderId)) {
      return res.status(403).json({ error: 'Cannot send voice message: User is blocked.' });
    }

    const newMessage = new Message({
      senderId,
      receiverId,
      audioPath,
    });
    await exponentialBackoff(() => newMessage.save());
    res.status(201).json(newMessage);
  } catch (error) {
    console.error('Error sending voice message:', error.message, error.stack);
    res.status(500).json({ error: 'Failed to send voice message.' });
  }
});

// Send image message
router.post('/messageImage', checkAuth, upload.single('image'), async (req, res) => {
  try {
    const { receiverId } = req.body;
    const senderId = req.session.user._id;
    const imagePath = req.file ? `Uploads/images/${req.file.filename}` : null;

    if (!imagePath) {
      return res.status(400).json({ error: 'No image file uploaded.' });
    }

    if (senderId === receiverId) {
      return res.status(400).json({ error: 'Cannot send message to self.' });
    }

    const [currentUser, partnerUser] = await Promise.all([
      exponentialBackoff(() => User.findById(senderId).exec()),
      exponentialBackoff(() => User.findById(receiverId).exec()),
    ]);

    if (!currentUser || !partnerUser) {
      return res.status(404).json({ error: 'User not found.' });
    }

    if (!currentUser.acceptedInterests.includes(receiverId)) {
      return res.status(403).json({ error: 'Cannot send image message: User is not an accepted interest.' });
    }

    if (currentUser.blockedUsers.includes(receiverId) || partnerUser.blockedUsers.includes(senderId)) {
      return res.status(403).json({ error: 'Cannot send image message: User is blocked.' });
    }

    const newMessage = new Message({
      senderId,
      receiverId,
      imagePath,
    });
    await exponentialBackoff(() => newMessage.save());
    res.status(201).json(newMessage);
  } catch (error) {
    console.error('Error sending image message:', error.message, error.stack);
    res.status(500).json({ error: 'Failed to send image message.' });
  }
});

// Initiate a call
router.post('/call/initiate', checkAuth, async (req, res) => {
  try {
    const { receiverId, callType, offer } = req.body;
    const senderId = req.session.user._id;

    if (!['audio', 'video'].includes(callType)) {
      return res.status(400).json({ error: 'Invalid call type.' });
    }

    if (senderId === receiverId) {
      return res.status(400).json({ error: 'Cannot initiate call to self.' });
    }

    const [currentUser, partnerUser] = await Promise.all([
      exponentialBackoff(() => User.findById(senderId).exec()),
      exponentialBackoff(() => User.findById(receiverId).exec()),
    ]);

    if (!currentUser || !partnerUser) {
      return res.status(404).json({ error: 'User not found.' });
    }

    if (!currentUser.acceptedInterests.includes(receiverId)) {
      return res.status(403).json({ error: 'Cannot initiate call: User is not an accepted interest.' });
    }

    if (currentUser.blockedUsers.includes(receiverId) || partnerUser.blockedUsers.includes(senderId)) {
      return res.status(403).json({ error: 'Cannot initiate call: User is blocked.' });
    }

    const callMessage = new Message({
      senderId,
      receiverId,
      callType,
      callStart: new Date(),
      sdp: { offer },
    });
    await exponentialBackoff(() => callMessage.save());

    res.status(201).json({ callId: callMessage._id });
  } catch (error) {
    console.error('Error initiating call:', error.message, error.stack);
    res.status(500).json({ error: 'Failed to initiate call.' });
  }
});

// Send WebRTC answer
router.post('/call/answer', checkAuth, async (req, res) => {
  try {
    const { callId, answer } = req.body;
    const senderId = req.session.user._id;

    const callMessage = await exponentialBackoff(() => Message.findById(callId).exec());
    if (!callMessage) {
      return res.status(404).json({ error: 'Call not found.' });
    }

    if (callMessage.receiverId.toString() !== senderId) {
      return res.status(403).json({ error: 'Unauthorized to answer this call.' });
    }

    callMessage.sdp = { ...callMessage.sdp, answer };
    await exponentialBackoff(() => callMessage.save());

    res.status(200).json({ message: 'Answer saved.' });
  } catch (error) {
    console.error('Error sending call answer:', error.message, error.stack);
    res.status(500).json({ error: 'Failed to send call answer.' });
  }
});

// Reject a call
router.post('/call/reject', checkAuth, async (req, res) => {
  try {
    const { callId } = req.body;
    const senderId = req.session.user._id;

    const callMessage = await exponentialBackoff(() => Message.findById(callId).exec());
    if (!callMessage) {
      return res.status(404).json({ error: 'Call not found.' });
    }

    if (callMessage.receiverId.toString() !== senderId) {
      return res.status(403).json({ error: 'Unauthorized to reject this call.' });
    }

    callMessage.callRejected = true;
    await exponentialBackoff(() => callMessage.save());

    res.status(200).json({ message: 'Call rejected.' });
  } catch (error) {
    console.error('Error rejecting call:', error.message, error.stack);
    res.status(500).json({ error: 'Failed to reject call.' });
  }
});

// Exchange ICE candidates
router.post('/call/ice-candidate', checkAuth, async (req, res) => {
  try {
    const { callId, candidate } = req.body;
    const senderId = req.session.user._id;

    const callMessage = await exponentialBackoff(() => Message.findById(callId).exec());
    if (!callMessage) {
      return res.status(404).json({ error: 'Call not found.' });
    }

    if (![callMessage.senderId.toString(), callMessage.receiverId.toString()].includes(senderId)) {
      return res.status(403).json({ error: 'Unauthorized to exchange ICE candidates.' });
    }

    callMessage.lastCandidate = candidate;
    await exponentialBackoff(() => callMessage.save());

    res.status(200).json({ message: 'ICE candidate saved.' });
  } catch (error) {
    console.error('Error exchanging ICE candidate:', error.message, error.stack);
    res.status(500).json({ error: 'Failed to exchange ICE candidate.' });
  }
});

// Poll ICE candidates
router.get('/call/ice-candidate', checkAuth, async (req, res) => {
  try {
    const { callId } = req.query;
    const senderId = req.session.user._id;

    const callMessage = await exponentialBackoff(() => Message.findById(callId).exec());
    if (!callMessage) {
      return res.status(404).json({ error: 'Call not found.' });
    }

    if (![callMessage.senderId.toString(), callMessage.receiverId.toString()].includes(senderId)) {
      return res.status(403).json({ error: 'Unauthorized to access ICE candidates.' });
    }

    res.status(200).json({ candidate: callMessage.lastCandidate });
  } catch (error) {
    console.error('Error fetching ICE candidate:', error.message, error.stack);
    res.status(500).json({ error: 'Failed to fetch ICE candidate.' });
  }
});

// Poll call answer
router.get('/call/answer', checkAuth, async (req, res) => {
  try {
    const { callId } = req.query;
    const senderId = req.session.user._id;

    const callMessage = await exponentialBackoff(() => Message.findById(callId).exec());
    if (!callMessage) {
      return res.status(404).json({ error: 'Call not found.' });
    }

    if (callMessage.senderId.toString() !== senderId) {
      return res.status(403).json({ error: 'Unauthorized to access call answer.' });
    }

    res.status(200).json({ answer: callMessage.sdp?.answer || null });
  } catch (error) {
    console.error('Error fetching call answer:', error.message, error.stack);
    res.status(500).json({ error: 'Failed to fetch call answer.' });
  }
});

// End a call
router.post('/call/end', checkAuth, async (req, res) => {
  try {
    const { callId } = req.body;
    const senderId = req.session.user._id;

    const callMessage = await exponentialBackoff(() => Message.findById(callId).exec());
    if (!callMessage) {
      return res.status(404).json({ error: 'Call not found.' });
    }

    if (![callMessage.senderId.toString(), callMessage.receiverId.toString()].includes(senderId)) {
      return res.status(403).json({ error: 'Unauthorized to end this call.' });
    }

    callMessage.callDuration = Math.floor((Date.now() - callMessage.callStart.getTime()) / 1000);
    await exponentialBackoff(() => callMessage.save());

    res.status(200).json({ message: 'Call ended.', callDuration: callMessage.callDuration });
  } catch (error) {
    console.error('Error ending call:', error.message, error.stack);
    res.status(500).json({ error: 'Failed to end call.' });
  }
});

module.exports = router;