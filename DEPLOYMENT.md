# Deployment Guide - Option A: Vercel Serverless API + Frontend

This guide covers deploying the Gift & Sons platform to Vercel with both frontend and backend running together.

## Architecture Overview

- **Frontend**: React/Vite app deployed as static build to Vercel
- **Backend**: Express.js running as Vercel serverless functions
- **API Routing**: `/api/*` requests route through Vercel serverless functions to Express
- **Database**: Firestore (cloud-hosted, credentials via environment variables)

## Project Structure for Vercel Deployment

```
/
├── api/                          # Vercel serverless functions
│   ├── [...]path].js             # Catch-all handler for dynamic routes
│   ├── _expressProxy.js          # Helper to proxy requests to Express
│   ├── properties/
│   │   ├── featured.js           # Explicit handler for performance
│   │   └── [id].js
│   ├── cars/
│   │   ├── featured.js
│   │   └── [id].js
│   └── health.js                 # Simple health check
│
├── server/                       # Express backend (compiled to CommonJS)
│   ├── dist/                     # Compiled JS (committed to git for Vercel)
│   ├── src/
│   │   ├── app.ts                # Express app factory
│   │   ├── routes.ts             # API route definitions
│   │   ├── firebase-admin.ts     # Firebase Admin SDK
│   │   └── ...
│   └── package.json
│
├── client/                       # React frontend (Vite)
│   ├── src/
│   ├── dist/                     # Built frontend (generated during build)
│   ├── vite.config.ts
│   └── package.json
│
├── vercel.json                   # Vercel deployment config
├── package.json                  # Root package with build scripts
└── README.md
```

## Setup Steps

### 1. Local Development (Already Done ✅)

The project is already configured for local development with both servers running in parallel:

```bash
npm run dev
# Starts:
# - Backend on http://localhost:5000
# - Frontend on http://localhost:5173
# - Vite proxy routes /api/* to backend
```

**Key files**:
- `package.json`: `dev` script uses `concurrently` to run both servers
- `client/vite.config.ts`: Proxy configuration for `/api/*` routes
- `client/src/api.ts`: Dynamic API URL resolution (uses relative paths in dev)

### 2. Vercel Project Setup

