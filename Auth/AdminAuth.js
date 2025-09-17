const AdminAuth = (req, res, next) => {
    if (!req.session || !req.session.admin) {
        console.log('Admin authentication failed: No session or admin data');
        return res.status(401).json({ message: 'Unauthorized: Admin access required' });
    }
    next();
};

module.exports = AdminAuth;