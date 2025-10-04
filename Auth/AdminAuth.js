
const AdminAuth = (req, res, next) => {
    console.log('AdminAuth - Session ID:', req.sessionID, 'Admin exists:', !!req.session?.admin);
    if (!req.session || !req.session.admin) {
        console.log('Admin authentication failed: No session or admin data');
        return res.status(401).json({ message: 'Unauthorized: Admin access required' });
    }
    next();
};

module.exports = AdminAuth;


// const AdminAuth = (req, res, next) => {
//     if (!req.session || !req.session.admin) {
//         console.log('Admin authentication failed: No session or admin data');
//         return res.status(401).json({ message: 'Unauthorized: Admin access required' });
//     }
//     next();
// };

// module.exports = AdminAuth;