#### Step 1: Import Repository
1. Go to [vercel.com](https://vercel.com)
2. Click "New Project" → "Import Git Repository"
3. Select `JohnAlex1900/gift-and-sons`
4. Click "Import"

#### Step 2: Configure Build Settings
In Vercel project settings, configure:

- **Project Name**: gift-and-sons
- **Framework**: Other (since we have custom build)
- **Root Directory**: `.` (repository root, not `/client`)
- **Build Command**: `npm run build`
- **Output Directory**: `client/dist`
- **Install Command**: `npm install`

#### Step 3: Add Environment Variables

Go to **Settings → Environment Variables** and add:

**Frontend Variables (development, preview, production)**:
```
VITE_FIREBASE_API_KEY = AIzaSyBUoow980B4TWoEhVSYuTfRbbvspQdL6kk
VITE_FIREBASE_PROJECT_ID = giftandsons-f2952
VITE_FIREBASE_APP_ID = 1:511753409697:web:07d449384bb60b5bf84ce0
VITE_FIREBASE_AUTH_DOMAIN = giftandsons-f2952.firebaseapp.com
VITE_FIREBASE_STORAGE_BUCKET = giftandsons-f2952.firebasestorage.app
VITE_ADMIN_EMAIL = admin@giftandsons-f2952.iam.gserviceaccount.com
VITE_API_BASE_URL = https://www.giftandsonsinternational.com
```

**Backend Variables (production only - for serverless functions)**:

⚠️ **Critical**: These are used by Express running in serverless functions.

```
FIREBASE_SERVICE_ACCOUNT_JSON = <copy entire JSON from Firebase service account>
```

**Option B** (if split variables preferred):
```
FIREBASE_PROJECT_ID = giftandsons-f2952
FIREBASE_CLIENT_EMAIL = firebase-adminsdk-xxxx@giftandsons-f2952.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY = -----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n
```

**Optional variables**:
```
ADMIN_EMAIL = admin@giftandsons-f2952.iam.gserviceaccount.com
FRONTEND_ORIGINS = https://giftandsonsinternational.com,https://www.giftandsonsinternational.com
```

### 3. Firebase Service Account Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select project: **giftandsons-f2952**
3. Go to **Project Settings → Service Accounts**
4. Click **Generate New Private Key**
5. Copy the entire JSON file content
6. Paste into `FIREBASE_SERVICE_ACCOUNT_JSON` in Vercel

The JSON should look like:
```json
{
  "type": "service_account",
  "project_id": "giftandsons-f2952",
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-...@giftandsons-f2952.iam.gserviceaccount.com",
  "client_id": "...",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token"
}
```

### 4. Deploy

Once environment variables are set:

1. Click **Deploy** in Vercel
2. Wait for build to complete
3. Verify at: https://www.giftandsonsinternational.com

## How It Works

### Build Process

```bash
npm run build
# Runs:
# 1. npm --prefix server run build
#    - Compiles server/src → server/dist (CommonJS)
#    - Uses ts-add-js-extension to add .js extensions
#
# 2. npm --prefix client run build
#    - Vite builds React app → client/dist
#    - Includes optimized chunks, code splitting, etc.
```

### Vercel Deployment

1. **Vercel downloads repo** including committed `server/dist/` files
2. **Static files** (`client/dist/`) served from Vercel CDN
3. **API requests** (`/api/*`) routed to serverless functions in `api/` directory
4. **Serverless functions** import Express app from `server/dist/app.js`
5. **Express** handles routing, Firebase calls, database queries

### Request Flow

```
User Request
    ↓
Vercel (edge, routing layer)
    ├─→ GET / → client/dist/index.html (CDN, cached)
    ├─→ GET /api/properties → api/[...path].js serverless function
    │   └─→ Express app at server/dist/app.js
    │       └─→ GET /api/properties route handler
    │           └─→ storage.getAllProperties()
    │               └─→ Firestore (via Firebase Admin SDK)
    └─→ (other routes)
```

## Troubleshooting

### "Cannot GET /" on Production

**Cause**: Build output directory not configured correctly.

**Fix**:
1. Verify Vercel Output Directory = `client/dist`
2. Re-deploy: Settings → Redeploy

### API Endpoint Returns 500

**Cause**: Firebase credentials misconfigured.

**Fix**:
1. **Check backend logs**: Vercel → Project → Function Logs
2. **Look for errors**:
   - `"does not look like a private key"` → Private key is malformed or is a certificate
   - `"Getting metadata from plugin failed"` → Private key format issue
   - `"Cannot read config from"` → Missing or empty `FIREBASE_SERVICE_ACCOUNT_JSON`

3. **To fix**:
   - Regenerate Firebase service account key
   - Copy **entire JSON** (not just private_key field)
   - Use Vercel UI to paste (handles escaping automatically)
   - Re-deploy or wait for Vercel to skip cache

### Frontend Shows "Cannot Get /"

**Cause**: Static build didn't include `index.html` or wrong output directory.

**Fix**:
1. Verify: `client/dist/index.html` exists locally after `npm run build`
2. In Vercel, set Output Directory = `client/dist` (not `client` or `dist`)

### API Works Locally But Not on Production

**Cause**: `VITE_API_BASE_URL` might be pointing to wrong endpoint or local address.

**Fix**:
- Local dev: `client/src/api.ts` uses relative paths + Vite proxy
- Production: set `VITE_API_BASE_URL = https://www.giftandsonsinternational.com`
- Or leave empty (code tries same-origin by default)

## Monitoring

### Check Production Status

```bash
# Test frontend
curl https://www.giftandsonsinternational.com/

# Test API
curl https://www.giftandsonsinternational.com/api/properties

# Check function logs
# Vercel Dashboard → Project → Function Logs → api/[...path].js
```

### View Logs

1. Vercel Dashboard
2. Select project → "gift-and-sons"
3. Go to **Deployments** tab
4. Click latest deployment
5. View **Function Logs** for `/api/*` routes
6. View **Build Logs** for build errors

## Common Environment Variable Formats

### Firebase Service Account JSON

**✅ Correct format**:
```json
{
  "type": "service_account",
  "project_id": "giftandsons-f2952",
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-...@giftandsons-f2952.iam.gserviceaccount.com"
}
```

**✅ Also correct (base64-encoded)**:
```
eyJ0eXBlIjoidXNlcl9hY2NvdW50IiwicHJvamVjdF9pZCI6Imdp...
```

**❌ Wrong** (truncated private key):
```
"private_key": "-----BEGIN PRIVATE KEY-----\n...END"
```

**❌ Wrong** (certificate instead of private key):
```
"private_key": "-----BEGIN CERTIFICATE-----\n...END CERTIFICATE-----"
```

## Performance Optimization

### Serverless Function Performance

- **Explicit handlers** (`api/properties/featured.js`, `api/cars/featured.js`) are faster
- **Catch-all handler** (`api/[...path].js`) handles unknown routes
- **Cold starts**: First request takes 1-3 seconds, subsequent requests <100ms

### Caching Strategy

From `vercel.json`:
```json
{
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [{ "key": "Cache-Control", "value": "no-cache" }]
    },
    {
      "source": "/assets/(.*)",
      "headers": [
        { "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }
      ]
    }
  ]
}
```

- API responses: **not cached** (fresh data)
- Static assets (`/assets/*`): **cached for 1 year** (content-hashed, safe to cache)

## Security

### Secrets Management

- **Never commit** `.env` files
- **Use Vercel UI** for environment variables (encrypted)
- **Rotate keys** after deploying code changes that expose them
- **Audit logs**: Check Vercel → Project Settings → Audit Log for secret access

### Firebase Rules

Verify Firestore security rules restrict public access appropriately:

```
match /collections {
  // Only permit reads for authenticated users
  allow read: if request.auth != null;
  // Only admin can write
  allow write: if request.auth.token.admin == true;
}
```

## Next Steps After Deployment

1. **Test production**: `curl https://www.giftandsonsinternational.com/api/properties`
2. **Verify data**: Check featured properties load on home page
3. **Monitor logs**: Set up Vercel alerts for errors
4. **Iterate**: Make code changes, push to main, Vercel auto-deploys

## Git Commits and Deployment

Every commit to `main` branch triggers auto-deployment:

```bash
git add .
git commit -m "Your changes"
git push origin main
# → Vercel auto-detects → builds → deploys
```

To skip auto-deploy, add `[skip ci]` to commit message:

```bash
git commit -m "Changes [skip ci]"
```

## Support & Debugging

### Check Deployment Status

```
Vercel Dashboard → Deployments → view latest
```

### Real-Time Logs

```
Vercel CLI: vercel logs <deployment-url>
```

### Build Issues

Check `Build Logs` in Vercel for:
- Node version issues (should be 20.x)
- Missing dependencies
- TypeScript compilation errors

## Useful Commands

```bash
# Local test before deploying
npm run build      # Build both frontend and backend
npm run check      # TypeScript type check

# View local build output
ls client/dist/    # Check frontend build
ls server/dist/    # Check backend build

# Git operations
git log --oneline                      # View commits
git push origin main                   # Push and trigger deploy
git pull origin main                   # Pull latest
git status                            # Check uncommitted changes
```

---

**Last Updated**: April 17, 2026
**Deployment Status**: ✅ Ready for Vercel

