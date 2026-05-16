const { Project, ProjectMember } = require('../models/Project');
const { Task } = require('../models/Task');
const User = require('../models/User');
const { sequelize } = require('../config/db');
const { Op } = require('sequelize');

// @route GET /api/projects
exports.getProjects = async (req, res) => {
  try {
    let projects;
    if (req.user.role === 'admin') {
      projects = await Project.findAll({ order: [['createdAt', 'DESC']] });
    } else {
      const memberships = await ProjectMember.findAll({ where: { user_id: req.user.id } });
      const projectIds = memberships.map(m => m.project_id);
      projects = await Project.findAll({
        where: { [Op.or]: [{ owner_id: req.user.id }, { id: { [Op.in]: projectIds.length ? projectIds : [0] } }] },
        order: [['createdAt', 'DESC']]
      });
    }

    const result = await Promise.all(projects.map(async (p) => {
      const owner = await User.findByPk(p.owner_id, { attributes: ['id', 'name', 'email'] });
      const members = await ProjectMember.findAll({ where: { project_id: p.id } });
      const memberDetails = await Promise.all(members.map(async m => {
        const u = await User.findByPk(m.user_id, { attributes: ['id', 'name', 'email'] });
        return { user: u, role: m.role };
      }));
      return { ...p.toJSON(), owner, members: memberDetails };
    }));

    res.json({ success: true, count: result.length, data: result });
  } catch (error) {
    console.error('getProjects error:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route POST /api/projects
exports.createProject = async (req, res) => {
  try {
    const { name, description, deadline, color } = req.body;
    const project = await Project.create({ name, description, deadline, color, owner_id: req.user.id });
    await ProjectMember.create({ project_id: project.id, user_id: req.user.id, role: 'admin' });
    const owner = await User.findByPk(req.user.id, { attributes: ['id', 'name', 'email'] });
    res.status(201).json({ success: true, data: { ...project.toJSON(), owner, members: [{ user: owner, role: 'admin' }] } });
  } catch (error) {
    console.error('createProject error:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route GET /api/projects/:id
exports.getProject = async (req, res) => {
  try {
    const project = await Project.findByPk(req.params.id);
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });

    const members = await ProjectMember.findAll({ where: { project_id: project.id } });
    const isMember = members.some(m => m.user_id === req.user.id);
    if (!isMember && project.owner_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const owner = await User.findByPk(project.owner_id, { attributes: ['id', 'name', 'email'] });
    const memberDetails = await Promise.all(members.map(async m => {
      const u = await User.findByPk(m.user_id, { attributes: ['id', 'name', 'email'] });
      return { user: u, role: m.role };
    }));

    res.json({ success: true, data: { ...project.toJSON(), owner, members: memberDetails } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route PUT /api/projects/:id
exports.updateProject = async (req, res) => {
  try {
    const project = await Project.findByPk(req.params.id);
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });
    if (project.owner_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only owner or admin can update' });
    }
    await project.update(req.body);
    res.json({ success: true, data: project });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route DELETE /api/projects/:id
exports.deleteProject = async (req, res) => {
  try {
    const project = await Project.findByPk(req.params.id);
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });
    if (project.owner_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only owner or admin can delete' });
    }
    await Task.destroy({ where: { project_id: req.params.id } });
    await ProjectMember.destroy({ where: { project_id: req.params.id } });
    await project.destroy();
    res.json({ success: true, message: 'Project deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route POST /api/projects/:id/members
exports.addMember = async (req, res) => {
  try {
    const { email, role } = req.body;
    const project = await Project.findByPk(req.params.id);
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });
    if (project.owner_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only owner or admin can add members' });
    }
    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(404).json({ success: false, message: 'User not found with that email' });

    const existing = await ProjectMember.findOne({ where: { project_id: project.id, user_id: user.id } });
    if (existing) return res.status(400).json({ success: false, message: 'User already a member' });

    await ProjectMember.create({ project_id: project.id, user_id: user.id, role: role || 'member' });
    res.json({ success: true, message: 'Member added' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route DELETE /api/projects/:id/members/:userId
exports.removeMember = async (req, res) => {
  try {
    const project = await Project.findByPk(req.params.id);
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });
    if (project.owner_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only owner or admin can remove members' });
    }
    await ProjectMember.destroy({ where: { project_id: req.params.id, user_id: req.params.userId } });
    res.json({ success: true, message: 'Member removed' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};