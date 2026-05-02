import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import api from '../api';
import { useAuth } from '../context/AuthContext';

const socket = io();

export default function DoctorDashboard() {
  const { user } = useAuth();
  const [queue, setQueue] = useState([]);
  const [currentServing, setCurrentServing] = useState(0);
  const [deptName, setDeptName] = useState('');
  const deptId = user.department;

  const fetchQueue = async () => {
    if (!deptId) return;
    const res = await api.get(`/queue/department/${deptId}`);
    setQueue(res.data.queue);
    setCurrentServing(res.data.currentServing);
  };

  useEffect(() => {
    if (deptId) {
      api.get('/departments').then(res => {
        const dept = res.data.find(d => d._id === deptId);
        if (dept) setDeptName(dept.name);
      });
      fetchQueue();
    }

    socket.on('queue-update', fetchQueue);
    return () => socket.off('queue-update', fetchQueue);
  }, [deptId]);

  const callNext = async () => {
    try {
      const res = await api.post(`/queue/next/${deptId}`);
      if (res.data.ticketNumber) setCurrentServing(res.data.ticketNumber);
      fetchQueue();
    } catch (err) {
      console.error(err);
    }
  };

  if (!deptId) return (
    <div className="container" style={{ marginTop: '2rem' }}>
      <div className="card">
        <p>No department assigned. Contact admin.</p>
      </div>
    </div>
  );

  const waiting = queue.filter(q => q.status === 'waiting');
  const serving = queue.find(q => q.status === 'serving');

  return (
    <div className="container" style={{ marginTop: '1.5rem' }}>
      <h2>Doctor Dashboard — {deptName}</h2>

      <div className="now-serving">
        <div style={{ fontSize: '0.9rem', color: '#4a5568', marginBottom: '0.3rem' }}>Now Serving</div>
        <div className="ticket-number">#{currentServing || '—'}</div>
        {serving && <div style={{ color: '#2d3748' }}>{serving.patient?.name}</div>}
      </div>

      <div className="card" style={{ textAlign: 'center' }}>
        <button className="success" style={{ fontSize: '1.1rem', padding: '0.8rem 2rem' }} onClick={callNext}>
          ➡ Call Next Patient
        </button>
        <p style={{ marginTop: '0.8rem', color: '#718096', fontSize: '0.9rem' }}>
          {waiting.length} patient(s) waiting
        </p>
      </div>

      <div className="card">
        <h3>Queue</h3>
        {queue.length === 0 && <p style={{ color: '#718096' }}>Queue is empty.</p>}
        {queue.map(q => (
          <div key={q._id} className="queue-row">
            <div>
              <strong>#{q.ticketNumber}</strong> — {q.patient?.name}
              <div style={{ fontSize: '0.8rem', color: '#718096' }}>{q.patient?.phone}</div>
            </div>
            <span className={`badge ${q.status}`}>{q.status}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
