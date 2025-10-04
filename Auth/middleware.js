const express = require('express');
const router = express.Router();
const checkAuth = require('./checkAuth');

router.get('/', checkAuth, (req, res) => {
  try {
    console.log('Middleware success for user:', req.session.user._id);
    res.status(200).json({ 
      message: 'User is authenticated', 
      user: {
        _id: req.session.user._id,
        name: req.session.user.name,
        email: req.session.user.email
      }
    });
  } catch (err) {
    console.error('Middleware error:', err.message, err.stack);
    res.status(500).json({ message: 'Server error during authentication check' });
  }
});

module.exports = router;


// const express = require('express');
// const router = express.Router();
// const checkAuth = require('./checkAuth');

// router.get('/', checkAuth, (req, res) => {
//   try {
//     res.status(200).json({ 
//       message: 'User is authenticated', 
//       user: {
//         _id: req.session.user._id,
//         name: req.session.user.name,
//         email: req.session.user.email
//       }
//     });
//   } catch (err) {
//     console.error('Middleware error:', err.message, err.stack);
//     res.status(500).json({ message: 'Server error during authentication check' });
//   }
// });

// module.exports = router;