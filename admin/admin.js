const express = require('express');
const bcrypt = require('bcrypt');
const { body, validationResult } = require('express-validator');
const Admin = require('../Schema/admin');
const User = require('../Schema/User');
const Report = require('../Schema/Report');
const HistoryOfRemoveAccount = require('../Schema/HistoryOfRemoveAccount');

const admin = express.Router();

// Hardcoded admin credentials for initial setup
const adminEmail = 'admin@hmail.com';
const adminPassword = 'admin123';

// Create admin if not exists
async function createAdminIfNotExists() {
    try {
        const existingAdmin = await Admin.findOne({ email: adminEmail });
        if (!existingAdmin) {
            const hashedPassword = await bcrypt.hash(adminPassword, 10);
            const newAdmin = new Admin({
                email: adminEmail,
                password: hashedPassword,
            });
            await newAdmin.save();
            console.log('Admin user created successfully.');
        }
    } catch (error) {
        console.error('Error creating admin:', error);
    }
}

createAdminIfNotExists();

// Middleware to check admin authentication
const checkAdminAuth = (req, res, next) => {
    if (!req.session || !req.session.admin) {
        console.log('Admin authentication failed: No session or admin data');
        return res.status(401).json({ message: 'Unauthorized: Admin access required' });
    }
    next();
};

// Custom error handler
const handleErrors = (err, req, res, next) => {
    console.error('Admin route error:', err);
    res.status(500).json({ message: 'Server error occurred' });
};

// Admin login route with validation
admin.post(
    '/login',
    [
        body('email').isEmail().withMessage('Invalid email format'),
        body('password').notEmpty().withMessage('Password is required'),
    ],
    async (req, res, next) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array().map(err => err.msg) });
            }

            const { email, password } = req.body;
            const adminUser = await Admin.findOne({ email });
            if (!adminUser) {
                console.log('Admin login failed: No admin found for email', email);
                return res.status(401).json({ message: 'Invalid credentials' });
            }

            const isMatch = await bcrypt.compare(password, adminUser.password);
            if (!isMatch) {
                console.log('Admin login failed: Incorrect password for', email);
                return res.status(401).json({ message: 'Invalid credentials' });
            }

            req.session.admin = { id: adminUser._id, email: adminUser.email };
            console.log('Admin login successful:', email);
            res.status(200).json({ message: 'Login successful' });
        } catch (error) {
            next(error);
        }
    }
);

// Admin logout route
admin.post('/logout', checkAdminAuth, (req, res, next) => {
    try {
        req.session.destroy((err) => {
            if (err) {
                console.error('Session destroy error:', err);
                return res.status(500).json({ message: 'Failed to log out' });
            }
            res.status(200).json({ message: 'Logout successful' });
        });
    } catch (error) {
        next(error);
    }
});

// Admin dashboard data route
admin.get('/home', checkAdminAuth, async (req, res, next) => {
    try {
        // Get total users
        const totalUsers = await User.countDocuments();

        // Get user counts by gender
        const genderCounts = await User.aggregate([
            { $group: { _id: '$gender', count: { $sum: 1 } } },
        ]);
        const genders = {
            Man: 0,
            Woman: 0,
            TransgenderMan: 0,
            TransgenderWoman: 0,
            'Non-Binary': 0,
        };
        genderCounts.forEach(item => {
            if (item._id) {
                genders[item._id] = item.count;
            }
        });

        res.status(200).json({
            totalUsers,
            genders,
        });
    } catch (error) {
        next(error);
    }
});

// Admin reports route
admin.get('/reports', checkAdminAuth, async (req, res, next) => {
    try {
        const reports = await Report.aggregate([
            {
                $group: {
                    _id: '$reportedUser',
                    count: { $sum: 1 },
                    reports: { $push: '$$ROOT' },
                },
            },
            {
                $lookup: {
                    from: 'users',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'reportedUser',
                },
            },
            { $unwind: '$reportedUser' },
            {
                $lookup: {
                    from: 'users',
                    localField: 'reports.reporter',
                    foreignField: '_id',
                    as: 'reporters',
                },
            },
            {
                $project: {
                    _id: 1,
                    count: 1,
                    'reportedUser._id': 1,
                    'reportedUser.name': 1,
                    'reportedUser.DpImage': 1,
                    reports: {
                        $map: {
                            input: '$reports',
                            as: 'report',
                            in: {
                                message: '$$report.message',
                                createdAt: '$$report.createdAt',
                                reporter: {
                                    $arrayElemAt: [
                                        {
                                            $filter: {
                                                input: '$reporters',
                                                as: 'r',
                                                cond: { $eq: ['$$r._id', '$$report.reporter'] },
                                            },
                                        },
                                        0,
                                    ],
                                },
                            },
                        },
                    },
                },
            },
        ]);

        res.status(200).json(reports);
    } catch (error) {
        console.error('Error fetching reports:', error);
        next(error);
    }
});

