const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getProjects, createProject, getProject,
  updateProject, deleteProject, addMember, removeMember
} = require('../controllers/projectController');

router.use(protect);

router.route('/').get(getProjects).post(createProject);
router.route('/:id').get(getProject).put(updateProject).delete(deleteProject);
router.route('/:id/members').post(addMember);
router.route('/:id/members/:userId').delete(removeMember);

module.exports = router;
