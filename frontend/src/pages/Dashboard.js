import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { taskAPI, projectAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { format } from 'date-fns';

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [recentTasks, setRecentTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [statsRes, tasksRes, projectsRes] = await Promise.all([
          taskAPI.getDashboardStats(),
          taskAPI.getAll({ limit: 5 }),
          projectAPI.getAll()
        ]);
        setStats(statsRes.data.data);
        setRecentTasks(tasksRes.data.data.slice(0, 5));
        setProjects(projectsRes.data.data.slice(0, 4));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <div style={{ textAlign: 'center', marginTop: 60 }}>Loading dashboard...</div>;

  const statCards = [
    { label: 'Total Projects', value: stats?.totalProjects || 0, icon: '📁', color: '#6366f1' },
    { label: 'My Active Tasks', value: stats?.myTasks || 0, icon: '✅', color: '#10b981' },
    { label: 'In Progress', value: stats?.inProgress || 0, icon: '🔄', color: '#3b82f6' },
    { label: 'Overdue', value: stats?.overdue || 0, icon: '⚠️', color: '#ef4444' },
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Good morning, {user?.name?.split(' ')[0]}! 👋</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: 4 }}>
            {format(new Date(), 'EEEE, MMMM d, yyyy')}
          </p>
        </div>
        <Link to="/tasks" className="btn btn-primary">+ New Task</Link>
      </div>

      {/* Stats */}
      <div className="grid-4" style={{ marginBottom: 28 }}>
        {statCards.map(({ label, value, icon, color }) => (
          <div key={label} className="stat-card">
            <div style={{ fontSize: 28, marginBottom: 8 }}>{icon}</div>
            <div style={{ fontSize: 32, fontWeight: 700, color }}>{value}</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>{label}</div>
          </div>
        ))}
      </div>

      <div className="grid-2">
        {/* Recent Tasks */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontWeight: 600 }}>Recent Tasks</h3>
            <Link to="/tasks" style={{ color: 'var(--primary)', fontSize: 13 }}>View all →</Link>
          </div>
          {recentTasks.length === 0 && <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>No tasks yet.</p>}
          {recentTasks.map(task => (
            <Link to={`/tasks/${task._id}`} key={task._id} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '10px 0', borderBottom: '1px solid var(--border)',
              textDecoration: 'none', color: 'inherit'
            }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 500 }}>{task.title}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  {task.project?.name} {task.assignedTo && `• ${task.assignedTo.name}`}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <span className={`badge badge-${task.priority}`}>{task.priority}</span>
                <span className={`badge badge-${task.status}`}>{task.status}</span>
              </div>
            </Link>
          ))}
        </div>

        {/* Projects */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontWeight: 600 }}>My Projects</h3>
            <Link to="/projects" style={{ color: 'var(--primary)', fontSize: 13 }}>View all →</Link>
          </div>
          {projects.length === 0 && <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>No projects yet.</p>}
          {projects.map(project => (
            <Link to={`/projects/${project._id}`} key={project._id} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '10px 0', borderBottom: '1px solid var(--border)',
              textDecoration: 'none', color: 'inherit'
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: 8, flexShrink: 0,
                background: project.color || '#6366f1'
              }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 500 }}>{project.name}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  {project.members?.length} member{project.members?.length !== 1 ? 's' : ''}
                </div>
              </div>
              <span className={`badge badge-${project.status}`}>{project.status}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
