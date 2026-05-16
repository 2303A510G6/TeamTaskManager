import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { to: '/dashboard', label: '📊 Dashboard' },
    { to: '/projects', label: '📁 Projects' },
    { to: '/tasks', label: '✅ Tasks' },
    ...(user?.role === 'admin' ? [{ to: '/admin/users', label: '👥 Users (Admin)' }] : [])
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <aside style={{
        width: '240px', background: '#1e1b4b', color: 'white',
        display: 'flex', flexDirection: 'column', position: 'fixed',
        height: '100vh', zIndex: 100, transition: 'transform 0.3s',
        transform: sidebarOpen ? 'translateX(0)' : undefined
      }}>
        <div style={{ padding: '24px 20px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 700, letterSpacing: '-0.5px' }}>
            ⚡ TaskFlow
          </h2>
          <p style={{ fontSize: '11px', opacity: 0.6, marginTop: 4 }}>Team Task Manager</p>
        </div>

        <nav style={{ padding: '16px 12px', flex: 1 }}>
          {navItems.map(({ to, label }) => (
            <NavLink key={to} to={to} style={({ isActive }) => ({
              display: 'block', padding: '10px 12px', borderRadius: '8px',
              marginBottom: '4px', fontSize: '14px', fontWeight: 500,
              color: isActive ? 'white' : 'rgba(255,255,255,0.65)',
              background: isActive ? 'rgba(99,102,241,0.4)' : 'transparent',
              transition: 'all 0.2s'
            })}>
              {label}
            </NavLink>
          ))}
        </nav>

        <div style={{ padding: '16px 20px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ fontSize: '13px', marginBottom: '12px' }}>
            <div style={{ fontWeight: 600 }}>{user?.name}</div>
            <div style={{ opacity: 0.6, fontSize: '11px' }}>{user?.email}</div>
            <span style={{
              display: 'inline-block', marginTop: '4px', padding: '1px 8px',
              borderRadius: '10px', fontSize: '10px', fontWeight: 700,
              background: user?.role === 'admin' ? '#7c3aed' : '#475569',
              textTransform: 'uppercase'
            }}>{user?.role}</span>
          </div>
          <button onClick={handleLogout} className="btn btn-outline btn-sm"
            style={{ color: 'rgba(255,255,255,0.8)', borderColor: 'rgba(255,255,255,0.2)', width: '100%' }}>
            🚪 Logout
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main style={{ marginLeft: '240px', flex: 1, padding: '28px', minHeight: '100vh' }}>
        <Outlet />
      </main>
    </div>
  );
}
