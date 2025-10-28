const Discussion = require('../models/Discussion');

exports.participateInDiscussion = async (req, res, next) => {
    try {
        const { discussionId } = req.params;
        const { content } = req.body;

        if (!content || typeof content !== 'string' || content.trim().length === 0) {
            const err = new Error('Invalid request body');
            err.status = 400;
            throw err;
        }

        const discussion = await Discussion.findById(discussionId);
        if (!discussion) {
            const err = new Error('Discussion not found');
            err.status = 404;
            throw err;
        }

        // Add comment to discussion
        const comment = {
            content: content.trim(),
            author: req.user.id
        };

        discussion.comments.push(comment);
        await discussion.save();

        res.json({ message: 'Comment added successfully' });
    } catch (err) {
        return next(err);
    }
};
