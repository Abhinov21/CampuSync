import { useAuthStore } from '../store/authStore';
import api from '../utils/api';
import toast from 'react-hot-toast';

export const useAuth = () => {
  const { user, token, setUser, setToken, logout: logoutStore } = useAuthStore();

  const login = async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      const { token, user } = response.data.data;
      setToken(token);
      setUser(user);
      toast.success('Login successful!');
      return { token, user };
    } catch (error) {
      const message = error.response?.data?.message || 'Login failed';
      toast.error(message);
      throw error;
    }
  };

  const register = async (data) => {
    try {
      const response = await api.post('/auth/register', data);
      const { token, user } = response.data.data;
      setToken(token);
      setUser(user);
      toast.success('Registration successful!');
      return { token, user };
    } catch (error) {
      const message = error.response?.data?.message || 'Registration failed';
      toast.error(message);
      throw error;
    }
  };

  const logout = () => {
    logoutStore();
    toast.success('Logged out successfully');
  };

  return { user, token, login, register, logout, isAuthenticated: !!token };
};
