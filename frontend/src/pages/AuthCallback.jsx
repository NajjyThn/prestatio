import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function AuthCallback() {
  const navigate = useNavigate();
  const { login } = useAuth();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const userStr = params.get('user');
    const error = params.get('error');

    if (error) {
      navigate(`/login?error=${error}`);
      return;
    }

    if (token && userStr) {
      try {
        const user = JSON.parse(decodeURIComponent(userStr));
        login(user, token);
        navigate(user.role === 'professional' ? '/pro' : '/dashboard');
      } catch (err) {
        navigate('/login');
      }
    } else {
      navigate('/login');
    }
  }, [navigate, login]);

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#fff9f9', fontFamily: 'DM Sans' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>💄</div>
        <div style={{ fontSize: 16, color: '#888' }}>Connexion en cours...</div>
      </div>
    </div>
  );
}