const express = require("express");
const Notification = express.Router();
const checkAuth = require("../Auth/checkAuth");
const Message = require("../Schema/Message");
const User = require("../Schema/User");

// GET /notifications
Notification.get("/", checkAuth, async (req, res) => {
  try {
    const userId = req.session.user._id;

    // Get new (unviewed) messages count
    const newMessages = await Message.countDocuments({
      receiverId: userId,
      viewed: false
    });

    // Get new interests that are not yet seen
    const user = await User.findById(userId).select("receivedInterests");
    let newInterestsCount = 0;

    // If you want to track interests as "seen", store them separately
    // Here, assume we store seenInterests in session or DB
    const seenInterests = req.session.seenInterests || [];

    const unseenInterests = user.receivedInterests.filter(
      (id) => !seenInterests.includes(id.toString())
    );
    newInterestsCount = unseenInterests.length;

    res.json({
      messageCount: newMessages,
      likeCount: newInterestsCount,
      DpImage: userId.DpImage
    });
  } catch (err) {
    console.error("Notifications Error:", err);
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
});

// Mark messages as viewed (when user opens messages)
Notification.post("/mark-messages-viewed", checkAuth, async (req, res) => {
  try {
    const userId = req.session.user._id;
    await Message.updateMany({ receiverId: userId, viewed: false }, { viewed: true });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to mark messages viewed" });
  }
});

// Mark interests as seen (when user opens interest page)
Notification.post("/mark-interests-viewed", checkAuth, async (req, res) => {
  try {
    const userId = req.session.user._id;
    const user = await User.findById(userId).select("receivedInterests");

    // Save seen interests in session
    req.session.seenInterests = user.receivedInterests.map(id => id.toString());
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to mark interests viewed" });
  }
});

module.exports = Notification;
