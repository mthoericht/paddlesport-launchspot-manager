import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { User } from '../types';
import { login as apiLogin, signup as apiSignup, fetchCurrentUser } from '../api/auth';

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
      const data = await apiSignup(email, username, password);
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
      const data = await apiLogin(email, password);
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

  async function fetchCurrentUserIfAuthenticated()
  {
    if (!token.value) return false;

    try
    {
      const data = await fetchCurrentUser(token.value);
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
    fetchCurrentUser: fetchCurrentUserIfAuthenticated,
    logout
  };
});
