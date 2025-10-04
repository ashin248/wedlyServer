const express = require('express');
const router = express.Router();
const checkAuth = require('./checkAuth');
const User = require('../Schema/User');

router.get('/', checkAuth, async (req, res) => {
  try {
    const userId = req.session.user?._id;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized: User ID not found in session.' });
    }

    const userData = await User.findById(userId).select('name email mobile DpImage profileImage');

    if (!userData) {
      return res.status(404).json({ message: 'User not found.' });
    }

    res.status(200).json(userData);
  } catch (error) {
    console.error("Error fetching user data:", error);
    res.status(500).json({ message: 'Server error while fetching user data.' });
  }
});

module.exports = router;








// const express = require('express');
// const router = express.Router();
// const checkAuth = require('./checkAuth');
// const User = require('../Schema/User');

// router.get('/', checkAuth, async (req, res) => {
//   try {
//     const userId = req.session.user?._id;

//     if (!userId) {
//       return res.status(401).json({ message: 'Unauthorized: User ID not found in session.' });
//     }

//     const userData = await User.findById(userId).select('name email mobile DpImage profileImage');

//     if (!userData) {
//       return res.status(404).json({ message: 'User not found.' });
//     }

//     res.status(200).json(userData);
//   } catch (error) {
//     console.error("Error fetching user data:", error);
//     res.status(500).json({ message: 'Server error while fetching user data.' });
//   }
// });

// module.exports = router;