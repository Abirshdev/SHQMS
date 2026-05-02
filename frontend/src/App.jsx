import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import PatientDashboard from './pages/PatientDashboard';
import AdminDashboard from './pages/AdminDashboard';
import DoctorDashboard from './pages/DoctorDashboard';

function Nav() {
  const { user, logout } = useAuth();
  return (
    <nav>
      <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>🏥 Hospital Queue</span>
      <div>
        {user ? (
          <>
            <span style={{ marginRight: '1rem', opacity: 0.85 }}>
              {user.name} ({user.role})
            </span>
            <button onClick={logout} style={{ padding: '0.3rem 0.8rem', fontSize: '0.9rem' }}>
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login">Login</Link>
            <Link to="/register">Register</Link>
          </>
        )}
      </div>
    </nav>
  );
}

function PrivateRoute({ children, roles }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="container" style={{ marginTop: '2rem' }}>Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" />;
  return children;
}

function Home() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;
  if (user.role === 'admin') return <Navigate to="/admin" />;
  if (user.role === 'doctor') return <Navigate to="/doctor" />;
  return <Navigate to="/patient" />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Nav />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/patient" element={
            <PrivateRoute roles={['patient']}>
              <PatientDashboard />
            </PrivateRoute>
          } />
          <Route path="/admin" element={
            <PrivateRoute roles={['admin']}>
              <AdminDashboard />
            </PrivateRoute>
          } />
          <Route path="/doctor" element={
            <PrivateRoute roles={['doctor']}>
              <DoctorDashboard />
            </PrivateRoute>
          } />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
