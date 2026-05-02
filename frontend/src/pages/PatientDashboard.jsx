import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import api from '../api';
import { useAuth } from '../context/AuthContext';

const socket = io();

export default function PatientDashboard() {
  const { user } = useAuth();
  const [departments, setDepartments] = useState([]);
  const [myQueues, setMyQueues] = useState([]);
  const [selectedDept, setSelectedDept] = useState('');
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');

  const fetchMyQueues = async () => {
    const res = await api.get('/queue/my');
    setMyQueues(res.data);
  };

  useEffect(() => {
    api.get('/departments').then(res => setDepartments(res.data));
    fetchMyQueues();

    socket.on('queue-update', fetchMyQueues);
    return () => socket.off('queue-update', fetchMyQueues);
  }, []);

  const joinQueue = async () => {
    if (!selectedDept) return setError('Please select a department');
    setError(''); setMsg('');
    try {
      const res = await api.post('/queue/join', { departmentId: selectedDept });
      setMsg(`Joined queue! Ticket #${res.data.ticketNumber} — ${res.data.ahead} people ahead.`);
      fetchMyQueues();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to join queue');
    }
  };

  const cancelQueue = async (id) => {
    try {
      await api.put(`/queue/cancel/${id}`);
      fetchMyQueues();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to cancel');
    }
  };

  return (
    <div className="container" style={{ marginTop: '1.5rem' }}>
      <h2>Welcome, {user.name}</h2>

      <div className="card">
        <h3>Join a Queue</h3>
        {error && <p className="error">{error}</p>}
        {msg && <p className="success-msg">{msg}</p>}
        <select value={selectedDept} onChange={e => setSelectedDept(e.target.value)}>
          <option value="">-- Select Department --</option>
          {departments.map(d => (
            <option key={d._id} value={d._id}>{d.name}</option>
          ))}
        </select>
        <button onClick={joinQueue}>Join Queue</button>
      </div>

      <div className="card">
        <h3>My Queue Today</h3>
        {myQueues.length === 0 && <p style={{ color: '#718096' }}>No active queues today.</p>}
        {myQueues.map(q => (
          <div key={q._id} className="queue-row">
            <div>
              <strong>{q.department?.name}</strong>
              <div style={{ fontSize: '0.85rem', color: '#718096' }}>
                Ticket #{q.ticketNumber} &nbsp;|&nbsp; Now serving: #{q.department?.currentServing || '—'}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span className={`badge ${q.status}`}>{q.status}</span>
              {q.status === 'waiting' && (
                <button className="danger" style={{ padding: '0.3rem 0.7rem', fontSize: '0.85rem' }}
                  onClick={() => cancelQueue(q._id)}>
                  Cancel
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="card">
        <h3>Live Queue Status</h3>
        {departments.map(d => (
          <div key={d._id} className="queue-row">
            <span>{d.name}</span>
            <span>Now serving: <strong>#{d.currentServing || '—'}</strong></span>
          </div>
        ))}
      </div>
    </div>
  );
}
