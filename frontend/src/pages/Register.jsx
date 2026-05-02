import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', phone: '', password: '' });
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await register(form.name, form.phone, form.password);
      navigate('/patient');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    }
  };

  return (
    <div className="container" style={{ maxWidth: 400, marginTop: '3rem' }}>
      <div className="card">
        <h2>Patient Registration</h2>
        {error && <p className="error">{error}</p>}
        <form onSubmit={handleSubmit}>
          <input
            placeholder="Full name"
            value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
            required
          />
          <input
            placeholder="Phone number"
            value={form.phone}
            onChange={e => setForm({ ...form, phone: e.target.value })}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={e => setForm({ ...form, password: e.target.value })}
            required
          />
          <button type="submit">Register</button>
        </form>
        <p style={{ marginTop: '1rem', fontSize: '0.9rem' }}>
          Have an account? <Link to="/login">Login</Link>
        </p>
      </div>
    </div>
  );
}
