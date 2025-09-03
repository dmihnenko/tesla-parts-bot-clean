import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(username, password);
      navigate('/admin');
    } catch {
      setError('Неверный логин или пароль');
    }
  };

  return (
    <div style={{ maxWidth: '28rem', margin: '0 auto', padding: '3rem 1.5rem' }}>
      <h1 style={{ fontSize: '1.875rem', fontFamily: "'SF Pro Display', -apple-system, BlinkMacSystemFont, 'system-ui', sans-serif", fontWeight: '600', textAlign: 'center', marginBottom: '2rem', color: '#000000' }}>Вход в админ-панель</h1>
      <form onSubmit={handleSubmit} style={{ backgroundColor: '#ffffff', padding: '2rem', border: '1px solid #e5e5e7', borderRadius: '0.5rem' }}>
        {error && <p style={{ color: '#ef4444', marginBottom: '1.5rem' }}>{error}</p>}
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', color: '#636366', marginBottom: '0.5rem', fontWeight: '500' }}>Логин</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={{ width: '100%', padding: '0.75rem 1rem', border: '1px solid #d1d1d6', borderRadius: '0.375rem', backgroundColor: '#ffffff', color: '#000000', outline: 'none' }}
            required
          />
        </div>
        <div style={{ marginBottom: '2rem' }}>
          <label style={{ display: 'block', color: '#636366', marginBottom: '0.5rem', fontWeight: '500' }}>Пароль</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ width: '100%', padding: '0.75rem 1rem', border: '1px solid #d1d1d6', borderRadius: '0.375rem', backgroundColor: '#ffffff', color: '#000000', outline: 'none' }}
            required
          />
        </div>
        <button type="submit" className="btn btn-primary w-100">
          Войти
        </button>
      </form>
    </div>
  );
};

export default Login;