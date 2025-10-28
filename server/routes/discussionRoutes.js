const express = require('express');
const router = express.Router();
const auth = require('../middlewares/authMiddleware');
const { participateInDiscussion } = require('../controllers/discussionController');

router.post('/discussions/:discussionId/participate', auth, participateInDiscussion);

module.exports = router;
