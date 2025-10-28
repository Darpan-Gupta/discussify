const path = require('path');
const fs = require('fs');
const User = require('../models/User');

exports.updateProfile = async (req, res, next) => {
    try {
        const { username, bio } = req.body;

        if (username !== undefined && typeof username !== 'string') {
            const err = new Error('Invalid username');
            err.status = 400;
            throw err;
        }

        if (bio !== undefined && typeof bio !== 'string') {
            const err = new Error('Invalid bio');
            err.status = 400;
            throw err;
        }

        const user = await User.findById(req.user.id);
        if (!user) {
            const err = new Error('User not found');
            err.status = 404;
            throw err;
        }

        if (username !== undefined) user.username = username;
        if (bio !== undefined) user.bio = bio;

        await user.save();

        return res.json({ message: 'Profile updated successfully' });
    } catch (err) {
        return next(err);
    }
};

exports.uploadPicture = async (req, res, next) => {
    try {
        if (!req.file) {
            const err = new Error('No file uploaded');
            err.status = 400;
            throw err;
        }

        const user = await User.findById(req.user.id);
        if (!user) {
            const err = new Error('User not found');
            err.status = 404;
            throw err;
        }

        if (user.avatar && user.avatar.startsWith('uploads/')) {
            const oldPath = path.join(process.cwd(), 'server', user.avatar);
            fs.promises.unlink(oldPath).catch(() => { });
        }

        user.avatar = `uploads/${req.file.filename}`;
        await user.save();

        return res.json({ message: 'Profile picture uploaded successfully' });
    } catch (err) {
        return next(err);
    }
};


