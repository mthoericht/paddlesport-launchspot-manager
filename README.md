# 🚣 Paddlesport Launchspot Manager

A web application for managing launch points for kayaking, canoeing, SUP, and swimming. Users can mark their own launch points on an OpenStreetMap, add details, and filter by various criteria.

![Vue.js](https://img.shields.io/badge/Vue.js-3.5-4FC08D?logo=vue.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript)
![Express](https://img.shields.io/badge/Express-4.21-000000?logo=express)
![Prisma](https://img.shields.io/badge/Prisma-7.2-2D3748?logo=prisma)

## ✨ Features

### 🗺️ Interactive Map
- **OpenStreetMap integration** with Leaflet
- **Address search** with Nominatim geocoding
- **Context menu** (left/right click) for quick point creation
- **Color-coded markers** by category (Kayak, SUP, Swimming, Relaxing)
- **Zoom level preservation** when creating new points

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
├── server/                    # Backend (Express.js)
│   ├── index.ts               # Server entry point
│   ├── prisma.ts              # Prisma Client setup
│   ├── middleware/
│   │   └── auth.ts            # JWT authentication
│   └── routes/
│       ├── auth.ts            # Auth routes (login, signup)
│       └── launchPoints.ts    # CRUD routes for launch points
├── prisma/
│   └── schema.prisma          # Database schema
├── src/                       # Frontend (Vue.js)
│   ├── assets/
│   │   └── auth.css           # Shared auth styles
│   ├── components/
│   │   ├── AppHeader.vue      # App header with navigation
│   │   └── FilterPanel.vue    # Filter sidebar
│   ├── composables/           # Vue Composables (logic)
│   │   ├── index.ts
│   │   ├── useAddressSearch.ts
│   │   ├── useCategories.ts
│   │   ├── useContextMenu.ts
│   │   ├── useLaunchPointForm.ts
│   │   ├── useMapNavigation.ts
│   │   └── useMapState.ts
│   ├── router/
│   │   └── index.ts           # Vue Router configuration
│   ├── stores/                # Pinia Stores (state)
│   │   ├── auth.ts            # Auth state
│   │   └── launchPoints.ts    # Launch points state
│   ├── types/
│   │   └── index.ts           # TypeScript interfaces
│   ├── views/
│   │   ├── ImpressumView.vue
│   │   ├── LaunchPointDetailView.vue
│   │   ├── LaunchPointFormView.vue
│   │   ├── LoginView.vue
│   │   ├── MapView.vue
│   │   └── SignupView.vue
│   ├── App.vue
│   ├── main.ts
│   └── style.css
└── data/                      # SQLite database (not in Git)
```

## 🛠️ Tech Stack

### Frontend
- **Vue.js 3** with Composition API
- **TypeScript** for type safety
- **Pinia** for state management
- **Vue Router** for navigation
- **Leaflet** / **Vue-Leaflet** for maps
- **Vite** as build tool

### Backend
- **Express.js** as REST API server
- **Prisma ORM** with SQLite
- **JWT** (jsonwebtoken) for authentication
- **bcryptjs** for password hashing
- **tsx** for TypeScript execution

### Database
- **SQLite** (local in `data/` directory)
- **Prisma Migrate** for schema changes

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
   ```bash
   # Create .env file
   echo 'DATABASE_URL="file:./data/database.db"' > .env
   echo 'JWT_SECRET="your-secret-key-here"' >> .env
   ```

4. **Initialize database**
   ```bash
   npm run db:push
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

   This starts:
   - Frontend at `http://localhost:5173`
   - Backend at `http://localhost:3001`

## 📜 NPM Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start frontend and backend in parallel |
| `npm run dev:client` | Frontend only (Vite) |
| `npm run dev:server` | Backend only (Express) |
| `npm run build` | Production build |
| `npm run db:migrate` | Run Prisma migrations |
| `npm run db:push` | Push schema to DB (without migration) |
| `npm run db:studio` | Open Prisma Studio |
| `npm run db:generate` | Generate Prisma Client |

## 🔐 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/signup` | Register new user |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Get current user |
| GET | `/api/auth/users` | List all users |

### Launch Points
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/launch-points` | Get all points |
| GET | `/api/launch-points/:id` | Get single point |
| POST | `/api/launch-points` | Create new point |
| PUT | `/api/launch-points/:id` | Update point |
| DELETE | `/api/launch-points/:id` | Delete point |

## 📱 Responsive Design

The application is optimized for desktop and mobile:
- Adaptive layouts for different screen sizes
- Touch-friendly controls
- Optimized map interaction on mobile devices

## 🎨 Design

- **Color palette**: Ocean-inspired blue tones
- **Typography**: Outfit (display) + DM Sans (body)
- **Dark mode**: Automatic based on system preference
- **Animations**: Subtle transitions and micro-interactions

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.
