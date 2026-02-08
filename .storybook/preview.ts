import type { Preview } from '@storybook/vue3-vite';
import { setup } from '@storybook/vue3';
import { createPinia } from 'pinia';
import router from './router';
import '../frontend/src/style.css';
import { mockLaunchPoint, mockCategories, mockPublicTransportStation } from './mocks';

const originalFetch = globalThis.fetch;
globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) =>
{
  const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
  if (url.includes('/api/auth/users'))
  {
    return new Response(
      JSON.stringify([
        { id: 1, username: 'admin' },
        { id: 2, username: 'paddler' },
        { id: 3, username: 'guest' }
      ]),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }
  if (url.includes('/api/launch-points/categories'))
  {
    return new Response(JSON.stringify(mockCategories), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  const launchPointMatch = url.match(/\/api\/launch-points\/(\d+)$/);
  if (launchPointMatch)
  {
    return new Response(JSON.stringify(mockLaunchPoint), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  if (url.includes('/api/public-transport'))
  {
    return new Response(
      JSON.stringify([mockPublicTransportStation]),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }
  if (url.includes('/api/launch-points') && !url.includes('/categories') && !url.match(/\/\d+$/))
  {
    return new Response(
      JSON.stringify([mockLaunchPoint]),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }
  return originalFetch(input, init);
};

setup((app) =>
{
  app.use(createPinia());
  app.use(router);
});

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i
      }
    },
    a11y: {
      config: {
        rules: [
          { id: 'color-contrast', enabled: true },
          { id: 'label', enabled: true },
          { id: 'button-name', enabled: true },
          { id: 'link-name', enabled: true }
        ]
      },
      // 'todo' = Violations als Warnung, kein Test-Fail; 'error' = Fail bei Violations
      test: 'todo'
    },
    layout: 'centered'
  },
};

export default preview;