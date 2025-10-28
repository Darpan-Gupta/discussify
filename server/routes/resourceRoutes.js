const express = require('express');
const router = express.Router();
const auth = require('../middlewares/authMiddleware');
const { shareResource } = require('../controllers/resourceController');

router.post('/resources', auth, shareResource);

module.exports = router;
