# 🚣 Paddlesport Launchspot Manager

A full-stack web application for managing launch points for kayaking, canoeing, SUP, and swimming. Users can mark their own launch points on an interactive map, add detailed information, and filter by various criteria.

![Vue.js](https://img.shields.io/badge/Vue.js-3.5-4FC08D?logo=vue.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript)
![Express](https://img.shields.io/badge/Express-4.21-000000?logo=express)
![Prisma](https://img.shields.io/badge/Prisma-7.2-2D3748?logo=prisma)
![SQLite](https://img.shields.io/badge/SQLite-3-003B57?logo=sqlite)

## ✨ Features

### 🗺️ Interactive Map
- **OpenStreetMap integration** with Leaflet
- **Address search** with Nominatim geocoding
- **Context menu** (left/right click) for quick point creation
- **Color-coded markers** by category (Kayak, SUP, Swimming, Relaxing)
- **Zoom level preservation** when creating new points
- **Navigation integration** - Opens default navigation app (HERE, Waze, Google Maps, Apple Maps, etc.) for route planning

### 👤 User Management
- Registration and login (email, username, password)
- JWT-based authentication
- Admin role for extended permissions
- User-specific data

### 📍 Launch Point Management
- **Create, edit, delete** launch points
- **Categories**: Kayak, SUP, Swimming, Relaxing (multi-select)
- **Details**:
  - Opening hours (optional, default: 24h)
  - Parking options
  - Nearby waters
  - Food supply
  - Hints (free text)
- **Public transport stations** (max 5) with distance
- **Navigation**: One-click route planning to launch points
- **Permissions**: Only creators or admins can delete

### 🔍 Filters
- **"All points"**: Shows all available launch points
- **"My points"**: Only created by current user
- **"Official points"**: Admin-marked points
- **"By user"**: Filter by specific username
- **Category filter**: Multi-select available

## 🏗️ Architecture

```
paddlesport-launchspot-manager/
├── backend/                   # Backend (Express.js)
│   ├── index.ts               # Server entry point
│   ├── prisma.ts              # Prisma Client setup
│   ├── middleware/
│   │   └── auth.ts            # JWT authentication
│   └── routes/
│       ├── auth.ts            # Auth routes (login, signup)
│       └── launchPoints.ts    # CRUD routes for launch points
├── frontend/                  # Frontend (Vue.js)
│   ├── index.html             # Entry HTML
│   ├── public/                # Static assets
│   └── src/
│       ├── assets/
│       │   └── auth.css       # Shared auth styles
│       ├── components/
│       │   ├── AppHeader.vue  # App header with navigation
│       │   └── FilterPanel.vue# Filter sidebar
│       ├── composables/       # Vue Composables (logic)
│       │   ├── index.ts
│       │   ├── useAddressSearch.ts
│       │   ├── useCategories.ts
│       │   ├── useContextMenu.ts
│       │   ├── useLaunchPointForm.ts
│       │   ├── useMapNavigation.ts
│       │   ├── useMapState.ts
│       │   └── useMapViewInteractions.ts
│       ├── router/
│       │   └── index.ts       # Vue Router configuration
│       ├── stores/            # Pinia Stores (state)
│       │   ├── auth.ts        # Auth state
│       │   └── launchPoints.ts# Launch points state
│       ├── types/
│       │   └── index.ts       # TypeScript interfaces
│       ├── views/
│       │   ├── ImpressumView.vue
│       │   ├── LaunchPointDetailView.vue
│       │   ├── LaunchPointFormView.vue
│       │   ├── LoginView.vue
│       │   ├── MapView.vue
│       │   └── SignupView.vue
│       ├── App.vue
│       ├── main.ts
│       └── style.css
├── prisma/
│   └── schema.prisma          # Database schema
├── data/                      # SQLite database (database.sqlite, not in Git)
├── dist/                      # Production build output (generated)
├── frontend/tests/            # Frontend test files
│   ├── unit/                  # Unit tests (Vitest)
│   └── integration/           # Integration tests (Vitest)
│   └── setup.ts               # Test setup file
└── backend/tests/             # Backend test files
    ├── integration/           # Backend integration tests
    └── helpers/                # Test helpers (cleanup, fixtures)
```

## 🛠️ Tech Stack

### Frontend
- **Vue.js 3** with Composition API
- **TypeScript** for type safety
- **Pinia** for state management
- **Vue Router** for navigation
- **Leaflet** / **Vue-Leaflet** for maps
- **Vite** as build tool
- **Vitest** for unit and integration testing
- **ESLint** for code quality

### Backend
- **Express.js** as REST API server
- **Prisma ORM** with SQLite
- **JWT** (jsonwebtoken) for authentication
- **bcryptjs** for password hashing
- **tsx** for TypeScript execution

### Database
- **SQLite** (local in `data/database.sqlite`)
- **Prisma ORM** for type-safe database access

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
   # Generate Prisma Client
   npm run db:generate
   
   # Push schema to database (creates database if it doesn't exist)
   npm run db:push
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
| `npm run db:studio` | Open Prisma Studio (database GUI) |

## 🧪 Testing

The project uses **Vitest** for comprehensive testing with a multi-layered strategy:

### Test Structure
- **Unit Tests** (`frontend/tests/unit/`): Test individual composables and utilities in isolation
- **Frontend Integration Tests** (`frontend/tests/integration/`): Test Pinia stores with mocked API calls
- **Backend Integration Tests** (`backend/tests/integration/`): Test API routes with real database using Supertest

### Test Data Management
- **All test data uses `TEST_` prefix** (emails, usernames, launch point names) for easy identification
- **Automatic cleanup**: Test data is deleted after each test (success or failure)
- **Isolation**: Each test runs with a clean database state
- **Test helpers**: Utilities in `backend/tests/helpers/` for database setup and cleanup

### Running Tests
```bash
# Run all tests in watch mode
npm run test

# Run all tests once
npm run test:run

# Run specific test suites
npm run test:unit          # Frontend unit tests
npm run test:integration   # Frontend integration tests
npm run test:backend       # Backend integration tests

# With interactive UI
npm run test:ui            # Vitest UI (browser-based)

# With coverage report
npm run test:coverage      # Generate coverage report
```

### Test Environment
- Uses **happy-dom** for DOM simulation in frontend tests
- Uses **Supertest** for HTTP assertions in backend tests
- Test database is automatically managed and cleaned between tests

## 🔐 API Endpoints

All API endpoints are prefixed with `/api`. The backend runs on port 3001 by default.

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
| GET | `/api/launch-points` | ❌ | Get all launch points (with filters) |
| GET | `/api/launch-points/:id` | ❌ | Get single launch point by ID |
| POST | `/api/launch-points` | ✅ | Create new launch point |
| PUT | `/api/launch-points/:id` | ✅ | Update launch point (creator or admin) |
| DELETE | `/api/launch-points/:id` | ✅ | Delete launch point (creator or admin) |

**Note**: Authentication uses JWT tokens. Include the token in the `Authorization` header as `Bearer <token>`.

## 🌐 Environment Variables

The application uses environment variables for configuration. Create a `.env` file in the root directory:

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `DATABASE_URL` | Prisma database connection string | `file:./data/database.sqlite` | ✅ |
| `JWT_SECRET` | Secret key for JWT token signing | - | ✅ |
| `PORT` | Backend server port | `3001` | ❌ |
| `VITE_API_URL` | Frontend API base URL (production) | Auto-detected from hostname | ❌ |

**Security Note**: Never commit `.env` files to version control. Use strong, random values for `JWT_SECRET` in production.

## 📱 Responsive Design

The application is optimized for desktop and mobile:
- **Adaptive layouts** for different screen sizes
- **Touch-friendly controls** for mobile interaction
- **Optimized map interaction** on mobile devices
- **Responsive filter panel** that adapts to screen width

## 🎨 Design

- **Color palette**: Ocean-inspired blue tones
- **Typography**: Outfit (display) + DM Sans (body)
- **Dark mode**: Automatic based on system preference
- **Animations**: Subtle transitions and micro-interactions
- **Accessibility**: Semantic HTML and ARIA labels where appropriate

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
