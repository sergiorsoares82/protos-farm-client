# Vite + React + TypeScript Frontend

A modern frontend application built with Vite, React, and TypeScript, fully containerized with Docker.

## Features

- ⚡️ [Vite](https://vitejs.dev/) - Lightning fast frontend tooling
- ⚛️ [React 18](https://react.dev/) - Modern React with hooks
- 🔷 [TypeScript](https://www.typescriptlang.org/) - Type safety and better DX
- 🎨 Modern CSS with dark/light mode support
- 🐳 Full Docker support (development & production)
- 🔥 Hot Module Replacement (HMR) in development
- 📦 Optimized production builds with Nginx

## Quick Start

### Local Development (without Docker)

1. **Install dependencies:**
```bash
npm install
```

2. **Start development server:**
```bash
npm run dev
```

The app will be available at `http://localhost:5173`

3. **Build for production:**
```bash
npm run build
```

4. **Preview production build:**
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
│   ├── assets/         # Static assets (images, fonts, etc.)
│   ├── App.tsx         # Main App component
│   ├── App.css         # App styles
│   ├── main.tsx        # Application entry point
│   ├── index.css       # Global styles
│   └── vite-env.d.ts   # Vite type definitions
├── public/             # Public static files
│   └── vite.svg        # Vite logo
├── index.html          # HTML entry point
├── vite.config.ts      # Vite configuration
├── tsconfig.json       # TypeScript configuration
├── package.json        # Dependencies and scripts
├── Dockerfile          # Docker multi-stage build
├── docker-compose.yml  # Docker Compose services
└── nginx.conf          # Nginx configuration for production
```

## Available Scripts

- `npm run dev` - Start development server with HMR
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally
- `npm run lint` - Run ESLint

## Environment Variables

Vite exposes environment variables starting with `VITE_` prefix:

1. Create a `.env` file in the root directory:
```env
VITE_API_URL=https://api.example.com
VITE_APP_TITLE=My App
```

2. Access them in your code:
```typescript
const apiUrl = import.meta.env.VITE_API_URL
```

## Building for Production

The production build is optimized and minified:

```bash
npm run build
```

This creates a `dist` folder with optimized assets ready to be served by any static hosting service or the included Nginx Docker container.

## Docker Deployment

For production deployment with Docker:

```bash
docker-compose --profile production up -d vite-prod
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
- **Linting:** ESLint with TypeScript support
- **Container:** Docker with multi-stage builds
- **Web Server:** Nginx (production)

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is open source and available under the [MIT License](LICENSE).
