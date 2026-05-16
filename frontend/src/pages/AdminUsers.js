import React, { useEffect, useState } from 'react';
import { userAPI } from '../utils/api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    userAPI.getAll().then(res => setUsers(res.data.data)).catch(() => toast.error('Failed to load users')).finally(() => setLoading(false));
  }, []);

  const updateRole = async (id, role) => {
    try {
      const res = await userAPI.updateRole(id, role);
      setUsers(users.map(u => u._id === id ? res.data.data : u));
      toast.success('Role updated');
    } catch {
      toast.error('Failed to update role');
    }
  };

  if (loading) return <div style={{ textAlign:'center', marginTop:60 }}>Loading...</div>;

  return (
    <div>
      <div className="page-header">
        <h1>User Management 👥</h1>
        <span style={{ color:'var(--text-muted)', fontSize:14 }}>{users.length} users total</span>
      </div>

      <div className="card" style={{ padding:0, overflow:'hidden' }}>
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <thead style={{ background:'var(--bg)' }}>
            <tr>
              {['User','Email','Role','Joined','Actions'].map(h => (
                <th key={h} style={{ padding:'12px 16px', textAlign:'left', fontSize:12, fontWeight:600, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.5px' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user._id} style={{ borderTop:'1px solid var(--border)' }}>
                <td style={{ padding:'14px 16px' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                    <div style={{ width:36, height:36, borderRadius:'50%', background:'var(--primary)', display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontWeight:700, fontSize:14 }}>
                      {user.name?.[0]}
                    </div>
                    <div style={{ fontWeight:500, fontSize:14 }}>{user.name}</div>
                  </div>
                </td>
                <td style={{ padding:'14px 16px', fontSize:14, color:'var(--text-muted)' }}>{user.email}</td>
                <td style={{ padding:'14px 16px' }}>
                  <span className={`badge badge-${user.role}`}>{user.role}</span>
                </td>
                <td style={{ padding:'14px 16px', fontSize:13, color:'var(--text-muted)' }}>
                  {format(new Date(user.createdAt), 'MMM d, yyyy')}
                </td>
                <td style={{ padding:'14px 16px' }}>
                  <select style={{ width:'auto', fontSize:13, padding:'4px 8px' }} value={user.role}
                    onChange={e => updateRole(user._id, e.target.value)}>
                    <option value="member">Member</option>
                    <option value="admin">Admin</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
