import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { User } from '../types';
import { API_BASE_URL } from '../config/api';

const API_URL = `${API_BASE_URL}/api`;

export const useAuthStore = defineStore('auth', () => 
{
  const user = ref<User | null>(null);
  const token = ref<string | null>(localStorage.getItem('token'));
  const loading = ref(false);
  const error = ref<string | null>(null);

  const isAuthenticated = computed(() => !!token.value && !!user.value);
  const isAdmin = computed(() => user.value?.is_admin ?? false);

  async function signup(email: string, username: string, password: string) 
  {
    loading.value = true;
    error.value = null;
    
    try 
    {
      const response = await fetch(`${API_URL}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, username, password })
      });
      
      const data = await response.json();
      
      if (!response.ok) 
      {
        throw new Error(data.error || 'Registrierung fehlgeschlagen');
      }
      
      token.value = data.token;
      user.value = data.user;
      localStorage.setItem('token', data.token);
      
      return true;
    }
    catch (err: unknown) 
    {
      const errorMessage = err instanceof Error ? err.message : String(err);
      error.value = errorMessage;
      return false;
    }
    finally 
    {
      loading.value = false;
    }
  }

  async function login(email: string, password: string) 
  {
    loading.value = true;
    error.value = null;
    
    try 
    {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      
      const data = await response.json();
      
      if (!response.ok) 
      {
        throw new Error(data.error || 'Login fehlgeschlagen');
      }
      
      token.value = data.token;
      user.value = data.user;
      localStorage.setItem('token', data.token);
      
      return true;
    }
    catch (err: unknown) 
    {
      const errorMessage = err instanceof Error ? err.message : String(err);
      error.value = errorMessage;
      return false;
    }
    finally 
    {
      loading.value = false;
    }
  }

  async function fetchCurrentUser() 
  {
    if (!token.value) return false;
    
    try 
    {
      const response = await fetch(`${API_URL}/auth/me`, {
        headers: { 'Authorization': `Bearer ${token.value}` }
      });
      
      if (!response.ok) 
      {
        logout();
        return false;
      }
      
      const data = await response.json();
      user.value = data.user;
      return true;
    }
    catch 
    {
      logout();
      return false;
    }
  }

  function logout() 
  {
    token.value = null;
    user.value = null;
    localStorage.removeItem('token');
  }

  return {
    user,
    token,
    loading,
    error,
    isAuthenticated,
    isAdmin,
    signup,
    login,
    fetchCurrentUser,
    logout
  };
});

