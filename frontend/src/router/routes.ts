import type { RouteRecordRaw } from 'vue-router';

export const routes: RouteRecordRaw[] = [
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
    path: '/my-position',
    name: 'my-position',
    component: () => import('../views/GpsPositionDetailView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/impressum',
    name: 'impressum',
    component: () => import('../views/ImpressumView.vue')
  }
];
