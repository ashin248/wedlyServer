const express = require('express');
const router = express.Router();
const checkAuth = require('../Auth/checkAuth');
const User = require('../Schema/User');

// 📌 Send Interest
router.post('/send/:receiverId', checkAuth, async (req, res) => {
  try {
    const senderId = req.session.user._id;
    const { receiverId } = req.params;

    if (!senderId || !receiverId) {
      return res.status(400).json({ message: "Sender or receiver ID is missing" });
    }


    if (senderId === receiverId) {
      return res.status(400).json({ message: "You cannot send interest to yourself" });
    }

    const sender = await User.findById(senderId);
    const receiver = await User.findById(receiverId);

    if (!sender || !receiver) {
      return res.status(404).json({ message: "User not found" });
    }

    if (sender.sentInterests.includes(receiverId)) {
      return res.status(400).json({ message: "Interest already sent" });
    }

    sender.sentInterests.push(receiverId);
    receiver.receivedInterests.push(senderId);

    await sender.save();
    await receiver.save();

    res.json({ message: "Interest sent successfully" });
  } catch (err) {
    console.error("Send Interest Error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// 📌 Accept / Unaccept Interest
router.post('/accept/:senderId', checkAuth, async (req, res) => {
  try {
    const receiverId = req.session.user._id;
    const { senderId } = req.params;

    console.log("Accept Interest - Sender ID:", senderId, "Receiver ID:", receiverId);

    const receiver = await User.findById(receiverId);
    const sender = await User.findById(senderId);

    if (!receiver || !sender) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!receiver.receivedInterests.includes(senderId) && !receiver.acceptedInterests.includes(senderId)) {
      return res.status(400).json({ message: "No pending or accepted interest from this user" });
    }

    if (receiver.acceptedInterests.includes(senderId)) {
      // Unaccept
      receiver.acceptedInterests = receiver.acceptedInterests.filter(id => id.toString() !== senderId);
      sender.acceptedInterests = sender.acceptedInterests.filter(id => id.toString() !== receiverId);

      // Put back into pending
      if (!receiver.receivedInterests.includes(senderId)) {
        receiver.receivedInterests.push(senderId);
      }
      if (!sender.sentInterests.includes(receiverId)) {
        sender.sentInterests.push(receiverId);
      }

      await receiver.save();
      await sender.save();
      return res.json({ message: "Interest unaccepted", accepted: false });
    } else {
      // Accept
      receiver.acceptedInterests.push(senderId);
      sender.acceptedInterests.push(receiverId);

      receiver.receivedInterests = receiver.receivedInterests.filter(id => id.toString() !== senderId);
      sender.sentInterests = sender.sentInterests.filter(id => id.toString() !== receiverId);

      await receiver.save();
      await sender.save();
      return res.json({ message: "Interest accepted", accepted: true });
    }
  } catch (err) {
    console.error("Accept Interest Error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// 📌 Reject Interest
router.post('/reject/:senderId', checkAuth, async (req, res) => {
  try {
    const receiverId = req.session.user._id;
    const { senderId } = req.params;

    console.log("Reject Interest - Sender ID:", senderId, "Receiver ID:", receiverId);

    const receiver = await User.findById(receiverId);
    const sender = await User.findById(senderId);

    if (!receiver || !sender) {
      return res.status(404).json({ message: "User not found" });
    }

    receiver.receivedInterests = receiver.receivedInterests.filter(id => id.toString() !== senderId);
    sender.sentInterests = sender.sentInterests.filter(id => id.toString() !== receiverId);

    await receiver.save();
    await sender.save();

    res.json({ message: "Interest rejected" });
  } catch (err) {
    console.error("Reject Interest Error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// 📌 Get All Received Interests
router.get('/', checkAuth, async (req, res) => {
  try {
    const userId = req.session.user._id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized: No user ID in session" });
    }

    console.log("Get Interests - User ID:", userId);

    const user = await User.findById(userId)
      .populate('receivedInterests', 'name DpImage gender age')
      .populate('acceptedInterests', 'name DpImage gender age');

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    console.log("Pending Interests:", user.receivedInterests.length, "Accepted Interests:", user.acceptedInterests.length);

    res.json({
      pending: user.receivedInterests || [],
      accepted: user.acceptedInterests || [],
      DpImage: user.DpImage || "",
    });
  } catch (err) {
    console.error("Get Interests Error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

module.exports = router;
