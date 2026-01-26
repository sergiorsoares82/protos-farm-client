# Vite + React + TypeScript Frontend with Authentication

A modern frontend application built with Vite, React, TypeScript, and shadcn/ui, featuring a complete authentication system with login functionality.

## Features

- ⚡️ [Vite](https://vitejs.dev/) - Lightning fast frontend tooling
- ⚛️ [React 18](https://react.dev/) - Modern React with hooks
- 🔷 [TypeScript](https://www.typescriptlang.org/) - Type safety and better DX
- 🎨 [shadcn/ui](https://ui.shadcn.com/) - Beautiful, accessible components built with Radix UI and Tailwind CSS
- 🔐 Complete authentication system with JWT tokens
- 🛣️ [React Router](https://reactrouter.com/) - Client-side routing with protected routes
- 📝 [React Hook Form](https://react-hook-form.com/) - Performant form validation
- ✅ [Zod](https://zod.dev/) - TypeScript-first schema validation
- 🐳 Full Docker support (development & production)
- 🔥 Hot Module Replacement (HMR) in development
- 📦 Optimized production builds with Nginx

## Quick Start

### Local Development (without Docker)

1. **Install dependencies:**
```bash
npm install
```

2. **Configure environment:**
```bash
cp .env.example .env
# Edit .env and set your backend API URL (default: http://localhost:3000)
```

3. **Start development server:**
```bash
npm run dev
```

The app will be available at `http://localhost:5173`

4. **Build for production:**
```bash
npm run build
```

5. **Preview production build:**
```bash
npm run preview
```

### Docker Development

See [README.docker.md](./README.docker.md) for detailed Docker instructions.

**Quick commands:**

```bash
# Development with hot-reload
docker-compose up vite-dev

# Production build
docker-compose --profile production up vite-prod
```

## Project Structure

```
.
├── src/
│   ├── components/
│   │   ├── ui/                 # shadcn/ui components
│   │   │   ├── button.tsx
│   │   │   ├── input.tsx
│   │   │   ├── label.tsx
│   │   │   ├── card.tsx
│   │   │   └── form.tsx
│   │   └── ProtectedRoute.tsx  # Route guard component
│   ├── contexts/
│   │   └── AuthContext.tsx     # Authentication state management
│   ├── lib/
│   │   └── utils.ts            # Utility functions
│   ├── pages/
│   │   ├── LoginPage.tsx       # Login page with form
│   │   └── Dashboard.tsx       # Protected dashboard
│   ├── services/
│   │   └── api.ts              # API service layer
│   ├── assets/                 # Static assets
│   ├── App.tsx                 # Main App with routing
│   ├── main.tsx                # Application entry point
│   └── index.css               # Global styles with Tailwind
├── public/                     # Public static files
├── index.html                  # HTML entry point
├── vite.config.ts              # Vite configuration
├── tsconfig.json               # TypeScript configuration
├── tailwind.config.js          # Tailwind CSS configuration
├── components.json             # shadcn/ui configuration
├── package.json                # Dependencies and scripts
├── Dockerfile                  # Docker multi-stage build
├── docker-compose.yml          # Docker Compose services
└── nginx.conf                  # Nginx configuration for production
```

## Authentication System

### How It Works

1. **Login Flow:**
   - User enters email and password on `/login` page
   - Form validates inputs using Zod schema
   - API call to `POST /api/auth/login` on your backend
   - Backend returns `{ accessToken, refreshToken, user: { id, email } }`
   - Tokens and user data stored in localStorage
   - User redirected to `/dashboard`

2. **Protected Routes:**
   - Routes wrapped with `ProtectedRoute` component
   - Checks authentication status before rendering
   - Redirects to `/login` if not authenticated

3. **Token Storage:**
   - `accessToken` - Stored in localStorage for API requests
   - `refreshToken` - Stored in localStorage for token refresh
   - `user` - User data stored in localStorage

4. **Logout:**
   - Clears all tokens and user data from localStorage
   - Redirects to login page

### Backend API Requirements

Your backend should implement:

```typescript
POST /api/auth/login
Request Body:
{
  "email": "user@example.com",
  "password": "password123"
}

Response (200 OK):
{
  "accessToken": "jwt_access_token",
  "refreshToken": "jwt_refresh_token",
  "user": {
    "id": "user_id",
    "email": "user@example.com"
  }
}

Error Response (401 Unauthorized):
{
  "message": "Invalid credentials"
}
```

## Available Scripts

- `npm run dev` - Start development server with HMR
- `npm run build` - Build for production (type-check + build)
- `npm run preview` - Preview production build locally
- `npm run lint` - Run ESLint

## Environment Variables

Create a `.env` file in the root directory (see `.env.example`):

```env
VITE_API_URL=http://localhost:3000
```

Access in your code:
```typescript
const apiUrl = import.meta.env.VITE_API_URL
```

## Using shadcn/ui Components

shadcn/ui components are already installed. To add more components:

```bash
npx shadcn-ui@latest add [component-name]
```

Example:
```bash
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add dropdown-menu
```

Visit [ui.shadcn.com](https://ui.shadcn.com/) for available components.

## Customization

### Changing Theme Colors

Edit `tailwind.config.js` and `src/index.css` to customize the color scheme. shadcn/ui uses CSS variables for theming.

### Adding Dark Mode

shadcn/ui supports dark mode out of the box. Add a theme toggle:

```bash
npx shadcn-ui@latest add dropdown-menu
```

Then implement a theme switcher component.

## Building for Production

The production build is optimized and minified:

```bash
npm run build
```

This creates a `dist` folder with optimized assets ready to be served by any static hosting service or the included Nginx Docker container.

## Docker Deployment

For production deployment with Docker:

```bash
# Build and run production container
docker-compose --profile production up -d vite-prod

# View logs
docker-compose logs -f vite-prod
```

The application will be served by Nginx with:
- Gzip compression
- Asset caching
- SPA routing support
- Security headers

## Tech Stack

- **Framework:** React 18.2
- **Build Tool:** Vite 5.0
- **Language:** TypeScript 5.2
- **UI Components:** shadcn/ui (Radix UI + Tailwind CSS)
- **Styling:** Tailwind CSS 3.4
- **Routing:** React Router 6
- **Form Management:** React Hook Form 7
- **Validation:** Zod 3
- **Icons:** Lucide React
- **Linting:** ESLint with TypeScript support
- **Container:** Docker with multi-stage builds
- **Web Server:** Nginx (production)

## API Service

The API service is located in `src/services/api.ts`. To add more API endpoints:

```typescript
export const apiService = {
  // Existing login method
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    // ...
  },

  // Add new methods
  async getProfile(): Promise<User> {
    const token = localStorage.getItem('accessToken');
    const response = await fetch(`${API_BASE_URL}/api/user/profile`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    return response.json();
  },
};
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is open source and available under the [MIT License](LICENSE).

## Troubleshooting

### Backend Connection Issues

If you can't connect to your backend:

1. Check that your backend is running on `http://localhost:3000`
2. Verify the `VITE_API_URL` in your `.env` file
3. Check CORS settings on your backend
4. Look at browser console for specific error messages

### Hot Reload Not Working in Docker

If hot reload isn't working in Docker:

1. Ensure volume mounts are correct in `docker-compose.yml`
2. Check that `usePolling: true` is set in `vite.config.ts`

### Build Errors

If you encounter build errors:

```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear Vite cache
rm -rf node_modules/.vite
```
