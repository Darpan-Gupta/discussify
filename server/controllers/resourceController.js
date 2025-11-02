const Resource = require('../models/Resource');
const Community = require('../models/Community');
const { createNotification } = require('./notificationController');

const isValidUrl = (string) => {
    try {
        new URL(string);
        return true;
    } catch (_) {
        return false;
    }
};

exports.shareResource = async (req, res, next) => {
    try {
        const { title, type, link, communityId, discussionId, description } = req.body;

        if (!title || typeof title !== 'string' || title.trim().length === 0) {
            const err = new Error('Invalid request body');
            err.status = 400;
            throw err;
        }

        if (!type || typeof type !== 'string' || !['article', 'video', 'document', 'link', 'other'].includes(type)) {
            const err = new Error('Invalid request body');
            err.status = 400;
            throw err;
        }

        if (!link || typeof link !== 'string' || !isValidUrl(link.trim())) {
            const err = new Error('Invalid request body');
            err.status = 400;
            throw err;
        }

        if (!discussionId) {
            const err = new Error('Discussion ID is required');
            err.status = 400;
            throw err;
        }

        const resource = new Resource({
            title: title.trim(),
            type,
            link: link.trim(),
            author: req.user.id,
            community: communityId || null,
            discussion: discussionId || null,
            description: description ? description.trim() : ''
        });

        await resource.save();

        // Create notifications for community members if resource is shared in a community
        if (communityId) {
            const community = await Community.findById(communityId).populate('members', '_id');
            if (community) {
                const membersToNotify = community.members.filter(
                    member => member._id.toString() !== req.user.id.toString()
                );

                for (const member of membersToNotify) {
                    await createNotification(
                        member._id,
                        'resource',
                        communityId,
                        'New Resource Shared',
                        `A new ${type} resource "${title}" was shared in ${community.name}`,
                        discussionId || null,
                        resource._id
                    );
                }
            }
        }

        res.status(201).json({ message: 'Resource shared successfully', resource });
    } catch (err) {
        return next(err);
    }
};

exports.getAllResources = async (req, res, next) => {
    try {
        const { page = 1, limit = 10, discussionId } = req.query;
        const query = {};

        if (discussionId) {
            query.discussion = discussionId;
        }

        const resources = await Resource.find(query)
            .populate('author', 'username')
            .sort({ createdAt: -1 })
            .limit(Number(limit))
            .skip((Number(page) - 1) * Number(limit));
        const total = await Resource.countDocuments(query);
        return res.json({ resources, total });
    } catch (err) {
        return next(err);
    }
};

exports.getResourceById = async (req, res, next) => {
    try {
        const resource = await Resource.findById(req.params.id);
        if (!resource) {
            const error = new Error('Resource not found');
            error.status = 404;
            throw error;
        }
        return res.json(resource);
    } catch (err) {
        return next(err);
    }
};