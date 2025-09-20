const checkAuth = (req, res, next) => {
  // Safely check if the session and user exist before logging
  const userSessionInfo = req.session && req.session.user ? req.session.user : 'No user in session';
  console.log('checkAuth - Session:', req.session, 'User:', userSessionInfo);

  // Check for a valid session and user ID.
  // The session object must exist and contain a user object with an _id.
  if (req.session && req.session.user && req.session.user._id) {
    return next();
  }

  return res.status(401).json({ message: "Unauthorized. Please log in." });
};

module.exports = checkAuth;




// const checkAuth = (req, res, next) => {
//   console.log('checkAuth - Session:', req.session, 'User:', req.session.user);
//   if (req.session && req.session.user && req.session.user._id) {
//     return next();
//   }
//   return res.status(401).json({ message: "Unauthorized. Please log in." });
// };

// module.exports = checkAuth;