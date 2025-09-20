// const AdminAuth = (req, res, next) => {
//     if (!req.session || !req.session.admin) {
//         console.log('Admin authentication failed: No session or admin data');
//         return res.status(401).json({ message: 'Unauthorized: Admin access required' });
//     }
//     next();
// };

// module.exports = AdminAuth;


const checkAuth = (req, res, next) => {
    if (!req.session || !req.session.user) {
        console.log('Authentication failed: No session or user data');
        return res.status(401).json({ message: 'Unauthorized' });
    }
    next();
};

module.exports = checkAuth;