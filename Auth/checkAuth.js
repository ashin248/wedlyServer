const checkAuth = (req, res, next) => {
  console.log('checkAuth - Session ID:', req.sessionID, 'Session exists:', !!req.session, 'User ID:', req.session?.user?._id || 'none');
  if (req.session && req.session.user && req.session.user._id) {
    return next();
  }
  console.log('checkAuth - 401: No valid user in session');
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