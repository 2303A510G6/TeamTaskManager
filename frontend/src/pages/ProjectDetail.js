import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { projectAPI, taskAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

export default function ProjectDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [memberEmail, setMemberEmail] = useState('');
  const [addingMember, setAddingMember] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [projRes, tasksRes] = await Promise.all([
          projectAPI.getOne(id),
          taskAPI.getAll({ project: id })
        ]);
        setProject(projRes.data.data);
        setTasks(tasksRes.data.data);
      } catch (err) {
        toast.error('Failed to load project');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const addMember = async (e) => {
    e.preventDefault();
    setAddingMember(true);
    try {
      await projectAPI.addMember(id, { email: memberEmail, role: 'member' });
      // Reload project to get updated members list
      const projRes = await projectAPI.getOne(id);
      setProject(projRes.data.data);
      setMemberEmail('');
      toast.success('Member added!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add member');
    } finally {
      setAddingMember(false);
    }
  };

  const removeMember = async (userId) => {
    if (!window.confirm('Remove this member?')) return;
    try {
      await projectAPI.removeMember(id, userId);
      setProject({ ...project, members: project.members.filter(m => m.user.id !== userId) });
      toast.success('Member removed');
    } catch (err) {
      toast.error('Failed to remove');
    }
  };

  if (loading) return <div style={{ textAlign:'center', marginTop:60 }}>Loading...</div>;
  if (!project) return <div>Project not found</div>;

  const isOwner = project.owner?.id === user?.id || project.owner?.id === user?.id;
  const isAdmin = user?.role === 'admin';
  const canManage = isOwner || isAdmin;

  const tasksByStatus = {
    'todo': tasks.filter(t => t.status === 'todo'),
    'in-progress': tasks.filter(t => t.status === 'in-progress'),
    'review': tasks.filter(t => t.status === 'review'),
    'done': tasks.filter(t => t.status === 'done'),
  };

  return (
    <div>
      <div style={{ marginBottom:8 }}>
        <Link to="/projects" style={{ color:'var(--text-muted)', fontSize:14 }}>← Projects</Link>
      </div>

      <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:24 }}>
        <div style={{ width:16, height:40, borderRadius:4, background: project.color }} />
        <div style={{ flex:1 }}>
          <h1 style={{ fontSize:24, fontWeight:700 }}>{project.name}</h1>
          <p style={{ color:'var(--text-muted)', fontSize:14 }}>{project.description}</p>
        </div>
        <span className={`badge badge-${project.status}`} style={{ fontSize:13, padding:'4px 14px' }}>{project.status}</span>
      </div>

      <div className="grid-2" style={{ marginBottom:24 }}>
        {/* Members */}
        <div className="card">
          <h3 style={{ fontWeight:600, marginBottom:16 }}>Team Members</h3>
          {project.members?.map(m => (
            <div key={m.user.id} style={{
              display:'flex', justifyContent:'space-between', alignItems:'center',
              padding:'8px 0', borderBottom:'1px solid var(--border)'
            }}>
              <div>
                <div style={{ fontSize:14, fontWeight:500 }}>{m.user.name}</div>
                <div style={{ fontSize:12, color:'var(--text-muted)' }}>{m.user.email}</div>
              </div>
              <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                <span className={`badge badge-${m.role}`}>{m.role}</span>
                {canManage && m.user.id !== project.owner.id && (
                  <button className="btn btn-danger btn-sm" onClick={() => removeMember(m.user.id)}>✕</button>
                )}
              </div>
            </div>
          ))}

          {canManage && (
            <form onSubmit={addMember} style={{ display:'flex', gap:8, marginTop:16 }}>
              <input placeholder="Add by email..." value={memberEmail}
                onChange={e => setMemberEmail(e.target.value)} required style={{ flex:1 }} />
              <button className="btn btn-primary btn-sm" type="submit" disabled={addingMember}>
                {addingMember ? '...' : 'Add'}
              </button>
            </form>
          )}
        </div>

        {/* Task summary */}
        <div className="card">
          <h3 style={{ fontWeight:600, marginBottom:16 }}>Task Summary</h3>
          {Object.entries(tasksByStatus).map(([status, items]) => (
            <div key={status} style={{
              display:'flex', justifyContent:'space-between', alignItems:'center',
              padding:'8px 0', borderBottom:'1px solid var(--border)'
            }}>
              <span className={`badge badge-${status}`}>{status}</span>
              <span style={{ fontWeight:600 }}>{items.length}</span>
            </div>
          ))}
          <div style={{ marginTop:16 }}>
            <Link to={`/tasks?project=${id}`} className="btn btn-primary btn-sm">View All Tasks</Link>
          </div>
        </div>
      </div>

      {/* Kanban-style task list */}
      <h3 style={{ fontWeight:700, marginBottom:16 }}>Tasks</h3>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:16 }}>
        {Object.entries(tasksByStatus).map(([status, items]) => (
          <div key={status}>
            <div style={{ fontWeight:600, fontSize:13, marginBottom:12, textTransform:'uppercase',
              letterSpacing:'0.5px', color:'var(--text-muted)' }}>
              {status} ({items.length})
            </div>
            {items.map(task => (
              <Link to={`/tasks/${task.id}`} key={task.id} style={{ display:'block', textDecoration:'none' }}>
                <div className="card" style={{ padding:12, marginBottom:8, cursor:'pointer',
                  borderLeft:`3px solid ${task.priority==='urgent'?'#ef4444':task.priority==='high'?'#f59e0b':'#6366f1'}` }}>
                  <div style={{ fontSize:13, fontWeight:500, marginBottom:6 }}>{task.title}</div>
                  {task.assignedTo && (
                    <div style={{ fontSize:11, color:'var(--text-muted)' }}>👤 {task.assignedTo.name}</div>
                  )}
                  {task.dueDate && (
                    <div style={{ fontSize:11, color: task.isOverdue ? 'var(--danger)' : 'var(--text-muted)', marginTop:4 }}>
                      📅 {format(new Date(task.dueDate), 'MMM d')}
                      {task.isOverdue && ' ⚠️'}
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}