const express = require('express');
const router = express.Router();
const auth = require('../middlewares/authMiddleware');
const {
    createCommunity,
    joinCommunity,
    leaveCommunity,
    getAllCommunities,
    getCommunityById,
    getInviteLink,
    getMyCommunities,
    updateCommunityDescription,
    manageMembers,
    deleteCommunity
} = require('../controllers/communityController');

router.get('/communities', getAllCommunities);
router.get('/communities/my', auth, getMyCommunities);
router.get('/communities/:id', getCommunityById);
router.post('/communities', auth, createCommunity);
router.post('/communities/:communityId/join', auth, joinCommunity);
router.post('/communities/:communityId/leave', auth, leaveCommunity);
router.get('/communities/:id/invite', auth, getInviteLink);
router.put('/communities/:id/description', auth, updateCommunityDescription);
router.put('/communities/:id/members', auth, manageMembers);
router.delete('/communities/:id', auth, deleteCommunity);

module.exports = router;
