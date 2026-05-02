import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import api from '../api';

const socket = io();

export default function AdminDashboard() {
  const [tab, setTab] = useState('queue');
  const [queues, setQueues] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [deptForm, setDeptForm] = useState({ name: '', description: '' });
  const [staffForm, setStaffForm] = useState({ name: '', phone: '', password: '', role: 'doctor', department: '' });
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  const fetchAll = async () => {
    const [q, d] = await Promise.all([
      api.get('/queue/admin/today'),
      api.get('/departments')
    ]);
    setQueues(q.data);
    setDepartments(d.data);
  };

  useEffect(() => {
    fetchAll();
    socket.on('queue-update', fetchAll);
    return () => socket.off('queue-update', fetchAll);
  }, []);

  const createDept = async (e) => {
    e.preventDefault();
    setError(''); setMsg('');
    try {
      await api.post('/departments', deptForm);
      setMsg('Department created');
      setDeptForm({ name: '', description: '' });
      fetchAll();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed');
    }
  };

  const deleteDept = async (id) => {
    if (!window.confirm('Delete this department?')) return;
    await api.delete(`/departments/${id}`);
    fetchAll();
  };

  const createStaff = async (e) => {
    e.preventDefault();
    setError(''); setMsg('');
    try {
      await api.post('/auth/create-staff', staffForm);
      setMsg('Staff account created');
      setStaffForm({ name: '', phone: '', password: '', role: 'doctor', department: '' });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed');
    }
  };

  const cancelEntry = async (id) => {
    await api.put(`/queue/cancel/${id}`);
    fetchAll();
  };

  const stats = {
    total: queues.length,
    waiting: queues.filter(q => q.status === 'waiting').length,
    serving: queues.filter(q => q.status === 'serving').length,
    completed: queues.filter(q => q.status === 'completed').length,
  };

  return (
    <div className="container" style={{ marginTop: '1.5rem' }}>
      <h2>Admin Dashboard</h2>

      {/* Stats */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {[['Total', stats.total, '#2b6cb0'], ['Waiting', stats.waiting, '#d69e2e'],
          ['Serving', stats.serving, '#38a169'], ['Completed', stats.completed, '#718096']].map(([label, val, color]) => (
          <div key={label} className="card" style={{ flex: 1, minWidth: 120, textAlign: 'center', borderTop: `4px solid ${color}` }}>
            <div style={{ fontSize: '2rem', fontWeight: 700, color }}>{val}</div>
            <div style={{ color: '#718096', fontSize: '0.9rem' }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
        {['queue', 'departments', 'staff'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            style={{ background: tab === t ? '#2b6cb0' : '#e2e8f0', color: tab === t ? 'white' : '#4a5568' }}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {error && <p className="error">{error}</p>}
      {msg && <p className="success-msg">{msg}</p>}

      {/* Queue Tab */}
      {tab === 'queue' && (
        <div className="card">
          <h3>Today's Queue</h3>
          {queues.length === 0 && <p style={{ color: '#718096' }}>No queue entries today.</p>}
          {queues.map(q => (
            <div key={q._id} className="queue-row">
              <div>
                <strong>#{q.ticketNumber}</strong> — {q.patient?.name}
                <div style={{ fontSize: '0.8rem', color: '#718096' }}>
                  {q.department?.name} | {q.patient?.phone}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span className={`badge ${q.status}`}>{q.status}</span>
                {['waiting', 'serving'].includes(q.status) && (
                  <button className="danger" style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}
                    onClick={() => cancelEntry(q._id)}>
                    Cancel
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Departments Tab */}
      {tab === 'departments' && (
        <>
          <div className="card">
            <h3>Add Department</h3>
            <form onSubmit={createDept}>
              <input placeholder="Department name" value={deptForm.name}
                onChange={e => setDeptForm({ ...deptForm, name: e.target.value })} required />
              <input placeholder="Description (optional)" value={deptForm.description}
                onChange={e => setDeptForm({ ...deptForm, description: e.target.value })} />
              <button type="submit">Add</button>
            </form>
          </div>
          <div className="card">
            <h3>Departments</h3>
            {departments.map(d => (
              <div key={d._id} className="queue-row">
                <div>
                  <strong>{d.name}</strong>
                  {d.description && <div style={{ fontSize: '0.85rem', color: '#718096' }}>{d.description}</div>}
                </div>
                <button className="danger" style={{ padding: '0.3rem 0.7rem', fontSize: '0.85rem' }}
                  onClick={() => deleteDept(d._id)}>
                  Delete
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Staff Tab */}
      {tab === 'staff' && (
        <div className="card">
          <h3>Create Staff Account</h3>
          <form onSubmit={createStaff}>
            <input placeholder="Full name" value={staffForm.name}
              onChange={e => setStaffForm({ ...staffForm, name: e.target.value })} required />
            <input placeholder="Phone number" value={staffForm.phone}
              onChange={e => setStaffForm({ ...staffForm, phone: e.target.value })} required />
            <input type="password" placeholder="Password" value={staffForm.password}
              onChange={e => setStaffForm({ ...staffForm, password: e.target.value })} required />
            <select value={staffForm.role} onChange={e => setStaffForm({ ...staffForm, role: e.target.value })}>
              <option value="doctor">Doctor</option>
              <option value="admin">Admin</option>
            </select>
            {staffForm.role === 'doctor' && (
              <select value={staffForm.department}
                onChange={e => setStaffForm({ ...staffForm, department: e.target.value })} required>
                <option value="">-- Assign Department --</option>
                {departments.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
              </select>
            )}
            <button type="submit">Create Staff</button>
          </form>
        </div>
      )}
    </div>
  );
}
