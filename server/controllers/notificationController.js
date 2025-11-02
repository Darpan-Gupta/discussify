const Notification = require('../models/Notification');
const User = require('../models/User');
const Community = require('../models/Community');

exports.getNotifications = async (req, res, next) => {
    try {
        // const { limit = 20, page = 1 } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        const notifications = await Notification.find({ user: req.user.id })
            .populate('community', 'name')
            .populate('discussion', 'title')
            .populate('resource', 'title')
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .skip(skip);

        const total = await Notification.countDocuments({ user: req.user.id });
        const unreadCount = await Notification.countDocuments({
            user: req.user.id,
            isRead: false
        });

        res.json({
            notifications,
            total,
            unreadCount,
            totalPages: Math.ceil(total / parseInt(limit)),
            currentPage: parseInt(page)
        });
    } catch (err) {
        return next(err);
    }
};

exports.markAsRead = async (req, res, next) => {
    try {
        const { id } = req.params;

        if (id === 'all') {
            // Mark all notifications as read
            await Notification.updateMany(
                { user: req.user.id, isRead: false },
                { isRead: true }
            );
            return res.json({ message: 'All notifications marked as read' });
        }

        const notification = await Notification.findById(id);
        if (!notification) {
            const err = new Error('Notification not found');
            err.status = 404;
            throw err;
        }

        // Check if user owns the notification
        if (notification.user.toString() !== req.user.id) {
            const err = new Error('Not authorized to access this notification');
            err.status = 403;
            throw err;
        }

        notification.isRead = true;
        await notification.save();

        res.json({ message: 'Notification marked as read', notification });
    } catch (err) {
        return next(err);
    }
};

exports.updatePreferences = async (req, res, next) => {
    try {
        const { discussion, resource } = req.body;

        // Validate that at least one notification type is enabled
        if (discussion === false && resource === false) {
            const err = new Error('At least one notification type must be enabled');
            err.status = 400;
            throw err;
        }

        const updateData = {};
        if (typeof discussion === 'boolean') {
            updateData['notificationPreferences.discussion'] = discussion;
        }
        if (typeof resource === 'boolean') {
            updateData['notificationPreferences.resource'] = resource;
        }

        // Final check: ensure at least one is enabled after update
        const user = await User.findById(req.user.id);
        const currentPrefs = user.notificationPreferences || {};

        const finalDiscussion = typeof discussion === 'boolean' ? discussion : currentPrefs.discussion;
        const finalResource = typeof resource === 'boolean' ? resource : currentPrefs.resource;

        if (finalDiscussion === false && finalResource === false) {
            const err = new Error('At least one notification type must be enabled');
            err.status = 400;
            throw err;
        }

        await User.findByIdAndUpdate(req.user.id, { $set: updateData });

        const updatedUser = await User.findById(req.user.id);
        res.json({
            message: 'Notification preferences updated successfully',
            preferences: updatedUser.notificationPreferences
        });
    } catch (err) {
        return next(err);
    }
};

exports.getPreferences = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id).select('notificationPreferences');
        if (!user) {
            const err = new Error('User not found');
            err.status = 404;
            throw err;
        }

        res.json({
            preferences: user.notificationPreferences || {
                discussion: true,
                resource: true
            }
        });
    } catch (err) {
        return next(err);
    }
};

// Helper function to create notifications (used by other controllers)
exports.createNotification = async (userId, type, communityId, title, message, discussionId = null, resourceId = null) => {
    try {
        // Check user's notification preferences
        const user = await User.findById(userId);
        if (!user) return;

        const preferences = user.notificationPreferences || { discussion: true, resource: true };

        // Check if this notification type is enabled for the user
        if (type === 'discussion' && !preferences.discussion) return;
        if (type === 'resource' && !preferences.resource) return;

        const notification = new Notification({
            user: userId,
            type,
            title,
            message,
            community: communityId,
            discussion: discussionId,
            resource: resourceId,
            isRead: false
        });

        await notification.save();
    } catch (err) {
        console.error('Error creating notification:', err);
        // Don't throw - notifications are non-critical
    }
};

