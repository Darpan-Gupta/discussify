const express = require('express');
const { body, validationResult } = require('express-validator');
const Discussion = require('../models/Discussion');
const Community = require('../models/Community');
const auth = require('../middlewares/authMiddleware');
const { createNotification } = require('../controllers/notificationController');

const router = express.Router();

// @route   GET /api/v1/discussions
// @desc    Get all discussions (optionally filtered by community)
// @access  Public
router.get('/', async (req, res) => {
    try {
        const { page = 1, limit = 10, category, search, communityId } = req.query;
        const query = {};

        if (communityId) {
            query.community = communityId;
        }

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
            .populate('community', 'name')
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
            .populate('community', 'name')
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
    body('category').isLength({ min: 1 }).withMessage('Category is required'),
    body('communityId').isLength({ min: 1 }).withMessage('Community ID is required')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { title, content, category, communityId } = req.body;

        // Verify community exists and user is a member or creator
        const community = await Community.findById(communityId);
        if (!community) {
            return res.status(404).json({ message: 'Community not found' });
        }

        const userId = req.user.id.toString();
        const creatorId = community.creator.toString();
        const isCreator = creatorId === userId;
        const isMember = community.members.some(member => {
            const memberId = member._id ? member._id.toString() : member.toString();
            return memberId === userId;
        });

        if (!isCreator && !isMember) {
            return res.status(403).json({ message: 'You must be a member of the community to create discussions' });
        }

        const discussion = new Discussion({
            title,
            content,
            category,
            author: req.user.id,
            community: communityId
        });

        await discussion.save();
        await discussion.populate('author', 'username');
        await discussion.populate('community', 'name');

        // Create notifications for all community members except the author
        const populatedCommunity = await Community.findById(communityId).populate('members', '_id');
        const membersToNotify = populatedCommunity.members.filter(
            member => member._id.toString() !== req.user.id.toString()
        );

        for (const member of membersToNotify) {
            await createNotification(
                member._id,
                'discussion',
                communityId,
                'New Discussion',
                `${discussion.author.username} started a new discussion "${discussion.title}" in ${populatedCommunity.name}`,
                discussion._id,
                null
            );
        }

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

        // Check if user is the author or the community creator
        const isAuthor = discussion.author.toString() === req.user.id;

        let isCommunityCreator = false;
        if (discussion.community) {
            const community = await Community.findById(discussion.community);
            if (community && community.creator.toString() === req.user.id) {
                isCommunityCreator = true;
            }
        }

        if (!isAuthor && !isCommunityCreator) {
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




        // To get the username for the latest comment:
        const newComment = discussion.comments[discussion.comments.length - 1];
        // newComment.author is a populated user object

        // Example: get the username of the commenter
        const commenterUsername = newComment.author.username;

        // Create notification for all community members except the sender
        if (discussion.community) {
            const community = await Community.findById(discussion.community).populate('members', '_id name');
            if (community && Array.isArray(community.members)) {
                const membersToNotify = community.members.filter(
                    member => member._id.toString() !== req.user.id
                );
                for (const member of membersToNotify) {
                    await createNotification(
                        member._id,
                        'discussion',
                        community._id,
                        'New Comment Added',
                        `${commenterUsername}: ${comment.content} || \n
                        Discussion: ${discussion.title} | Community: ${community.name}`,
                        discussion._id,
                        null
                    );
                }
            }
        }
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
