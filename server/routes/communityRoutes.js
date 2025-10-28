const express = require('express');
const router = express.Router();
const auth = require('../middlewares/authMiddleware');
const { createCommunity, joinCommunity } = require('../controllers/communityController');

router.post('/communities', auth, createCommunity);
router.post('/communities/:communityId/join', auth, joinCommunity);

module.exports = router;
