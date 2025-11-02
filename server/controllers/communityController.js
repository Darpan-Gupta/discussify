const Community = require('../models/Community');
const User = require('../models/User');
const crypto = require('crypto');

exports.createCommunity = async (req, res, next) => {
    try {
        const { name, description, isPrivate } = req.body;

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

        const communityData = {
            name: name.trim(),
            description: description.trim(),
            creator: req.user.id,
            members: [req.user.id] // Creator is automatically a member
        };

        // If private, generate invite token
        if (isPrivate) {
            communityData.isPrivate = true;
            communityData.inviteToken = crypto.randomBytes(32).toString('hex');
        }

        const community = new Community(communityData);
        await community.save();

        // Add community to user's communities
        await User.findByIdAndUpdate(req.user.id, {
            $addToSet: { communities: community._id }
        });

        res.status(201).json({
            message: 'Community created successfully',
            community: community
        });
    } catch (err) {
        return next(err);
    }
};

exports.joinCommunity = async (req, res, next) => {
    try {
        const { communityId } = req.params;
        const { inviteToken } = req.body;

        const community = await Community.findById(communityId);
        if (!community) {
            const err = new Error('Community not found');
            err.status = 404;
            throw err;
        }

        // Check if community is private and require invite token
        if (community.isPrivate && !inviteToken) {
            const err = new Error('This is a private community. An invite token is required.');
            err.status = 403;
            throw err;
        }

        // Validate invite token if provided
        if (inviteToken && community.inviteToken !== inviteToken) {
            const err = new Error('Invalid invite token');
            err.status = 403;
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

exports.leaveCommunity = async (req, res, next) => {
    try {
        const { communityId } = req.params;

        const community = await Community.findById(communityId);
        if (!community) {
            const err = new Error('Community not found');
            err.status = 404;
            throw err;
        }

        // Check if user is the creator
        if (community.creator.toString() === req.user.id) {
            const err = new Error('Community creator cannot leave the community. Please delete the community instead.');
            err.status = 403;
            throw err;
        }

        // Check if user is a member
        if (!community.members.includes(req.user.id)) {
            const err = new Error('You are not a member of this community');
            err.status = 404;
            throw err;
        }

        // Remove user from community members
        community.members.pull(req.user.id);
        await community.save();

        // Remove community from user's communities
        await User.findByIdAndUpdate(req.user.id, {
            $pull: { communities: community._id }
        });

        res.json({ message: 'Left community successfully' });
    } catch (err) {
        return next(err);
    }
};

exports.getAllCommunities = async (req, res, next) => {
    try {
        // Only show public communities in the list
        const communities = await Community.find({ isPrivate: false })
            .populate('creator', 'username')
            .sort({ createdAt: -1 });
        return res.json(communities);
    } catch (err) {
        return next(err);
    }
};

exports.getCommunityById = async (req, res, next) => {
    try {
        const community = await Community.findById(req.params.id)
            .populate('creator', 'username')
            .populate('members', 'username');
        if (!community) {
            const error = new Error('Community not found');
            error.status = 404;
            throw error;
        }

        // For private communities:
        // - Members can access without token (token is only for joining)
        // - Non-members can view basic details (needed to join with token)
        // - The frontend will handle showing/hiding content based on membership
        // This allows members to access anytime, and non-members to view the page and join with invite token

        return res.json(community);
    } catch (err) {
        return next(err);
    }
};

exports.getInviteLink = async (req, res, next) => {
    try {
        const { id } = req.params;

        const community = await Community.findById(id);
        if (!community) {
            const err = new Error('Community not found');
            err.status = 404;
            throw err;
        }

        // Only creator can get invite link
        if (community.creator.toString() !== req.user.id) {
            const err = new Error('Only the community creator can access the invite link');
            err.status = 403;
            throw err;
        }

        if (!community.isPrivate) {
            const err = new Error('This is not a private community');
            err.status = 400;
            throw err;
        }

        // Use client URL from environment variable
        const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
        const inviteLink = `${clientUrl}/communities/${id}?token=${community.inviteToken}`;

        res.json({ inviteLink });
    } catch (err) {
        return next(err);
    }
};

exports.getMyCommunities = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id).populate({
            path: 'communities',
            populate: {
                path: 'creator',
                select: 'username'
            }
        });

        if (!user) {
            const err = new Error('User not found');
            err.status = 404;
            throw err;
        }

        // Filter out null communities (deleted communities) and inactive communities, then sort by creation date
        const communities = user.communities
            .filter(community => community && community.isActive !== false)
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        // Populate members count
        const communitiesWithMembers = await Promise.all(
            communities.map(async (community) => {
                const populatedCommunity = await Community.findById(community._id)
                    .populate('members', 'username');
                return {
                    ...community.toObject(),
                    members: populatedCommunity.members
                };
            })
        );

        res.json(communitiesWithMembers);
    } catch (err) {
        return next(err);
    }
};

