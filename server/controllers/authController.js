const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const isValidEmail = (email) => /\S+@\S+\.\S+/.test(email);

exports.signup = async (req, res, next) => {
    try {
        const { username, email, password } = req.body;

        if (!username || !email || !password) {
            const err = new Error('Invalid request body');
            err.status = 400;
            throw err;
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            const err = new Error('Email already in use');
            err.status = 409;
            throw err;
        }

        const salt = await bcrypt.genSalt(10);
        const hashed = await bcrypt.hash(password, salt);

        await User.create({ username, email, password: hashed });

        return res.status(201).json({ message: 'User registered successfully' });
    } catch (err) {
        return next(err);
    }
};

exports.login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        if (!isValidEmail(email)) {
            const err = new Error('Invalid request body');
            err.status = 400;
            throw err;
        }

        if (typeof password !== 'string' || password.length < 8) {
            const err = new Error('Invalid request body');
            err.status = 400;
            throw err;
        }

        const user = await User.findOne({ email });
        if (!user) {
            const err = new Error('Invalid credentials');
            err.status = 401;
            throw err;
        }

        const match = await bcrypt.compare(password, user.password);
        if (!match) {
            const err = new Error('Invalid credentials');
            err.status = 401;
            throw err;
        }

        const payload = { user: { id: user.id } };
        const token = jwt.sign(payload, process.env.JWT_SECRET || 'fallback_secret', {
            expiresIn: '7d',
        });

        return res.json({ token });
    } catch (err) {
        return next(err);
    }
};

exports.me = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        if (!user) {
            const err = new Error('User not found');
            err.status = 404;
            throw err;
        }
        return res.json(user);
    } catch (err) {
        return next(err);
    }
};

exports.forgotPassword = async (req, res, next) => {
    try {
        const { email } = req.body;

        if (!email || !isValidEmail(email)) {
            const err = new Error('Invalid email');
            err.status = 400;
            throw err;
        }

        const user = await User.findOne({ email });
        if (!user) {
            const err = new Error('User not found');
            err.status = 404;
            throw err;
        }

        // Return static OTP for demo
        return res.json({ message: 'OTP sent successfully', otp: '123456' });
    } catch (err) {
        return next(err);
    }
};

exports.resetPassword = async (req, res, next) => {
    try {
        const { email, otp, newPassword } = req.body;

        if (!email || !otp || !newPassword) {
            const err = new Error('Email, OTP, and new password are required');
            err.status = 400;
            throw err;
        }

        if (!isValidEmail(email)) {
            const err = new Error('Invalid email');
            err.status = 400;
            throw err;
        }

        if (otp !== '123456') {
            const err = new Error('Invalid OTP');
            err.status = 400;
            throw err;
        }

        if (typeof newPassword !== 'string' || newPassword.length < 6) {
            const err = new Error('Password must be at least 6 characters');
            err.status = 400;
            throw err;
        }

        const user = await User.findOne({ email });
        if (!user) {
            const err = new Error('User not found');
            err.status = 404;
            throw err;
        }

        // Hash and update password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);
        user.password = hashedPassword;
        await user.save();

        return res.json({ message: 'Password reset successfully' });
    } catch (err) {
        return next(err);
    }
};


