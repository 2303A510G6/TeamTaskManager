import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { projectAPI } from '../utils/api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const COLORS = ['#6366f1','#10b981','#f59e0b','#ef4444','#3b82f6','#8b5cf6','#ec4899','#14b8a6'];

function ProjectModal({ project, onClose, onSave }) {
  const [form, setForm] = useState(project || { name:'', description:'', status:'active', deadline:'', color:'#6366f1' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (project) {
        const res = await projectAPI.update(project.id, form);
        onSave(res.data.data, 'update');
        toast.success('Project updated!');
      } else {
        const res = await projectAPI.create(form);
        onSave(res.data.data, 'create');
        toast.success('Project created!');
      }
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',display:'flex',
      alignItems:'center',justifyContent:'center',zIndex:1000
    }}>
      <div className="card" style={{ width: '100%', maxWidth: 480, padding: 32 }}>
        <h3 style={{ marginBottom: 20, fontWeight: 700 }}>{project ? 'Edit Project' : 'New Project'}</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Name</label>
            <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea rows={3} value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
          </div>
          <div className="grid-2">
            <div className="form-group">
              <label>Status</label>
              <select value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
                <option value="active">Active</option>
                <option value="on-hold">On Hold</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            <div className="form-group">
              <label>Deadline</label>
              <input type="date" value={form.deadline ? form.deadline.substring(0,10) : ''} onChange={e => setForm({...form, deadline: e.target.value})} />
            </div>
          </div>
          <div className="form-group">
            <label>Color</label>
            <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
              {COLORS.map(c => (
                <div key={c} onClick={() => setForm({...form, color: c})} style={{
                  width:28, height:28, borderRadius:'50%', background:c, cursor:'pointer',
                  border: form.color===c ? '3px solid #1e293b' : '2px solid white',
                  boxShadow: '0 0 0 1px #e2e8f0'
                }} />
              ))}
            </div>
          </div>
          <div style={{ display:'flex', gap:10, justifyContent:'flex-end', marginTop:8 }}>
            <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Saving...' : 'Save'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);

  useEffect(() => {
    projectAPI.getAll().then(res => setProjects(res.data.data)).finally(() => setLoading(false));
  }, []);

  const handleSave = (project, type) => {
    if (type === 'create') setProjects([project, ...projects]);
    else setProjects(projects.map(p => p.id === project.id ? project : p));
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this project and all its tasks?')) return;
    try {
      await projectAPI.delete(id);
      setProjects(projects.filter(p => p.id !== id));
      toast.success('Project deleted');
    } catch (err) {
      toast.error('Failed to delete');
    }
  };

  if (loading) return <div style={{ textAlign:'center', marginTop:60 }}>Loading...</div>;

  return (
    <div>
      <div className="page-header">
        <h1>Projects 📁</h1>
        <button className="btn btn-primary" onClick={() => setModal('new')}>+ New Project</button>
      </div>

      {projects.length === 0 && (
        <div className="card" style={{ textAlign:'center', padding:60 }}>
          <div style={{ fontSize:48, marginBottom:16 }}>📁</div>
          <h3>No projects yet</h3>
          <p style={{ color:'var(--text-muted)', marginTop:8 }}>Create your first project to get started.</p>
        </div>
      )}

      <div className="grid-3">
        {projects.map(project => (
          <div key={project.id} className="card" style={{ padding:0, overflow:'hidden' }}>
            <div style={{ height:6, background: project.color || '#6366f1' }} />
            <div style={{ padding:20 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                <Link to={`/projects/${project.id}`} style={{ fontSize:16, fontWeight:600, flex:1 }}>
                  {project.name}
                </Link>
                <span className={`badge badge-${project.status}`}>{project.status}</span>
              </div>
              <p style={{ color:'var(--text-muted)', fontSize:13, margin:'8px 0', lineHeight:1.5 }}>
                {project.description || 'No description'}
              </p>
              <div style={{ fontSize:12, color:'var(--text-muted)', marginBottom:16 }}>
                👤 {project.owner?.name} &nbsp;•&nbsp; 👥 {project.members?.length} members
                {project.deadline && <span>&nbsp;•&nbsp; 📅 {format(new Date(project.deadline),'MMM d, yyyy')}</span>}
              </div>
              <div style={{ display:'flex', gap:8 }}>
                <Link to={`/projects/${project.id}`} className="btn btn-outline btn-sm">View</Link>
                <button className="btn btn-outline btn-sm" onClick={() => setModal(project)}>Edit</button>
                <button className="btn btn-danger btn-sm" onClick={() => handleDelete(project.id)}>Delete</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {modal && (
        <ProjectModal
          project={modal === 'new' ? null : modal}
          onClose={() => setModal(null)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
