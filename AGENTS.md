# AGENTS.md

## Commands
- `npm run dev` - Start dev server (backend + frontend concurrently)
- `npm run storybook` - Start Storybook for component development (http://localhost:6006)
- `npm run build-storybook` - Build Storybook for static deployment
- `npm run build` - Type-check and build for production
- `npm run lint` / `npm run lint:fix` - ESLint
- `npm run test` - Run all tests with vitest (watch mode)
- `npm run test:run` - Run main project tests once (unit + integration + backend; excludes Storybook)
- `npm run test:storybook` - Run Storybook component tests (Vitest browser mode)
- `npm run test:run -- path/to/file.test.ts` - Run a single test file
- `npm run db:generate && npm run db:push` - Apply Prisma schema changes

## Architecture
- **frontend/** - Vue 3 SPA with Pinia stores, Vue Router, Leaflet maps, TypeScript
  - **api/** - API client and domain modules (auth, launchPoints, publicTransport); stores call these instead of fetch directly
  - **components/** - Reusable UI components
    - **ErrorBanner.vue** - Dismissible error banner used across views (MapView, Login, Signup, Detail, Form)
    - **FilterPanel.vue** - Filter sidebar (type, user, categories)
    - **LaunchPointListView.vue** - Scrollable list of launch points
    - **map/** - Modular map layer components (LaunchPointLayer, PublicTransportLayer, GpsMarkerLayer, WalkingRouteLayer, MapControls, Popup components)
  - **composables/** - General reusable logic (useMapState, useGeolocation, useWalkingRoute, etc.)
  - **composables/map/** - Map-specific composables (useWalkingRouteDisplay, useMapQueryParams)
  - **router/** - Vue Router; `routes.ts` defines routes (shared with Storybook), `index.ts` creates router with auth guards
  - **stores/** - Pinia stores (auth, launchPoints, publicTransport, categories, theme, viewport, mapUi)
  - **utils/** - Shared utilities (geo.ts, transport.ts, leaflet.ts)
  - **views/** - Page components (MapView, LaunchPointDetailView, LaunchPointFormView, GpsPositionDetailView, LoginView, SignupView, ImpressumView)
- **backend/** - Express API server (`backend/index.ts`), routes in `backend/routes/`
- **prisma/** - Database schema and seeds (libSQL/Turso adapter)
- **shared/** - Shared TypeScript types between frontend and backend

## Storybook
- **Routes**: shared in `frontend/src/router/routes.ts`; Storybook uses `.storybook/router.ts` with `createMemoryHistory()`
- **Router guards**: Storybook router has no `beforeEach` (avoids useAuthStore in guard context)
- **Stories**: `frontend/tests/stories/**/*.stories.ts` (mirror of `src/components/`, `src/views/`, etc.); View stories use `.storybook/StorybookRouterView.vue` + decorator for route-based views; shared mocks in `.storybook/mocks.ts`; import app code via `../../../src/...`, `.storybook` via `../../../../.storybook/...` from `tests/stories/views/`
- **Storybook tests**: `npm run test:storybook` (Vitest browser mode); tests can also run via the Storybook UI testing widget

## Code Style
- ESLint with TypeScript + Vue plugins; Allman brace style; 2-space indentation
- Use TypeScript strict types; shared types go in `shared/types/`
- Vue components use `<script setup lang="ts">` with Composition API
- Tests use Vitest + @vue/test-utils; place in `frontend/tests/` or `backend/tests/`
- Error display: Use `ErrorBanner` component for API/network errors; store tests mock API modules (not fetch)

## Styling (Tailwind CSS v4)
- **Tailwind CSS v4** via `@tailwindcss/vite` plugin
- **Style files split by concern** in `frontend/src/styles/`:
  - `theme.css` - Tailwind import, `@theme` tokens, CSS variable aliases, dark mode
  - `base.css` - Typography, focus/selection, global scrollbar, `.sr-only` (visually hidden, screen-reader accessible)
  - `vendor/leaflet.css` - Leaflet overrides
- `style.css` - Aggregator that imports all style files
- Theme colors: use `bg-bg-card`, `text-text-primary`, `border-border`, `text-primary`, `font-display`, etc.
- CSS variable aliases (e.g., `--bg-card`, `--border-color`) available for scoped styles
- For complex styles (gradients, animations), use minimal `<style scoped>` with `@reference` to `style.css` (path depends on component location, e.g. `./style.css` in src/, `../style.css` in components/) for Tailwind access
- Dark mode: controlled via `.dark` class on `<html>` (managed by `useThemeStore`), only source tokens (`--color-*`) are overridden
- Theme switcher: Light / Dark / Auto modes, saved in localStorage

## Accessibility & Semantic HTML
- **Skip link**: App.vue provides "Zum Hauptinhalt springen" link (focus-only visible)
- **Semantic landmarks**: `main`, `header`, `aside`, `section`, `nav` for structure
- **ARIA**: Icon buttons use `aria-label`; menus use `role="menu"` / `role="menuitem"`; forms use `fieldset`/`legend`
- **Focus**: `:focus-visible` for keyboard-only focus styling; `.sr-only` in base.css for screen-reader-only content