// Admin blocks route
admin.get('/blocks', checkAdminAuth, async (req, res, next) => {
    try {
        const blocks = await User.aggregate([
            { $unwind: '$blockedUsers' },
            {
                $group: {
                    _id: '$blockedUsers',
                    count: { $sum: 1 },
                },
            },
            {
                $lookup: {
                    from: 'users',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'blockedUser',
                },
            },
            { $unwind: '$blockedUser' },
            {
                $project: {
                    _id: 1,
                    count: 1,
                    'blockedUser.name': 1,
                    'blockedUser.DpImage': 1,
                },
            },
        ]);

        res.status(200).json(blocks);
    } catch (error) {
        console.error('Error fetching blocks:', error);
        next(error);
    }
});

// Admin history route
admin.get('/history', checkAdminAuth, async (req, res, next) => {
    try {
        const history = await HistoryOfRemoveAccount.find()
            .populate('deletedBy', 'email')
            .sort({ deletedAt: -1 })
            .exec();
        res.status(200).json(history);
    } catch (error) {
        console.error('Error fetching deletion history:', error);
        next(error);
    }
});

// Admin remove user route
admin.post('/remove/:userId', checkAdminAuth, async (req, res, next) => {
    try {
        const { userId } = req.params;
        const adminId = req.session.admin.id;

        const user = await User.findById(userId).exec();
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const reports = await Report.find({ reportedUser: userId })
            .populate('reporter', 'name email mobile Address')
            .exec();

        const historyEntry = new HistoryOfRemoveAccount({
            userId: user._id,
            name: user.name || 'Unknown',
            email: user.email || 'Not provided',
            userDetails: {
                name: user.name || 'Unknown',
                email: user.email || 'Not provided',
                mobile: user.mobile || 'Not provided',
                DpImage: user.DpImage || '',
                profileImage: user.profileImage || '',
                country: user.country || 'Not provided',
                state: user.state || 'Not provided',
                district: user.district || 'Not provided',
                religion: user.religion || 'Not provided',
                Address: user.Address || 'Not provided',
                branch: user.branch || 'Not provided',
                caste: user.caste || 'Not provided',
                previousReligion: user.previousReligion || 'Not provided',
                previousReligionBranch: user.previousReligionBranch || 'Not provided',
                familyReligion: user.familyReligion || 'Not provided',
                familyReligionBranch: user.familyReligionBranch || 'Not provided',
                certificateReligion: user.certificateReligion || 'Not provided',
                currentPlace: user.currentPlace || [],
                gender: user.gender || 'Not provided',
                orientation: user.orientation || 'Not provided',
                maritalStatus: user.maritalStatus || 'Not provided',
                dob: user.dob || null,
                height: user.height || 'Not provided',
                weight: user.weight || 'Not provided',
                education: user.education || 'Not provided',
                profession: user.profession || 'Not provided',
                income: user.income || 'Not provided',
                languages: user.languages || 'Not provided',
                habits: user.habits || 'Not provided',
                diet: user.diet || 'Not provided',
                partnerExpectations: user.partnerExpectations || 'Not provided',
                disability: user.disability || 'Not provided',
                relocate: user.relocate || 'Not provided',
                familyDetails: user.familyDetails || 'Not provided',
                horoscope: user.horoscope || 'Not provided',
            },
            reportCount: reports.length,
            reports: reports.map(report => ({
                reporter: {
                    _id: report.reporter?._id || 'Unknown',
                    name: report.reporter?.name || 'Unknown',
                    email: report.reporter?.email || 'Not provided',
                    mobile: report.reporter?.mobile || 'Not provided',
                    Address: report.reporter?.Address || 'Not provided',
                },
                message: report.message || 'No message',
                createdAt: report.createdAt || new Date(),
            })),
            deletedBy: adminId,
            reason: req.body.reason || 'No reason provided',
        });
        await historyEntry.save();

        await User.findByIdAndDelete(userId);

        await Report.deleteMany({
            $or: [{ reportedUser: userId }, { reporter: userId }],
        });

        await User.updateMany(
            {
                $or: [
                    { sentInterests: userId },
                    { receivedInterests: userId },
                    { acceptedInterests: userId },
                    { blockedUsers: userId },
                ],
            },
            {
                $pull: {
                    sentInterests: userId,
                    receivedInterests: userId,
                    acceptedInterests: userId,
                    blockedUsers: userId,
                },
            }
        );

        res.status(200).json({ message: 'User account removed successfully' });
    } catch (error) {
        next(error);
    }
});

admin.use(handleErrors);

module.exports = admin;