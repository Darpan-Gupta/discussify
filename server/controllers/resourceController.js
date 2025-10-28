const Resource = require('../models/Resource');

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
        const { title, type, link, communityId, description } = req.body;

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

        const resource = new Resource({
            title: title.trim(),
            type,
            link: link.trim(),
            author: req.user.id,
            community: communityId || null,
            description: description ? description.trim() : ''
        });

        await resource.save();

        res.status(201).json({ message: 'Resource shared successfully' });
    } catch (err) {
        return next(err);
    }
};
