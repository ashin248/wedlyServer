const express = require('express')
const Setting = express.Router()
const bcrypt = require('bcrypt')

const User = require('../Schema/User')
const checkAuth = require('../Auth/checkAuth');

// Apply the authentication middleware to all routes in this router
Setting.use(checkAuth);

Setting.get('/', async (req, res) => {
    try {
        const userId = req.session.user._id;
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        // Note: The User schema provided does not have fields for notifications.
        // This is a placeholder response assuming these fields exist.
        const settings = {
            emailNotifications: user.emailNotifications,
            smsNotifications: user.smsNotifications,
        };

        res.status(200).json(settings);
    } catch (err) {
        console.error('Error fetching settings:', err);
        res.status(500).json({ message: 'Failed to load settings.' });
    }
})

Setting.post('/change-password', async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        const userId = req.session.user._id;

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        const isMatch = await bcrypt.compare(currentPassword, user.password);

        if (!isMatch) {
            return res.status(401).json({ message: 'Incorrect current password.' });
        }

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);

        await user.save();

        res.status(200).json({ message: 'Password updated successfully!' });

    } catch (err) {
        console.error('Password change error:', err);
        res.status(500).json({ message: 'Failed to update password. Server error.' });
    }
})

Setting.post('/notifications', async (req, res) => {
    try {
        const { emailNotifications, smsNotifications } = req.body;

        const userId = req.session.user._id;

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        // Note: The User schema provided does not have `emailNotifications` or `smsNotifications` fields.
        // This code assumes those fields are added to the User model.
        user.emailNotifications = emailNotifications;
        user.smsNotifications = smsNotifications;

        await user.save();

        res.status(200).json({ message: 'Notification settings updated!' });

    } catch (err) {
        console.error('Notification settings error:', err);
        res.status(500).json({ message: 'Failed to update notification settings.' });
    }
})

Setting.delete('/delete-account', async (req, res) => {
    try {
        const userId = req.session.user._id;

        const result = await User.findByIdAndDelete(userId);

        if (!result) {
            return res.status(404).json({ message: 'User not found.' });
        }

        res.status(200).json({ message: 'Account deleted successfully.' });

    } catch (err) {
        console.error('Account deletion error:', err);
        res.status(500).json({ message: 'Failed to delete account.' });
    }
})

module.exports = Setting