import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { taskAPI, projectAPI } from '../utils/api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

function TaskModal({ task, projects, onClose, onSave }) {
  const [form, setForm] = useState(task || {
    title:'', description:'', project:'', assignedTo:'',
    priority:'medium', status:'todo', dueDate:'', tags:''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const data = { ...form, tags: typeof form.tags === 'string' ? form.tags.split(',').map(t=>t.trim()).filter(Boolean) : form.tags };
    try {
      if (task) {
        const res = await taskAPI.update(task.id, data);
        onSave(res.data.data, 'update');
        toast.success('Task updated!');
      } else {
        const res = await taskAPI.create(data);
        onSave(res.data.data, 'create');
        toast.success('Task created!');
      }
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000 }}>
      <div className="card" style={{ width:'100%',maxWidth:520,padding:32,maxHeight:'90vh',overflowY:'auto' }}>
        <h3 style={{ marginBottom:20,fontWeight:700 }}>{task ? 'Edit Task' : 'New Task'}</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Title</label>
            <input value={form.title} onChange={e=>setForm({...form,title:e.target.value})} required />
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea rows={3} value={form.description} onChange={e=>setForm({...form,description:e.target.value})} />
          </div>
          <div className="form-group">
            <label>Project *</label>
            <select value={form.project?.id||form.project} onChange={e=>setForm({...form,project:e.target.value})} required>
              <option value="">Select project</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div className="grid-2">
            <div className="form-group">
              <label>Priority</label>
              <select value={form.priority} onChange={e=>setForm({...form,priority:e.target.value})}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
            <div className="form-group">
              <label>Status</label>
              <select value={form.status} onChange={e=>setForm({...form,status:e.target.value})}>
                <option value="todo">To Do</option>
                <option value="in-progress">In Progress</option>
                <option value="review">Review</option>
                <option value="done">Done</option>
              </select>
            </div>
          </div>
          <div className="form-group">
            <label>Due Date</label>
            <input type="date" value={form.dueDate?form.dueDate.substring(0,10):''} onChange={e=>setForm({...form,dueDate:e.target.value})} />
          </div>
          <div className="form-group">
            <label>Tags (comma separated)</label>
            <input value={Array.isArray(form.tags)?form.tags.join(', '):form.tags} onChange={e=>setForm({...form,tags:e.target.value})} placeholder="bug, feature, urgent" />
          </div>
          <div style={{ display:'flex',gap:10,justifyContent:'flex-end',marginTop:8 }}>
            <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>{loading?'Saving...':'Save'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [filters, setFilters] = useState({ status:'', priority:'', project:'' });

  useEffect(() => {
    const load = async () => {
      try {
        const [tasksRes, projectsRes] = await Promise.all([
          taskAPI.getAll(filters),
          projectAPI.getAll()
        ]);
        setTasks(tasksRes.data.data);
        setProjects(projectsRes.data.data);
      } catch (err) {
        toast.error('Failed to load');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [filters]);

  const handleSave = (task, type) => {
    if (type === 'create') setTasks([task, ...tasks]);
    else setTasks(tasks.map(t => t.id === task.id ? task : t));
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this task?')) return;
    try {
      await taskAPI.delete(id);
      setTasks(tasks.filter(t => t.id !== id));
      toast.success('Deleted');
    } catch (err) {
      toast.error('Failed to delete');
    }
  };

  if (loading) return <div style={{ textAlign:'center', marginTop:60 }}>Loading...</div>;

  return (
    <div>
      <div className="page-header">
        <h1>Tasks ✅</h1>
        <button className="btn btn-primary" onClick={() => setModal('new')}>+ New Task</button>
      </div>

      {/* Filters */}
      <div style={{ display:'flex', gap:12, marginBottom:24, flexWrap:'wrap' }}>
        <select style={{ width:'auto' }} value={filters.status} onChange={e=>setFilters({...filters,status:e.target.value})}>
          <option value="">All Status</option>
          <option value="todo">To Do</option>
          <option value="in-progress">In Progress</option>
          <option value="review">Review</option>
          <option value="done">Done</option>
        </select>
        <select style={{ width:'auto' }} value={filters.priority} onChange={e=>setFilters({...filters,priority:e.target.value})}>
          <option value="">All Priority</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="urgent">Urgent</option>
        </select>
        <select style={{ width:'auto' }} value={filters.project} onChange={e=>setFilters({...filters,project:e.target.value})}>
          <option value="">All Projects</option>
          {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>

      {tasks.length === 0 && (
        <div className="card" style={{ textAlign:'center', padding:60 }}>
          <div style={{ fontSize:48, marginBottom:16 }}>✅</div>
          <h3>No tasks found</h3>
        </div>
      )}

      <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
        {tasks.map(task => (
          <div key={task.id} className="card" style={{
            padding:'14px 20px', display:'flex', alignItems:'center', gap:16,
            borderLeft:`4px solid ${task.priority==='urgent'?'#ef4444':task.priority==='high'?'#f59e0b':task.priority==='medium'?'#6366f1':'#10b981'}`
          }}>
            <div style={{ flex:1, minWidth:0 }}>
              <Link to={`/tasks/${task.id}`} style={{ fontSize:15, fontWeight:500, display:'block', marginBottom:4 }}>
                {task.title}
              </Link>
              <div style={{ fontSize:12, color:'var(--text-muted)', display:'flex', gap:12, flexWrap:'wrap' }}>
                <span>📁 {task.project?.name}</span>
                {task.assignedTo && <span>👤 {task.assignedTo.name}</span>}
                {task.dueDate && <span className={task.isOverdue ? 'overdue' : ''}>
                  📅 {format(new Date(task.dueDate), 'MMM d, yyyy')}
                  {task.isOverdue && ' (Overdue!)'}
                </span>}
              </div>
            </div>
            <div style={{ display:'flex', gap:8, alignItems:'center', flexShrink:0 }}>
              {task.tags?.map(tag => <span key={tag} style={{ fontSize:11, background:'#f1f5f9', padding:'2px 8px', borderRadius:4, color:'#475569' }}>{tag}</span>)}
              <span className={`badge badge-${task.priority}`}>{task.priority}</span>
              <span className={`badge badge-${task.status}`}>{task.status}</span>
              <button className="btn btn-outline btn-sm" onClick={() => setModal(task)}>Edit</button>
              <button className="btn btn-danger btn-sm" onClick={() => handleDelete(task.id)}>✕</button>
            </div>
          </div>
        ))}
      </div>

      {modal && (
        <TaskModal
          task={modal === 'new' ? null : modal}
          projects={projects}
          onClose={() => setModal(null)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
