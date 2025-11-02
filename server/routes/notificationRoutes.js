const express = require('express');
const router = express.Router();
const auth = require('../middlewares/authMiddleware');
const {
    getNotifications,
    markAsRead,
    updatePreferences,
    getPreferences
} = require('../controllers/notificationController');

router.get('/notifications', auth, getNotifications);
router.put('/notifications/:id/read', auth, markAsRead);
router.put('/notifications/all/read', auth, markAsRead);
router.get('/notifications/preferences', auth, getPreferences);
router.put('/notifications/preferences', auth, updatePreferences);

module.exports = router;