exports.updateCommunityDescription = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { description } = req.body;

        if (!description || typeof description !== 'string' || description.trim().length === 0) {
            const err = new Error('Description is required and cannot be empty');
            err.status = 400;
            throw err;
        }

        if (description.trim().length > 500) {
            const err = new Error('Description cannot exceed 500 characters');
            err.status = 400;
            throw err;
        }

        const community = await Community.findById(id);
        if (!community) {
            const err = new Error('Community not found');
            err.status = 404;
            throw err;
        }

        // Check if user is the creator
        if (community.creator.toString() !== req.user.id) {
            const err = new Error('Only the community creator can update the description');
            err.status = 403;
            throw err;
        }

        community.description = description.trim();
        await community.save();

        res.json({
            message: 'Community description updated successfully',
            community
        });
    } catch (err) {
        return next(err);
    }
};

exports.manageMembers = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { action, userId } = req.body;

        if (!action || !['add', 'remove'].includes(action)) {
            const err = new Error('Invalid action. Must be "add" or "remove"');
            err.status = 400;
            throw err;
        }

        if (!userId) {
            const err = new Error('User ID is required');
            err.status = 400;
            throw err;
        }

        const community = await Community.findById(id);
        if (!community) {
            const err = new Error('Community not found');
            err.status = 404;
            throw err;
        }

        // Check if user is the creator
        if (community.creator.toString() !== req.user.id) {
            const err = new Error('Only the community creator can manage members');
            err.status = 403;
            throw err;
        }

        // Prevent removing the creator
        if (action === 'remove' && community.creator.toString() === userId) {
            const err = new Error('Cannot remove the community creator');
            err.status = 400;
            throw err;
        }

        if (action === 'add') {
            // Check if user exists
            const userToAdd = await User.findById(userId);
            if (!userToAdd) {
                const err = new Error('User not found');
                err.status = 404;
                throw err;
            }

            // Check if already a member
            if (community.members.includes(userId)) {
                const err = new Error('User is already a member of this community');
                err.status = 409;
                throw err;
            }

            community.members.push(userId);
            await community.save();

            // Add community to user's communities
            await User.findByIdAndUpdate(userId, {
                $addToSet: { communities: community._id }
            });

            res.json({
                message: 'Member added successfully',
                community: await Community.findById(id).populate('members', 'username')
            });
        } else if (action === 'remove') {
            // Check if user is a member
            if (!community.members.includes(userId)) {
                const err = new Error('User is not a member of this community');
                err.status = 404;
                throw err;
            }

            community.members.pull(userId);
            await community.save();

            // Remove community from user's communities
            await User.findByIdAndUpdate(userId, {
                $pull: { communities: community._id }
            });

            res.json({
                message: 'Member removed successfully',
                community: await Community.findById(id).populate('members', 'username')
            });
        }
    } catch (err) {
        return next(err);
    }
};

exports.deleteCommunity = async (req, res, next) => {
    try {
        const { id } = req.params;

        const community = await Community.findById(id);
        if (!community) {
            const err = new Error('Community not found');
            err.status = 404;
            throw err;
        }

        // Check if user is the creator
        if (community.creator.toString() !== req.user.id) {
            const err = new Error('Only the community creator can delete the community');
            err.status = 403;
            throw err;
        }

        // Remove community from all members' communities list
        await User.updateMany(
            { communities: id },
            { $pull: { communities: id } }
        );

        // Delete the community from the database
        await Community.findByIdAndDelete(id);

        res.json({
            message: 'Community deleted successfully'
        });
    } catch (err) {
        return next(err);
    }
};