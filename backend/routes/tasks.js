const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getTasks, createTask, getTask,
  updateTask, deleteTask, addComment, getDashboardStats
} = require('../controllers/taskController');

router.use(protect);

router.get('/dashboard/stats', getDashboardStats);
router.route('/').get(getTasks).post(createTask);
router.route('/:id').get(getTask).put(updateTask).delete(deleteTask);
router.post('/:id/comments', addComment);

module.exports = router;
