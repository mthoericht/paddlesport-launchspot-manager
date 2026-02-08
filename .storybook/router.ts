import { createRouter, createMemoryHistory } from 'vue-router';
import { routes } from '../frontend/src/router/routes';

const router = createRouter({
  history: createMemoryHistory(),
  routes
});

// Kein beforeEach – useAuthStore() schlägt in Router-Guards ohne Komponentenkontext fehl.
// Die Story-Decorators patchen den Auth-Store direkt vor der Navigation.

export default router;
