const { Task, Comment } = require('../models/Task');
const { Project, ProjectMember } = require('../models/Project');
const User = require('../models/User');
const { Op } = require('sequelize');

// @route GET /api/tasks
exports.getTasks = async (req, res) => {
  try {
    const { project, status, assignedTo, priority } = req.query;
    const filter = {};

    if (project) filter.project_id = project;
    if (status) filter.status = status;
    if (assignedTo) filter.assigned_to = assignedTo;
    if (priority) filter.priority = priority;

    if (req.user.role !== 'admin') {
      const memberships = await ProjectMember.findAll({ where: { user_id: req.user.id } });
      const projectIds = memberships.map(m => m.project_id);
      if (!filter.project_id) filter.project_id = { [Op.in]: projectIds };
    }

    const tasks = await Task.findAll({ where: filter, order: [['createdAt', 'DESC']] });

    const result = await Promise.all(tasks.map(async t => {
      const assignedUser = t.assigned_to ? await User.findByPk(t.assigned_to, { attributes: ['id', 'name', 'email'] }) : null;
      const creator = await User.findByPk(t.created_by, { attributes: ['id', 'name', 'email'] });
      const proj = await Project.findByPk(t.project_id, { attributes: ['id', 'name', 'color'] });
      return { ...t.toJSON(), assignedTo: assignedUser, createdBy: creator, project: proj };
    }));

    res.json({ success: true, count: result.length, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route POST /api/tasks
exports.createTask = async (req, res) => {
  try {
    const { title, description, project, assignedTo, priority, dueDate, tags, status } = req.body;

    const proj = await Project.findByPk(project);
    if (!proj) return res.status(404).json({ success: false, message: 'Project not found' });

    const isMember = await ProjectMember.findOne({ where: { project_id: project, user_id: req.user.id } });
    if (!isMember && proj.owner_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not a project member' });
    }

    const task = await Task.create({
      title, description, project_id: project,
      assigned_to: assignedTo || null,
      priority, due_date: dueDate, tags, status,
      created_by: req.user.id
    });

    const assignedUser = task.assigned_to ? await User.findByPk(task.assigned_to, { attributes: ['id', 'name', 'email'] }) : null;
    const creator = await User.findByPk(task.created_by, { attributes: ['id', 'name', 'email'] });

    res.status(201).json({ success: true, data: { ...task.toJSON(), assignedTo: assignedUser, createdBy: creator, project: proj } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route GET /api/tasks/:id
exports.getTask = async (req, res) => {
  try {
    const task = await Task.findByPk(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    const comments = await Comment.findAll({ where: { task_id: task.id }, order: [['createdAt', 'ASC']] });
    const commentDetails = await Promise.all(comments.map(async c => {
      const u = await User.findByPk(c.user_id, { attributes: ['id', 'name', 'email'] });
      return { ...c.toJSON(), user: u };
    }));

    const assignedUser = task.assigned_to ? await User.findByPk(task.assigned_to, { attributes: ['id', 'name', 'email'] }) : null;
    const creator = await User.findByPk(task.created_by, { attributes: ['id', 'name', 'email'] });
    const proj = await Project.findByPk(task.project_id, { attributes: ['id', 'name', 'color'] });

    res.json({ success: true, data: { ...task.toJSON(), assignedTo: assignedUser, createdBy: creator, project: proj, comments: commentDetails } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route PUT /api/tasks/:id
exports.updateTask = async (req, res) => {
  try {
    const task = await Task.findByPk(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
    await task.update(req.body);
    res.json({ success: true, data: task });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route DELETE /api/tasks/:id
exports.deleteTask = async (req, res) => {
  try {
    const task = await Task.findByPk(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    const proj = await Project.findByPk(task.project_id);
    const isOwner = proj && proj.owner_id === req.user.id;
    const isCreator = task.created_by === req.user.id;
    if (!isOwner && !isCreator && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this task' });
    }

    await Comment.destroy({ where: { task_id: task.id } });
    await task.destroy();
    res.json({ success: true, message: 'Task deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route POST /api/tasks/:id/comments
exports.addComment = async (req, res) => {
  try {
    const task = await Task.findByPk(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    const comment = await Comment.create({ task_id: task.id, user_id: req.user.id, text: req.body.text });
    const user = await User.findByPk(req.user.id, { attributes: ['id', 'name', 'email'] });
    res.json({ success: true, data: { ...comment.toJSON(), user } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route GET /api/tasks/dashboard/stats
exports.getDashboardStats = async (req, res) => {
  try {
    const userId = req.user.id;
    const memberships = await ProjectMember.findAll({ where: { user_id: userId } });
    const projectIds = memberships.map(m => m.project_id);

    const [total, todo, inProgress, done, overdue, myTasks] = await Promise.all([
      Task.count({ where: { project_id: { [Op.in]: projectIds } } }),
      Task.count({ where: { project_id: { [Op.in]: projectIds }, status: 'todo' } }),
      Task.count({ where: { project_id: { [Op.in]: projectIds }, status: 'in-progress' } }),
      Task.count({ where: { project_id: { [Op.in]: projectIds }, status: 'done' } }),
      Task.count({ where: { project_id: { [Op.in]: projectIds }, due_date: { [Op.lt]: new Date() }, status: { [Op.ne]: 'done' } } }),
      Task.count({ where: { assigned_to: userId, status: { [Op.ne]: 'done' } } }),
    ]);

    res.json({ success: true, data: { totalTasks: total, todo, inProgress, done, overdue, myTasks, totalProjects: projectIds.length } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
