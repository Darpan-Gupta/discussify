const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const isValidEmail = (email) => /\S+@\S+\.\S+/.test(email);

exports.signup = async (req, res, next) => {
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

        const existing = await User.findOne({ email });
        if (existing) {
            const err = new Error('Email already in use');
            err.status = 409;
            throw err;
        }

        const salt = await bcrypt.genSalt(10);
        const hashed = await bcrypt.hash(password, salt);

        await User.create({ email, password: hashed });

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


