import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import { routes } from './routes';

const router = createRouter({
  history: createWebHistory(),
  routes
});

router.beforeEach(async (to, _from, next) => 
{
  const authStore = useAuthStore();
  
  // Try to fetch current user if we have a token but no user
  if (authStore.token && !authStore.user) 
  {
    await authStore.fetchCurrentUser();
  }
  
  if (to.meta.requiresAuth && !authStore.isAuthenticated) 
  {
    next('/login');
  }
  else if (to.meta.requiresGuest && authStore.isAuthenticated) 
  {
    next('/map');
  }
  else 
  {
    next();
  }
});

export default router;

