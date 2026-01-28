# AGENTS.md

## Commands
- `npm run dev` - Start dev server (backend + frontend concurrently)
- `npm run build` - Type-check and build for production
- `npm run lint` / `npm run lint:fix` - ESLint
- `npm run test` - Run all tests with vitest (watch mode)
- `npm run test:run` - Run all tests once
- `npm run test:run -- path/to/file.test.ts` - Run a single test file
- `npm run db:generate && npm run db:push` - Apply Prisma schema changes

## Architecture
- **frontend/** - Vue 3 SPA with Pinia stores, Vue Router, Leaflet maps, TypeScript
  - **components/map/** - Modular map layer components (LaunchPointLayer, PublicTransportLayer, GpsMarkerLayer, WalkingRouteLayer, MapControls, and Popup components)
  - **composables/** - General reusable logic (useMapState, useGeolocation, useWalkingRoute, etc.)
  - **composables/map/** - Map-specific composables (useNearbyPopupState, useWalkingRouteDisplay, useMapQueryParams)
  - **stores/** - Pinia stores (auth, launchPoints, publicTransport, categories, theme)
  - **utils/** - Shared utilities (geo.ts, transport.ts)
  - **views/** - Page components (MapView, DetailView, etc.)
- **backend/** - Express API server (`backend/index.ts`), routes in `backend/routes/`
- **prisma/** - Database schema and seeds (libSQL/Turso adapter)
- **shared/** - Shared TypeScript types between frontend and backend

## Code Style
- ESLint with TypeScript + Vue plugins; Allman brace style; 2-space indentation
- Use TypeScript strict types; shared types go in `shared/types/`
- Vue components use `<script setup lang="ts">` with Composition API
- Tests use Vitest + @vue/test-utils; place in `frontend/tests/` or `backend/tests/`

## Styling (Tailwind CSS v4)
- **Tailwind CSS v4** via `@tailwindcss/vite` plugin
- **Style files split by concern** in `frontend/src/styles/`:
  - `theme.css` - Tailwind import, `@theme` tokens, CSS variable aliases, dark mode
  - `base.css` - Typography, focus/selection, global scrollbar
  - `vendor/leaflet.css` - Leaflet overrides
- `style.css` - Aggregator that imports all style files
- Theme colors: use `bg-bg-card`, `text-text-primary`, `border-border`, `text-primary`, `font-display`, etc.
- CSS variable aliases (e.g., `--bg-card`, `--border-color`) available for scoped styles
- For complex styles (gradients, animations), use minimal `<style scoped>` with `@reference "../style.css"` for Tailwind access
- Dark mode: controlled via `.dark` class on `<html>` (managed by `useThemeStore`), only source tokens (`--color-*`) are overridden
- Theme switcher: Light / Dark / Auto modes, saved in localStorage
