# Quick Start Guide

## Installation & Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
The `.env` file has been created with the default backend URL. You can modify it if needed:
```env
VITE_API_URL=http://localhost:3000
```

### 3. Start Development Server
```bash
npm run dev
```

The application will be available at: **http://localhost:5173**

## Application Routes

- **`/`** - Redirects to `/dashboard` (if authenticated) or `/login` (if not)
- **`/login`** - Login page
- **`/dashboard`** - Protected dashboard (requires authentication)

## Testing the Application

### With Your Backend Running

1. **Start your backend** on `http://localhost:3000`
2. **Start the frontend**: `npm run dev`
3. **Navigate to**: `http://localhost:5173`
4. You'll be redirected to the login page
5. **Enter credentials** (email and password)
6. On successful login, you'll be redirected to the dashboard

### Expected API Interaction

**Request:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

**Expected Response:**
```json
{
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc...",
  "user": {
    "id": "123",
    "email": "user@example.com"
  }
}
```

## Features Implemented

### ✅ Authentication System
- Login form with email and password validation
- JWT token management (accessToken and refreshToken)
- Secure token storage in localStorage
- Protected routes that require authentication
- Logout functionality

### ✅ UI Components (shadcn/ui)
- Beautiful, accessible components
- Form with validation (React Hook Form + Zod)
- Card layouts
- Buttons, inputs, labels
- Loading states
- Error messages

### ✅ Routing
- React Router with protected routes
- Automatic redirects based on auth state
- Loading states during auth checks

### ✅ Type Safety
- Full TypeScript support
- Type-safe API calls
- Validated form inputs

## Docker Usage

### Development Mode
```bash
docker-compose up vite-dev
```
Access at: http://localhost:5173

### Production Mode
```bash
docker-compose --profile production up vite-prod
```
Access at: http://localhost:8080

## File Structure

```
src/
├── components/
│   ├── ui/                    # shadcn/ui components
│   └── ProtectedRoute.tsx     # Route guard
├── contexts/
│   └── AuthContext.tsx        # Auth state management
├── pages/
│   ├── LoginPage.tsx         # Login UI
│   └── Dashboard.tsx         # Protected dashboard
├── services/
│   └── api.ts                # API calls
└── App.tsx                   # Routes & providers
```

## Customization

### Change API URL
Edit `.env`:
```env
VITE_API_URL=https://your-backend.com
```

### Add More API Endpoints
Edit `src/services/api.ts`:
```typescript
export const apiService = {
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    // existing code
  },
  
  // Add new endpoint
  async getProfile(): Promise<User> {
    const token = localStorage.getItem('accessToken');
    const response = await fetch(`${API_BASE_URL}/api/user/profile`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    return response.json();
  },
};
```

### Add More shadcn/ui Components
```bash
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add dropdown-menu
npx shadcn-ui@latest add toast
```

## Troubleshooting

### Backend Connection Failed
1. Ensure backend is running on `http://localhost:3000`
2. Check CORS is enabled on backend
3. Verify API endpoint in `.env` file

### Dependencies Installation Issues
```bash
rm -rf node_modules package-lock.json
npm install
```

### Port Already in Use
Change port in `vite.config.ts`:
```typescript
server: {
  port: 3001, // Change from 5173
}
```

## Next Steps

You can now:
1. ✅ Test the login flow with your backend
2. ✅ Customize the UI and add more pages
3. ✅ Add more API endpoints
4. ✅ Implement token refresh logic
5. ✅ Add more shadcn/ui components
6. ✅ Deploy with Docker

Happy coding! 🚀
