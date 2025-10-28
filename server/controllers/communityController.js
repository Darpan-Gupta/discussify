const Community = require('../models/Community');
const User = require('../models/User');

exports.createCommunity = async (req, res, next) => {
    try {
        const { name, description } = req.body;

        if (!name || typeof name !== 'string' || name.trim().length === 0) {
            const err = new Error('Invalid request body');
            err.status = 400;
            throw err;
        }

        if (!description || typeof description !== 'string' || description.trim().length === 0) {
            const err = new Error('Invalid request body');
            err.status = 400;
            throw err;
        }

        // Check if community name already exists
        const existingCommunity = await Community.findOne({ name: name.trim() });
        if (existingCommunity) {
            const err = new Error('Community name already exists');
            err.status = 409;
            throw err;
        }

        const community = new Community({
            name: name.trim(),
            description: description.trim(),
            creator: req.user.id,
            members: [req.user.id] // Creator is automatically a member
        });

        await community.save();

        // Add community to user's communities
        await User.findByIdAndUpdate(req.user.id, {
            $addToSet: { communities: community._id }
        });

        res.status(201).json({ message: 'Community created successfully' });
    } catch (err) {
        return next(err);
    }
};

exports.joinCommunity = async (req, res, next) => {
    try {
        const { communityId } = req.params;

        const community = await Community.findById(communityId);
        if (!community) {
            const err = new Error('Community not found');
            err.status = 404;
            throw err;
        }

        // Check if user is already a member
        if (community.members.includes(req.user.id)) {
            const err = new Error('Already a member of this community');
            err.status = 409;
            throw err;
        }

        // Add user to community members
        community.members.push(req.user.id);
        await community.save();

        // Add community to user's communities
        await User.findByIdAndUpdate(req.user.id, {
            $addToSet: { communities: community._id }
        });

        res.json({ message: 'Joined community successfully' });
    } catch (err) {
        return next(err);
    }
};
