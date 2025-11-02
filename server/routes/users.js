const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const auth = require('../middlewares/authMiddleware');

const router = express.Router();

// @route   GET /api/v1/users
// @desc    Get all users
// @access  Public
router.get('/', async (req, res) => {
    try {
        const users = await User.find().select('-password').sort({ createdAt: -1 });
        res.json(users);
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/v1/users/:id
// @desc    Get user by ID
// @access  Public
router.get('/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(user);
    } catch (error) {
        console.error(error.message);
        if (error.kind === 'ObjectId') {
            return res.status(404).json({ message: 'User not found' });
        }
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   PUT /api/v1/users/:id
// @desc    Update user profile
// @access  Private
router.put('/:id', [
    auth,
    body('username').optional().isLength({ min: 3 }).withMessage('Username must be at least 3 characters long'),
    body('email').optional().isEmail().withMessage('Please provide a valid email')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { username, email, bio } = req.body;
        const userId = req.params.id;

        // Check if user is updating their own profile
        if (req.user.id !== userId) {
            return res.status(403).json({ message: 'Not authorized to update this profile' });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Check if username is already taken by another user
        if (username && username !== user.username) {
            const existingUser = await User.findOne({ username });
            if (existingUser) {
                return res.status(400).json({ message: 'Username already taken' });
            }
        }

        // Check if email is already taken by another user
        if (email && email !== user.email) {
            const existingUser = await User.findOne({ email });
            if (existingUser) {
                return res.status(400).json({ message: 'Email already taken' });
            }
        }

        // Update user
        if (username) user.username = username;
        if (email) user.email = email;
        if (bio !== undefined) user.bio = bio;

        await user.save();

        res.json({
            id: user.id,
            username: user.username,
            email: user.email,
            bio: user.bio,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt
        });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   DELETE /api/v1/users/:id
// @desc    Delete user account
// @access  Private
router.delete('/:id', auth, async (req, res) => {
    try {
        const userId = req.params.id;

        // Check if user is deleting their own account
        if (req.user.id !== userId) {
            return res.status(403).json({ message: 'Not authorized to delete this account' });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        await User.findByIdAndDelete(userId);
        res.json({ message: 'User account deleted successfully' });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
