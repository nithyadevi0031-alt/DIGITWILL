import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

export function useAuth(required = false) {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      const token = localStorage.getItem('digital_will_token');
      if (!token) {
        setUser(null);
        setLoading(false);
        if (required) navigate('/login');
        return;
      }

      try {
        const payload = await api.get('/api/auth/profile');
        setUser(payload.user);
      } catch (error) {
        localStorage.removeItem('digital_will_token');
        setUser(null);
        if (required) navigate('/login');
      } finally {
        setLoading(false);
      }
    }

    loadUser();
  }, [navigate, required]);

  return { user, loading };
}
