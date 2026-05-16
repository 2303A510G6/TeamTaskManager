import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { taskAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

export default function TaskDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [task, setTask] = useState(null);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    taskAPI.getOne(id).then(res => setTask(res.data.data)).catch(() => toast.error('Task not found')).finally(() => setLoading(false));
  }, [id]);

  const updateStatus = async (status) => {
    try {
      const res = await taskAPI.update(id, { status });
      setTask({ ...task, status: res.data.data.status });
      toast.success('Status updated');
    } catch {
      toast.error('Failed');
    }
  };

  const addComment = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;
    try {
      const res = await taskAPI.addComment(id, { text: comment });
      setTask({ ...task, comments: res.data.data });
      setComment('');
    } catch {
      toast.error('Failed to add comment');
    }
  };

  const deleteTask = async () => {
    if (!window.confirm('Delete this task?')) return;
    try {
      await taskAPI.delete(id);
      toast.success('Task deleted');
      navigate('/tasks');
    } catch {
      toast.error('Failed to delete');
    }
  };

  if (loading) return <div style={{ textAlign:'center', marginTop:60 }}>Loading...</div>;
  if (!task) return <div>Task not found</div>;

  return (
    <div style={{ maxWidth:800, margin:'0 auto' }}>
      <div style={{ marginBottom:16 }}>
        <Link to="/tasks" style={{ color:'var(--text-muted)', fontSize:14 }}>← Tasks</Link>
      </div>

      <div className="card" style={{ marginBottom:20 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:16 }}>
          <h1 style={{ fontSize:22, fontWeight:700, flex:1 }}>{task.title}</h1>
          <button className="btn btn-danger btn-sm" onClick={deleteTask}>Delete</button>
        </div>

        {task.description && <p style={{ color:'var(--text-muted)', marginBottom:16, lineHeight:1.6 }}>{task.description}</p>}

        <div style={{ display:'grid', gridTemplateColumns:'repeat(2, 1fr)', gap:16, marginBottom:20 }}>
          {[
            { label:'Project', value: task.project?.name },
            { label:'Assigned To', value: task.assignedTo?.name || 'Unassigned' },
            { label:'Created By', value: task.createdBy?.name },
            { label:'Due Date', value: task.dueDate ? format(new Date(task.dueDate), 'PPP') : 'No due date' },
          ].map(({ label, value }) => (
            <div key={label}>
              <div style={{ fontSize:11, color:'var(--text-muted)', fontWeight:600, textTransform:'uppercase', marginBottom:4 }}>{label}</div>
              <div style={{ fontSize:14, fontWeight:500 }}>{value}</div>
            </div>
          ))}
        </div>

        <div style={{ display:'flex', gap:8, flexWrap:'wrap', alignItems:'center' }}>
          <span className={`badge badge-${task.priority}`} style={{ fontSize:13 }}>🏷️ {task.priority}</span>
          <span className={`badge badge-${task.status}`} style={{ fontSize:13 }}>📋 {task.status}</span>
          {task.isOverdue && <span className="badge" style={{ background:'#fef2f2', color:'#b91c1c', fontSize:13 }}>⚠️ Overdue</span>}
          {task.tags?.map(tag => <span key={tag} style={{ fontSize:11, background:'#f1f5f9', padding:'3px 10px', borderRadius:4, color:'#475569' }}>{tag}</span>)}
        </div>
      </div>

      {/* Status control */}
      <div className="card" style={{ marginBottom:20 }}>
        <h3 style={{ fontWeight:600, marginBottom:12 }}>Update Status</h3>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
          {['todo','in-progress','review','done'].map(s => (
            <button key={s} onClick={() => updateStatus(s)}
              className={`btn ${task.status===s ? 'btn-primary' : 'btn-outline'} btn-sm`}
              style={{ textTransform:'capitalize' }}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Comments */}
      <div className="card">
        <h3 style={{ fontWeight:600, marginBottom:16 }}>Comments ({task.comments?.length || 0})</h3>
        {task.comments?.map((c, i) => (
          <div key={i} style={{ padding:'12px 0', borderBottom:'1px solid var(--border)' }}>
            <div style={{ display:'flex', gap:8, alignItems:'center', marginBottom:6 }}>
              <div style={{ width:28, height:28, borderRadius:'50%', background:'var(--primary)', display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontSize:12, fontWeight:700 }}>
                {c.user?.name?.[0]}
              </div>
              <div>
                <span style={{ fontWeight:500, fontSize:13 }}>{c.user?.name}</span>
                <span style={{ color:'var(--text-muted)', fontSize:11, marginLeft:8 }}>
                  {format(new Date(c.createdAt), 'MMM d, h:mm a')}
                </span>
              </div>
            </div>
            <p style={{ fontSize:14, color:'var(--text)', paddingLeft:36 }}>{c.text}</p>
          </div>
        ))}
        <form onSubmit={addComment} style={{ display:'flex', gap:8, marginTop:16 }}>
          <input placeholder="Add a comment..." value={comment} onChange={e => setComment(e.target.value)} style={{ flex:1 }} />
          <button className="btn btn-primary" type="submit">Send</button>
        </form>
      </div>
    </div>
  );
}
