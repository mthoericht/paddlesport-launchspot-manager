# 🚣 Paddlesport Launchspot Manager

> ⚠️ **Status: In Progress** - This project is currently under active development. Features may change and some functionality may be incomplete.

A full-stack web application for managing launch points for kayaking, canoeing, SUP, and swimming. Users can mark their own launch points on an interactive map, add detailed information, and filter by various criteria. The application also displays public transport stations to help users plan their journey to launch points.

![Vue.js](https://img.shields.io/badge/Vue.js-3.5-4FC08D?logo=vue.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript)
![Express](https://img.shields.io/badge/Express-4.21-000000?logo=express)
![Prisma](https://img.shields.io/badge/Prisma-7.2-2D3748?logo=prisma)
![SQLite](https://img.shields.io/badge/SQLite-3-003B57?logo=sqlite)

## ✨ Features

### 🗺️ Interactive Map
- **OpenStreetMap** with Leaflet
- **Address search** with Nominatim geocoding
- **Context menu** for quick point creation
  - **Desktop**: Right-click shows menu immediately; left-click (hold 500ms) shows menu with delay
  - **Mobile**: Touch and hold (500ms) shows menu
- **GPS position tracking** - Shows current location with accuracy circle
  - Automatic position updates
  - "Center on my position" button
  - Add launch point at current GPS position from marker popup
- **Map view persistence** - Remembers zoom level and position when navigating
  - Preserves view when adding points
  - Restores view when using back button
  - Automatic cleanup of highlight URL parameters
- **Color-coded markers** by category
- **Navigation integration** for route planning
- **List view** alongside map (toggleable)
- **"Show on map"** button to highlight and center points
- **Responsive design** with mobile-optimized layout

### 👤 User Management
- Registration and login
- JWT-based authentication
- Admin role with extended permissions

### 📍 Launch Point Management
- **Create, edit, delete** launch points
- **Categories**: Kayak, SUP, Swimming, Relaxing (multi-select)
- **Details**: Opening hours, parking, nearby waters, food supply, hints
- **Public transport stations** (max 5) with distance
- **Navigation**: One-click route planning
- **Permissions**: Only creators or admins can delete
- **List view**: Browse all launch points in a scrollable list
- **Quick navigation**: Jump to any point on the map from list or detail view

### 🚇 Public Transport Stations
- **Display on map**: Public transport stations are shown with custom icons
- **Multiple types**: Each station can have multiple transport types (train, tram, S-Bahn, U-Bahn)
- **Line information**: Shows all lines serving each station
- **Popup details**: Station name, lines, and transport types displayed in popup
- **Color-coded icons**: Different icons for different transport types
- **Nearby stations analysis**: When clicking on a launch point, nearby public transport stations (within 2km air distance) are automatically calculated and displayed
  - Maximum 8 closest stations shown
  - Distance displayed in meters (air distance)
  - Transport type badges (train, tram, S-Bahn, U-Bahn)
  - "Show on map" button to navigate directly to station
  - Available in both map popup and detail view

### 🚶 Walking Route
- **Walking directions**: Display walking route from any nearby public transport station to a launch point
- **OSRM routing**: Uses OpenStreetMap routing API for accurate walking paths
- **Route visualization**: Dashed blue polyline on the map showing the walking path
- **Route info popup**: Shows start station, destination, total distance and estimated walking time
- **One-click access**: Walking route button (pedestrian icon) next to each nearby station
- **Available everywhere**: In both map popup and detail view ÖPNV lists

### 🔍 Filters
- All points, My points, Official points, By user
- Category filter (multi-select)

### 📋 List View
- **Toggleable list view** alongside map (desktop) or as overlay (mobile)
- **Quick access** to all launch points with key information
- **"Show on map" button** in list items and detail view
- **Auto-hide on mobile** when navigating to map view
- **Highlighting** of selected point in list when shown on map
- **Smart popup handling** - automatically opens popup when centering on a point
- **Responsive behavior** - search bar and FAB button auto-hide when list/filter panels are open on mobile


## 🛠️ Tech Stack

### Frontend
- **Vue.js 3** (Composition API)
- **TypeScript**, **Pinia**, **Vue Router**
- **Leaflet** / **Vue-Leaflet** for maps
- **Vite**, **Vitest**, **ESLint**
- **Composables**: Modular, reusable logic (map state, navigation, show on map, etc.)

### Composables Architecture

The frontend uses Vue 3 Composition API with custom composables for reusable logic:

- **`useMapState`** - Map center, zoom, and view management
- **`useMapNavigation`** - Navigation to detail pages, external navigation apps, and map navigation for points/stations
- **`useShowPointOnMap`** - Center map on point/station, open popup, handle highlighting
- **`useNearbyStations`** - Calculate nearby public transport stations using Haversine formula (air distance)
- **`useMapViewInteractions`** - Map click handlers, context menu, search, map view persistence
- **`useCategories`** - Category fetching and icon/color management
- **`useAddressSearch`** - Address geocoding with Nominatim
- **`useContextMenu`** - Context menu handling with smart delay logic:
  - Right-click: Immediate display
  - Left-click/Touch: 500ms delay before showing menu
  - Prevents menu from closing on mouseup/click events
  - Handles both desktop and mobile touch events
  - Automatically removes highlight URL parameters when closed or map is moved
- **`useGeolocation`** - GPS position tracking and management:
  - Continuous position updates via `watchPosition()`
  - One-time position request via `getCurrentPosition()`
  - Error handling for permission denied, unavailable, and timeout cases
  - Automatic cleanup on component unmount
- **`useWalkingRoute`** - Walking route calculation via OSRM API:
  - Fetches walking routes between two coordinates
  - Returns route geometry, distance (meters), and duration (seconds)
  - Reactive loading and error states
- **`useLaunchPointForm`** - Form state and validation

### Backend
- **Express.js** REST API server
- **Prisma ORM** with SQLite
- **JWT** authentication
- **bcryptjs** password hashing
- **Full TypeScript typing**: All Prisma operations are fully typed with custom delegates
  - `TypedPrismaClient` extends base PrismaClient with custom model delegates
  - Shared type definitions in `backend/types/point.ts`
  - No `as any` or `as unknown` assertions in production code

### Shared Types

The project uses a **shared types architecture** to ensure type consistency between frontend and backend (Data Transfer Objects):

```
shared/
└── types/
    ├── api.ts      # LaunchPoint, PublicTransportPoint, CategoryInfo, etc.
    └── index.ts    # Re-exports
```

- **Shared types** define the API contract between frontend and backend
- **Mapper functions** in `backend/mappers/` transform Prisma models to API types
- Frontend and backend import the same types directly
- All API responses conform to the shared type definitions

### Database
- **SQLite** with Prisma ORM
- **Point-based architecture**: Base `Point` model with shared location data (name, latitude, longitude)
  - `LaunchPoint` - Launch points for paddlesports (references `Point`)
  - `PublicTransportPoint` - Public transport stations (references `Point`)
  - Supports multiple transport types per station (train, tram, sbahn, ubahn)

## 🚀 Installation

### Prerequisites
- Node.js 18+
- npm 9+

### Setup

1. **Clone repository**
   ```bash
   git clone <repository-url>
   cd paddlesport-launchspot-manager
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   
   Create a `.env` file in the root directory:
   ```bash
   # Database
   DATABASE_URL="file:./data/database.sqlite"
   
   # JWT Authentication
   JWT_SECRET="your-secret-key-here-change-in-production"
   
   # Optional: Backend port (default: 3001)
   PORT=3001
   
   # Optional: Frontend API URL (for production)
   VITE_API_URL="http://localhost:3001"
   ```

4. **Initialize database**
   ```bash
   # Complete setup (recommended)
   npm run db:setup
   
   # Or step by step:
   # Generate Prisma Client
   npm run db:generate
   
   # Push schema to database (creates database if it doesn't exist)
   npm run db:push
   
   # Seed database with initial data (categories, imported user)
   npm run db:seed
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

   This starts both servers concurrently:
   - **Frontend** at `http://localhost:5173` (Vite dev server)
   - **Backend** at `http://localhost:3001` (Express API)

## 📜 NPM Scripts

### Development
| Script | Description |
|--------|-------------|
| `npm run dev` | Start frontend and backend in parallel (concurrently) |
| `npm run dev:client` | Frontend only (Vite dev server on port 5173) |
| `npm run dev:server` | Backend only (Express server on port 3001) |
| `npm run build` | Production build (TypeScript check + Vite build) |
| `npm run preview` | Preview production build locally |

### Testing
| Script | Description |
|--------|-------------|
| `npm run test` | Run all tests in watch mode |
| `npm run test:ui` | Run tests with Vitest UI |
| `npm run test:run` | Run all tests once (no watch) |
| `npm run test:unit` | Run frontend unit tests only |
| `npm run test:integration` | Run frontend integration tests only |
| `npm run test:backend` | Run backend integration tests only |
| `npm run test:coverage` | Run tests with coverage report |

### Code Quality
| Script | Description |
|--------|-------------|
| `npm run lint` | Run ESLint checks |
| `npm run lint:fix` | Auto-fix ESLint errors |

### Database
| Script | Description |
|--------|-------------|
| `npm run db:generate` | Generate Prisma Client |
| `npm run db:push` | Push schema to database |
| `npm run db:push:force` | Force reset database (⚠️ deletes all data) |
| `npm run db:studio` | Open Prisma Studio (database GUI) |
| `npm run db:seed` | Seed database with initial data (categories, imported user) |
| `npm run db:reset` | Reset database and restore data (backup/restore) |
| `npm run db:setup` | Complete database setup (generate + push + seed) |
| `npm run db:delete-all-points` | Delete all points (launch points and public transport stations) |

### Data Import

#### Launch Points
| Script | Description |
|--------|-------------|
| `npm run csv:to-json` | Convert CSV to JSON (default: `scripts/external-data-preset/launchpoint-tables-export.csv`) |
| `npm run parse:tables-launchpoints-export` | Parse and geocode data (default: `scripts/external-data-preset/launchpoint-tables-export.json`) |
| `npm run import:external-launchpoints` | Import to database (default: `scripts/external-data-preset/launchpoints-import-data.json`) |

#### Public Transport Stations
| Script | Description |
|--------|-------------|
| `npm run parse:tables-public-transport-export` | Parse CSV to JSON (default: `scripts/external-data-preset/berlin-public-transport.csv`) |
| `npm run import:publictransportStations` | Import to database (default: `scripts/external-data-preset/berlin-public-transport.json`) |

## 🧪 Testing

The project uses **Vitest** with a multi-layered testing strategy:

- **Unit Tests** (`frontend/tests/unit/`): Test composables in isolation
  - `useMapState.test.ts` - Map state management
  - `useMapNavigation.test.ts` - Navigation functionality (points, stations, external navigation)
  - `useShowPointOnMap.test.ts` - "Show on map" feature with highlighting and station popup handling
  - `useNearbyStations.test.ts` - Nearby stations calculation with Haversine formula
  - `useCategories.test.ts` - Category management
  - `useGeolocation.test.ts` - GPS position tracking and error handling
- **Frontend Integration** (`frontend/tests/integration/`): Test Pinia stores with mocked API
  - `authStore.test.ts` - Authentication store
  - `launchPointsStore.test.ts` - Launch points store
  - `listView.test.ts` - List view data handling
- **Backend Integration** (`backend/tests/integration/`): Test API routes with real database
  - `auth.test.ts` - Authentication endpoints
  - `launchPoints.test.ts` - Launch points endpoints
  - `publicTransport.test.ts` - Public transport stations endpoints

Test data uses `TEST_` prefix and is automatically cleaned up after each test. See NPM Scripts section for test commands.

### Test Coverage

The test suite covers:
- ✅ Map interactions and state management
- ✅ Navigation and routing
- ✅ "Show on map" functionality with popup handling
- ✅ List view data provision and filtering
- ✅ Authentication and authorization
- ✅ Launch point CRUD operations
- ✅ Public transport stations retrieval
- ✅ Nearby stations calculation (Haversine distance)
- ✅ Mobile vs. desktop behavior
- ✅ GPS position tracking and error handling

## 🔐 API Endpoints

All endpoints are prefixed with `/api` (backend runs on port 3001).

### Authentication
| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| POST | `/api/auth/signup` | ❌ | Register new user (email, username, password) |
| POST | `/api/auth/login` | ❌ | Login (email/username, password) |
| GET | `/api/auth/me` | ✅ | Get current authenticated user |
| GET | `/api/auth/users` | ✅ | List all users (admin only) |

### Launch Points
| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| GET | `/api/launch-points` | ✅ | Get all launch points (with filters) |
| GET | `/api/launch-points/:id` | ✅ | Get single launch point by ID |
| POST | `/api/launch-points` | ✅ | Create new launch point |
| PUT | `/api/launch-points/:id` | ✅ | Update launch point (creator or admin) |
| DELETE | `/api/launch-points/:id` | ✅ | Delete launch point (creator or admin) |

### Public Transport Stations
| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| GET | `/api/public-transport` | ❌ | Get all public transport stations |

**Note**: Authentication uses JWT tokens. Include the token in the `Authorization` header as `Bearer <token>`.

## 🌐 Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `DATABASE_URL` | Prisma database connection string | `file:./data/database.sqlite` | ✅ |
| `JWT_SECRET` | Secret key for JWT token signing | - | ✅ |
| `PORT` | Backend server port | `3001` | ❌ |
| `VITE_API_URL` | Frontend API base URL (production) | Auto-detected from hostname | ❌ |

**Security Note**: Never commit `.env` files to version control. Use strong, random values for `JWT_SECRET` in production.

## 🎨 Design

- **Responsive**: Optimized for desktop and mobile
- **Color palette**: Ocean-inspired blue tones
- **Typography**: Outfit (display) + DM Sans (body)
- **Dark mode**: Automatic based on system preference
- **Accessibility**: Semantic HTML and ARIA labels
- **Mobile-first**: List view as overlay on mobile, side-by-side on desktop
- **Smart UI**: Auto-hide elements (search, FAB button) when panels are open on mobile

## 📊 Data Import

> ⚠️ **Note**: The test data for launch points and public transport stations are provided as examples only and cannot guarantee accuracy.

### Launch Points Import

**Workflow**: `CSV → JSON → Parse/Geocode → Import`

1. **Convert CSV to JSON**: `npm run csv:to-json [input.csv] [output.json]`
2. **Parse and geocode**: `npm run parse:tables-launchpoints-export [input.json]`
3. **Import to database**: `npm run import:external-launchpoints [input.json]`

### Public Transport Stations Import

**Workflow**: `CSV → JSON → Import`

1. **Parse CSV to JSON**: 
   ```bash
   # Using default path (scripts/external-data-preset/berlin-public-transport.csv)
   npm run parse:tables-public-transport-export
   
   # Or specify custom paths
   npm run parse:tables-public-transport-export <input.csv> [output.json]
   ```
   This script:
   - **Default**: Reads from `scripts/external-data-preset/berlin-public-transport.csv`
   - Validates transport types (`train`, `tram`, `sbahn`, `ubahn`)
   - Parses comma-separated types and lines
   - **Default**: Outputs to `scripts/external-data-preset/berlin-public-transport.json`

2. **Import to database**: 
   ```bash
   # Using default path (scripts/external-data-preset/berlin-public-transport.json)
   npm run import:publictransportStations
   
   # Or specify custom input file
   npm run import:publictransportStations <input.json>
   ```
   This imports public transport stations into the database with:
   - Point records for location data
   - PublicTransportPoint records with lines
   - PublicTransportPointType records for each transport type

**CSV Format for Public Transport**:
- Required columns: `name`, `latitude`, `longitude`, `types`, `lines`
- `types`: Comma-separated transport types (`train`, `tram`, `sbahn`, `ubahn`)
- `lines`: Comma-separated line identifiers (e.g., `S3,S5,U2`)
- Example: `Alexanderplatz,52.5218,13.4114,"sbahn,ubahn","S3,S5,S7,S9,U2,U5,U8"`
- **Note**: Each station appears once with all types and lines consolidated

**Detailed Launch Points Import Steps**:

1. **Prepare data source**: Create a CSV file with launch point data (see CSV format below)
   
   **Default workflow**: Place your CSV file as `scripts/external-data-preset/launchpoint-tables-export.csv` to use the default paths.

2. **Convert CSV to JSON**: 
   ```bash
   # Using default path (scripts/external-data-preset/launchpoint-tables-export.csv)
   npm run csv:to-json
   
   # Or specify custom paths
   npm run csv:to-json <your-file.csv> [output.json]
   ```
   The script automatically handles:
   - Header normalization (supports German and English column names)
   - Quoted fields and special characters
   - Empty rows
   - **Default**: Converts `scripts/external-data-preset/launchpoint-tables-export.csv` to `scripts/external-data-preset/launchpoint-tables-export.json`

3. **Parse and geocode data**:
   ```bash
   # Using default path (scripts/external-data-preset/launchpoint-tables-export.json)
   npm run parse:tables-launchpoints-export
   
   # Or specify custom input file
   npm run parse:tables-launchpoints-export <input.json>
   ```
   This script:
   - **Default**: Reads from `scripts/external-data-preset/launchpoint-tables-export.json`
   - Extracts coordinates from coordinate strings when available
   - Geocodes addresses using Nominatim (OpenStreetMap)
   - **Default**: Outputs to `scripts/external-data-preset/launchpoints-import-data.json` (same directory as input)
   - Includes retry logic for entries with minimal address information

4. **Import into database**:
   ```bash
   # Using default path (scripts/external-data-preset/launchpoints-import-data.json)
   npm run import:external-launchpoints
   
   # Or specify custom input file
   npm run import:external-launchpoints <input.json>
   ```
   This imports the parsed launch points into the database.
   
   **Note**: Make sure the database is seeded first (`npm run db:seed`) to create the "imported" user that will own these launch points.

### Launch Points CSV Format

The CSV file should have the following columns (case-insensitive, supports German/English names):
- `betreiber` / `operator` - Operator name
- `anleger` / `landing` - Landing point name
- `strasse` / `street` / `straße` - Street address
- `plz` / `postalcode` / `postleitzahl` - Postal code
- `ort` / `city` / `stadt` - City name
- `gewaesser` / `water` / `gewässer` - Water body name

**Note**: The following columns are optional and not used in the current import process (removed for data protection):
- `km` / `kilometer` - River kilometer (optional)
- `gastliegeplaetze` / `gastliegeplätze` - Guest berths (optional)
- `internet` / `website` - Website URL (optional, removed for data protection)
- `telefon` / `phone` / `tel` - Phone number (optional, removed for data protection)

## 🗄️ Database Schema

The database uses a **Point-based architecture** where location data is shared between different point types:

### Core Models

- **`Point`** - Base model with shared location data
  - `id`, `name`, `latitude`, `longitude`
  - One-to-one relations to `LaunchPoint` and `PublicTransportPoint`

- **`LaunchPoint`** - Launch points for paddlesports
  - References `Point` for location data
  - Additional fields: `isOfficial`, `hints`, `openingHours`, `parkingOptions`, `nearbyWaters`, `foodSupply`
  - Relations: `categories`, `stations` (public transport), `createdBy` (user)

- **`PublicTransportPoint`** - Public transport stations
  - References `Point` for location data
  - Additional fields: `lines` (comma-separated line identifiers)
  - Many-to-many relation to `PublicTransportType` (via `PublicTransportPointType` junction table)
  - Supports multiple types per station: `train`, `tram`, `sbahn`, `ubahn`

### Supporting Models

- **`User`** - User accounts with authentication
- **`Category`** - Launch point categories (kajak, sup, swimming, relaxing)
- **`LaunchPointCategory`** - Junction table for launch point categories
- **`PublicTransportStation`** - Links launch points to nearby public transport (with distance)
- **`PublicTransportPointType`** - Junction table for public transport types

### Schema Benefits

- **Shared location data**: Avoids duplication of name, latitude, longitude
- **Flexible types**: Public transport points can have multiple types simultaneously
- **Cascade deletes**: Deleting a `Point` automatically deletes associated `LaunchPoint` or `PublicTransportPoint`
- **Extensible**: Easy to add new point types in the future

## 🚀 Production Deployment

### Building for Production

```bash
# Build the frontend
npm run build

# The built files will be in the dist/ directory
```

### Production Considerations

1. **Environment Variables**: Set production values for all required variables
2. **Database**: Consider using a production-grade database (PostgreSQL, MySQL) instead of SQLite
3. **JWT Secret**: Use a strong, randomly generated secret key
4. **CORS**: Configure CORS settings appropriately for your domain
5. **HTTPS**: Always use HTTPS in production
6. **API URL**: Set `VITE_API_URL` to your production API endpoint


## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.
