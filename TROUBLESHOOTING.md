# Troubleshooting "Failed to fetch" Error

## Quick Diagnosis

Open your browser's **Developer Console** (F12) and look for error messages. You should see:
```
Attempting login to: http://localhost:3000/api/auth/login
```

## Common Causes & Solutions

### 1. CORS Error (Most Common)

**Symptom:** Console shows:
```
Access to fetch at 'http://localhost:3000/api/auth/login' from origin 'http://localhost:5173' 
has been blocked by CORS policy
```

**Solution:** Enable CORS in your backend. Here's how:

**Node.js/Express:**
```javascript
const cors = require('cors');

app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));
```

**NestJS:**
```typescript
// main.ts
const app = await NestFactory.create(AppModule);
app.enableCors({
  origin: 'http://localhost:5173',
  credentials: true,
});
```

**Fastify:**
```javascript
fastify.register(require('@fastify/cors'), {
  origin: 'http://localhost:5173'
});
```

---

### 2. Backend Not Running

**Symptom:** Console shows:
```
Failed to connect to backend at http://localhost:3000
```

**Solution:**
1. Check if your backend is running: `curl http://localhost:3000/api/auth/login`
2. If not running, start your backend server
3. Verify it's listening on port 3000

---

### 3. Wrong Port or URL

**Symptom:** Connection refused or timeout

**Solution:**

Check your backend's actual port and update accordingly:

**Option A: Create .env file**
```bash
echo "VITE_API_URL=http://localhost:YOUR_ACTUAL_PORT" > .env
```

**Option B: Edit directly in code** (temporary)
```typescript
// src/services/api.ts
const API_BASE_URL = 'http://localhost:YOUR_ACTUAL_PORT';
```

After changing, **restart the dev server**:
```bash
npm run dev
```

---

### 4. Docker Networking Issues

If your **backend is in Docker** and **frontend is local**:

**Problem:** `localhost` in the frontend refers to your machine, not the Docker container.

**Solution:**

Make sure your backend container exposes the port:
```yaml
# docker-compose.yml (backend)
services:
  backend:
    ports:
      - "3000:3000"  # Expose to host
```

If **both frontend and backend are in Docker**:

Update the API URL to use the service name:
```env
VITE_API_URL=http://backend:3000
```

---

## Testing Steps

### 1. Test Backend Directly

```bash
# Test if backend is accessible
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

**Expected:** JSON response with tokens or error message
**If fails:** Backend is not running or wrong URL

### 2. Test from Browser Console

Open browser console (F12) and run:
```javascript
fetch('http://localhost:3000/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'test@example.com',
    password: 'password123'
  })
})
.then(r => r.json())
.then(console.log)
.catch(console.error)
```

**If CORS error:** Add CORS headers to backend
**If network error:** Backend not running or wrong URL

---

## Quick Fixes

### Fix 1: Temporarily Disable CORS (Development Only)

**Chrome/Edge:**
```bash
# macOS
open -na "Google Chrome" --args --disable-web-security --user-data-dir=/tmp/chrome_dev

# Windows
chrome.exe --disable-web-security --user-data-dir=C:\temp\chrome_dev
```

⚠️ **Warning:** Only for testing! Fix CORS in backend instead.

### Fix 2: Use Vite Proxy (Alternative to CORS)

Edit `vite.config.ts`:
```typescript
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
});
```

Then update API service:
```typescript
// src/services/api.ts
const API_BASE_URL = ''; // Empty string uses same origin
```

Restart dev server: `npm run dev`

---

## Verification Checklist

- [ ] Backend is running
- [ ] Backend is on correct port (check console log)
- [ ] CORS is enabled in backend
- [ ] Frontend can reach backend URL
- [ ] No firewall blocking the connection
- [ ] `.env` file exists with correct `VITE_API_URL` (if using)
- [ ] Dev server restarted after `.env` changes

---

## Still Not Working?

1. **Check the browser console** for the exact error message
2. **Share the error** - The improved error messages will tell you exactly what's wrong
3. **Verify backend response format** matches:
   ```json
   {
     "accessToken": "string",
     "refreshToken": "string",
     "user": {
       "id": "string",
       "email": "string"
     }
   }
   ```

Run the login again and check the console - it will now show you exactly what URL it's trying to reach! 🔍
