const express = require('express');
const router = express.Router();
const auth = require('../middlewares/authMiddleware');
const { shareResource, getAllResources, getResourceById } = require('../controllers/resourceController');

router.get('/', getAllResources);
router.get('/:id', getResourceById);
router.post('/', auth, shareResource);

module.exports = router;
