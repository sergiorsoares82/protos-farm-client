# 🔧 Fix "Failed to fetch" Error

## The Issue
"Failed to fetch" means the frontend cannot connect to your backend. This is almost always one of:
1. **CORS not enabled** in your backend (most common)
2. **Backend not running**
3. **Wrong URL/port**

## ✅ Immediate Solutions

### Solution 1: Enable CORS in Your Backend (Recommended)

Add this to your backend:

**NestJS:**
```typescript
// main.ts
const app = await NestFactory.create(AppModule);
app.enableCors({
  origin: 'http://localhost:5173',
  credentials: true,
});
```

**Express:**
```javascript
const cors = require('cors');
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));
```

### Solution 2: Use Vite Proxy (No backend changes needed)

**Step 1:** Edit `vite.config.ts` - uncomment the proxy section:
```typescript
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:3000',
      changeOrigin: true,
    },
  },
}
```

**Step 2:** Update `src/services/api.ts`:
```typescript
// Change this line:
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// To this:
const API_BASE_URL = ''; // Empty = uses same origin with proxy
```

**Step 3:** Restart dev server:
```bash
npm run dev
```

Now requests to `http://localhost:5173/api/auth/login` will be proxied to `http://localhost:3000/api/auth/login`

## 📝 Configuration Options

### Option A: Using Environment Variable

1. Create `.env` file:
```bash
echo "VITE_API_URL=http://localhost:3000" > .env
```

2. Restart dev server:
```bash
npm run dev
```

### Option B: Change Default URL

Edit `src/services/api.ts`:
```typescript
const API_BASE_URL = 'http://localhost:YOUR_PORT';
```

## 🧪 Test Your Backend

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test123"}'
```

If this works, the backend is running correctly.

## 🔍 Check Browser Console

After the changes, try logging in again and check the browser console (F12). You'll see:
```
Attempting login to: http://localhost:3000/api/auth/login
```

This will tell you exactly what URL it's trying to reach.

## ⚡ Quick Start Commands

```bash
# 1. Make sure backend is running
# (in your backend directory)
npm run dev  # or however you start your backend

# 2. Start frontend
cd /Users/sergiosoares/Documents/it_projects/client
npm run dev

# 3. Open browser to http://localhost:5173
```

See TROUBLESHOOTING.md for more detailed solutions!
