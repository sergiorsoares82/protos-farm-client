# Docker Setup for Vite Frontend

This project includes Docker configurations for both development and production environments.

## Prerequisites

- Docker Engine 20.10+
- Docker Compose 2.0+

## Quick Start

### Development Mode (with Hot Reload)

Run the development server with hot-reload enabled:

```bash
docker-compose up vite-dev
```

The application will be available at `http://localhost:5173`

### Production Mode

Build and run the production-optimized version with Nginx:

```bash
docker-compose --profile production up vite-prod
```

The application will be available at `http://localhost:8080`

## Docker Commands

### Build Images

```bash
# Build development image
docker-compose build vite-dev

# Build production image
docker-compose build vite-prod
```

### Run Containers

```bash
# Run in foreground
docker-compose up vite-dev

# Run in background (detached mode)
docker-compose up -d vite-dev

# Run production build
docker-compose --profile production up -d vite-prod
```

### Stop Containers

```bash
# Stop all running containers
docker-compose down

# Stop and remove volumes
docker-compose down -v
```

### View Logs

```bash
# Follow logs
docker-compose logs -f vite-dev

# View last 100 lines
docker-compose logs --tail=100 vite-dev
```

### Rebuild After Changes

```bash
# Rebuild without cache
docker-compose build --no-cache vite-dev

# Rebuild and restart
docker-compose up -d --build vite-dev
```

## Project Structure

```
.
├── Dockerfile              # Multi-stage Docker build
├── docker-compose.yml      # Docker Compose configuration
├── .dockerignore          # Files to exclude from Docker context
├── nginx.conf             # Nginx configuration for production
└── README.docker.md       # This file
```

## Configuration Details

### Dockerfile

The Dockerfile uses a multi-stage build approach:

1. **Builder Stage**: Installs dependencies and builds the Vite app
2. **Production Stage**: Serves the built app with Nginx
3. **Development Stage**: Runs Vite dev server with hot-reload

### Docker Compose

- **vite-dev**: Development service with volume mounting for hot-reload
- **vite-prod**: Production service with optimized Nginx setup
- Uses Docker profiles to separate dev and prod environments

### Nginx Configuration

The `nginx.conf` includes:
- SPA routing support (redirects to index.html)
- Static asset caching
- Gzip compression
- Security headers
- Health check endpoint at `/health`

## Environment Variables

To use environment variables in your Vite app:

1. Create a `.env` file in the project root
2. Prefix variables with `VITE_` (e.g., `VITE_API_URL`)
3. Access them in your code: `import.meta.env.VITE_API_URL`

For Docker, add them to `docker-compose.yml`:

```yaml
environment:
  - VITE_API_URL=http://api.example.com
```

## Troubleshooting

### Port Already in Use

If port 5173 or 8080 is already in use, modify the port mapping in `docker-compose.yml`:

```yaml
ports:
  - "3000:5173"  # Use port 3000 instead
```

### Hot Reload Not Working

Ensure you have proper volume mounts in `docker-compose.yml`:

```yaml
volumes:
  - .:/app
  - /app/node_modules
```

### Permission Issues

If you encounter permission issues with node_modules:

```bash
docker-compose down -v
docker-compose up --build vite-dev
```

## Custom Nginx Configuration

To use the custom nginx configuration, uncomment this line in the Dockerfile:

```dockerfile
COPY nginx.conf /etc/nginx/conf.d/default.conf
```

Then rebuild the production image:

```bash
docker-compose build vite-prod
```

## Notes

- The development container mounts your source code as a volume, so changes are reflected immediately
- The production container creates an optimized build served by Nginx
- Node modules are excluded from volume mounts to prevent conflicts
- Use `.dockerignore` to exclude unnecessary files from the Docker build context
