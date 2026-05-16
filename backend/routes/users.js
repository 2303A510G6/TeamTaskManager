const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/auth');
const { getAllUsers, searchUsers, updateUserRole, updateProfile } = require('../controllers/userController');

router.use(protect);

router.get('/', adminOnly, getAllUsers);
router.get('/search', searchUsers);
router.put('/profile', updateProfile);
router.put('/:id/role', adminOnly, updateUserRole);

module.exports = router;
