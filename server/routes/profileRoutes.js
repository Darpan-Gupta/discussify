const express = require('express');
const router = express.Router();
const auth = require('../middlewares/authMiddleware');
const upload = require('../utils/uploader');
const { updateProfile, uploadPicture } = require('../controllers/profileController');

router.put('/profile', auth, updateProfile);
router.post('/profile/picture', auth, upload.single('image'), uploadPicture);

module.exports = router;


