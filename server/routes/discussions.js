const express = require('express');
const { body, validationResult } = require('express-validator');
const Discussion = require('../models/Discussion');
const auth = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/v1/discussions
// @desc    Get all discussions
// @access  Public
router.get('/', async (req, res) => {
    try {
        const { page = 1, limit = 10, category, search } = req.query;
        const query = {};

        if (category) {
            query.category = category;
        }

        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { content: { $regex: search, $options: 'i' } }
            ];
        }

        const discussions = await Discussion.find(query)
            .populate('author', 'username')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await Discussion.countDocuments(query);

        res.json({
            discussions,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            total
        });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/v1/discussions/:id
// @desc    Get discussion by ID
// @access  Public
router.get('/:id', async (req, res) => {
    try {
        const discussion = await Discussion.findById(req.params.id)
            .populate('author', 'username')
            .populate({
                path: 'comments.author',
                select: 'username'
            });

        if (!discussion) {
            return res.status(404).json({ message: 'Discussion not found' });
        }

        res.json(discussion);
    } catch (error) {
        console.error(error.message);
        if (error.kind === 'ObjectId') {
            return res.status(404).json({ message: 'Discussion not found' });
        }
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   POST /api/v1/discussions
// @desc    Create a new discussion
// @access  Private
router.post('/', [
    auth,
    body('title').isLength({ min: 1 }).withMessage('Title is required'),
    body('content').isLength({ min: 1 }).withMessage('Content is required'),
    body('category').isLength({ min: 1 }).withMessage('Category is required')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { title, content, category } = req.body;

        const discussion = new Discussion({
            title,
            content,
            category,
            author: req.user.id
        });

        await discussion.save();
        await discussion.populate('author', 'username');

        res.status(201).json(discussion);
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   PUT /api/v1/discussions/:id
// @desc    Update a discussion
// @access  Private
router.put('/:id', [
    auth,
    body('title').optional().isLength({ min: 1 }).withMessage('Title cannot be empty'),
    body('content').optional().isLength({ min: 1 }).withMessage('Content cannot be empty'),
    body('category').optional().isLength({ min: 1 }).withMessage('Category cannot be empty')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const discussion = await Discussion.findById(req.params.id);
        if (!discussion) {
            return res.status(404).json({ message: 'Discussion not found' });
        }

        // Check if user is the author
        if (discussion.author.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized to update this discussion' });
        }

        const { title, content, category } = req.body;

        if (title) discussion.title = title;
        if (content) discussion.content = content;
        if (category) discussion.category = category;

        await discussion.save();
        await discussion.populate('author', 'username');

        res.json(discussion);
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   DELETE /api/v1/discussions/:id
// @desc    Delete a discussion
// @access  Private
router.delete('/:id', auth, async (req, res) => {
    try {
        const discussion = await Discussion.findById(req.params.id);
        if (!discussion) {
            return res.status(404).json({ message: 'Discussion not found' });
        }

        // Check if user is the author
        if (discussion.author.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized to delete this discussion' });
        }

        await Discussion.findByIdAndDelete(req.params.id);
        res.json({ message: 'Discussion deleted successfully' });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   POST /api/v1/discussions/:id/comments
// @desc    Add a comment to a discussion
// @access  Private
router.post('/:id/comments', [
    auth,
    body('content').isLength({ min: 1 }).withMessage('Comment content is required')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const discussion = await Discussion.findById(req.params.id);
        if (!discussion) {
            return res.status(404).json({ message: 'Discussion not found' });
        }

        const comment = {
            content: req.body.content,
            author: req.user.id
        };

        discussion.comments.push(comment);
        await discussion.save();
        await discussion.populate('comments.author', 'username');

        res.status(201).json(discussion.comments[discussion.comments.length - 1]);
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   DELETE /api/v1/discussions/:id/comments/:commentId
// @desc    Delete a comment
// @access  Private
router.delete('/:id/comments/:commentId', auth, async (req, res) => {
    try {
        const discussion = await Discussion.findById(req.params.id);
        if (!discussion) {
            return res.status(404).json({ message: 'Discussion not found' });
        }

        const comment = discussion.comments.id(req.params.commentId);
        if (!comment) {
            return res.status(404).json({ message: 'Comment not found' });
        }

        // Check if user is the author of the comment
        if (comment.author.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized to delete this comment' });
        }

        comment.remove();
        await discussion.save();

        res.json({ message: 'Comment deleted successfully' });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
