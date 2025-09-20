const checkAuth = (req, res, next) => {
  console.log('checkAuth - Session:', req.session, 'User:', req.session.user);
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