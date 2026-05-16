const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Project = sequelize.define('Project', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING(100), allowNull: false },
  description: { type: DataTypes.STRING(500) },
  status: { type: DataTypes.ENUM('active', 'completed', 'on-hold'), defaultValue: 'active' },
  owner_id: { type: DataTypes.INTEGER, allowNull: false },
  deadline: { type: DataTypes.DATE },
  color: { type: DataTypes.STRING(20), defaultValue: '#6366f1' },
}, { timestamps: true });

// ProjectMembers join table
const ProjectMember = sequelize.define('ProjectMember', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  project_id: { type: DataTypes.INTEGER, allowNull: false },
  user_id: { type: DataTypes.INTEGER, allowNull: false },
  role: { type: DataTypes.ENUM('admin', 'member'), defaultValue: 'member' },
}, { timestamps: false });

module.exports = { Project, ProjectMember };
