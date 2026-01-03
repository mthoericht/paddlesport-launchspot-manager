import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../stores/auth';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      redirect: '/map'
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/LoginView.vue'),
      meta: { requiresGuest: true }
    },
    {
      path: '/signup',
      name: 'signup',
      component: () => import('../views/SignupView.vue'),
      meta: { requiresGuest: true }
    },
    {
      path: '/map',
      name: 'map',
      component: () => import('../views/MapView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/launch-point/new',
      name: 'new-launch-point',
      component: () => import('../views/LaunchPointFormView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/launch-point/:id',
      name: 'launch-point-detail',
      component: () => import('../views/LaunchPointDetailView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/launch-point/:id/edit',
      name: 'edit-launch-point',
      component: () => import('../views/LaunchPointFormView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/impressum',
      name: 'impressum',
      component: () => import('../views/ImpressumView.vue')
    }
  ]
});

router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore();
  
  // Try to fetch current user if we have a token but no user
  if (authStore.token && !authStore.user) {
    await authStore.fetchCurrentUser();
  }
  
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next('/login');
  } else if (to.meta.requiresGuest && authStore.isAuthenticated) {
    next('/map');
  } else {
    next();
  }
});

export default router;

