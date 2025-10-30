# Deployment Guide

Complete deployment guide for Hay Chess Tracker on Vercel.

---

## Table of Contents

- [Prerequisites](#prerequisites)
- [Quick Deploy (Vercel)](#quick-deploy-vercel)
- [Environment Variables](#environment-variables)
- [Custom Domain Configuration](#custom-domain-configuration)
- [Monitoring & Logs](#monitoring--logs)
- [Rollback Procedure](#rollback-procedure)
- [Troubleshooting](#troubleshooting)
- [Alternative Platforms](#alternative-platforms)

---

## Prerequisites

Before deploying, ensure you have:

- [x] **Node.js >= 20.x** installed locally
- [x] **npm >= 10.x** installed locally
- [x] **Git** installed and configured
- [x] **GitHub account** for repository hosting
- [x] **Vercel account** (free tier sufficient)
- [x] Repository pushed to GitHub

### Verify Local Build

```bash
# Clone repository
git clone https://github.com/your-org/hay-chess-tracker.git
cd hay-chess-tracker

# Install dependencies
npm install

# Run build
npm run build

# Verify build output
ls -la dist/
```

Expected output in `dist/`:
- `index.html`
- `assets/` (JS, CSS bundles)
- `vite.svg` (favicon)

---

## Quick Deploy (Vercel)

### Step 1: Connect Repository to Vercel

1. **Go to Vercel Dashboard**
   - Visit [vercel.com](https://vercel.com)
   - Sign in with GitHub

2. **Import Project**
   - Click "Add New..." → "Project"
   - Select "Import Git Repository"
   - Choose `hay-chess-tracker` from your GitHub repositories

3. **Configure Project**

Vercel will auto-detect the Vite configuration. Verify these settings:

| Setting | Value |
|---------|-------|
| Framework Preset | **Vite** |
| Root Directory | `.` (root) |
| Build Command | `npm run build` |
| Output Directory | `dist` |
| Install Command | `npm install` |
| Node.js Version | **20.x** |

4. **Deploy**
   - Click "Deploy"
   - Wait 2-3 minutes for first deployment
   - Vercel will provide a production URL: `https://hay-chess-tracker.vercel.app`

### Step 2: Configure Vercel Functions

The API proxy (`/api/scrape`) is automatically deployed as a Vercel Serverless Function.

**Verify Function Deployment:**

1. Go to Vercel Dashboard → Your Project → Functions
2. Check that `/api/scrape` is listed
3. Test the endpoint:

```bash
curl -X POST https://hay-chess-tracker.vercel.app/api/scrape \
  -H "Content-Type: application/json" \
  -d '{"url":"https://www.echecs.asso.fr/FicheTournoi.aspx?Ref=12345&Action=Ls"}'
```

Expected response:
```json
{
  "html": "<html>...</html>"
}
```

### Step 3: Enable Automatic Deployments

Vercel automatically deploys on every push to `master` (or `main`).

**Branches:**
- `master` / `main` → Production deployment
- Other branches → Preview deployments

**Commit & Deploy:**

```bash
git add .
git commit -m "feat: add new feature"
git push origin master
```

Vercel will:
1. Detect push
2. Run build
3. Deploy to production
4. Comment on commit/PR with deployment URL

---

## Environment Variables

### Current Setup

Hay Chess Tracker currently does NOT require environment variables. All configuration is hardcoded or stored in localStorage.

### Future Environment Variables

When implementing backend (Phase 6), you may need:

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/db` |
| `SUPABASE_URL` | Supabase project URL | `https://xxx.supabase.co` |
| `SUPABASE_ANON_KEY` | Supabase anonymous key | `eyJhbGciOiJIUzI1...` |
| `JWT_SECRET` | JWT signing secret | `your-secret-key` |
| `NODE_ENV` | Environment (production/development) | `production` |

### Adding Environment Variables

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add variable:
   - **Key:** `DATABASE_URL`
   - **Value:** `postgresql://...`
   - **Environment:** Production (or All)
3. Click "Save"
4. Redeploy to apply changes

**In code:**

```typescript
// Access in Vercel Function
export default async function handler(req, res) {
  const dbUrl = process.env.DATABASE_URL;
  // ...
}
```

---

## Custom Domain Configuration

### Add Custom Domain

1. **Purchase Domain** (e.g., from Namecheap, Google Domains)

2. **Add to Vercel**
   - Go to Vercel Dashboard → Your Project → Settings → Domains
   - Click "Add"
   - Enter domain: `haychesstracker.com`
   - Follow DNS configuration instructions

3. **Configure DNS**

Vercel provides DNS records to add at your domain registrar:

**Option A: CNAME (Recommended)**
```
Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

**Option B: A Record (Apex domain)**
```
Type: A
Name: @
Value: 76.76.21.21
```

4. **Wait for Propagation**
   - DNS changes take 5 minutes to 48 hours
   - Vercel will automatically provision SSL certificate (Let's Encrypt)

5. **Verify**
   - Visit `https://haychesstracker.com`
   - Check SSL padlock icon

### Redirect www to Apex (or vice versa)

Vercel Dashboard → Settings → Domains → Configure redirect

Example: `www.haychesstracker.com` → `haychesstracker.com`

---

## Monitoring & Logs

### Vercel Dashboard

1. **Real-Time Logs**
   - Dashboard → Your Project → Logs
   - Filter by:
     - Production / Preview
     - Serverless Functions
     - Edge Functions
     - Static requests

2. **Analytics (Pro Plan)**
   - Dashboard → Your Project → Analytics
   - Metrics:
     - Page views
     - Unique visitors
     - Top pages
     - Devices & browsers
     - Performance (Web Vitals)

### Function Logs

View logs for `/api/scrape`:

1. Dashboard → Your Project → Logs
2. Filter by "Functions"
3. See request/response logs and errors

**Example Logs:**

```
2025-10-30 14:32:15 | POST /api/scrape | 200 | 1.2s
2025-10-30 14:32:16 | POST /api/scrape | 400 | 0.1s (Only FFE URLs allowed)
```

### Error Tracking (Recommended)

For production, integrate error tracking:

**Sentry:**

```bash
npm install @sentry/react @sentry/vite-plugin
```

```typescript
// src/main.tsx
import * as Sentry from '@sentry/react';

Sentry.init({
  dsn: 'https://xxx@xxx.ingest.sentry.io/xxx',
  environment: import.meta.env.MODE,
  tracesSampleRate: 1.0,
});
```

**Vercel Integration:**
- Dashboard → Integrations → Sentry
- Connect Sentry account

### Uptime Monitoring

Use external uptime monitoring:

**UptimeRobot (Free):**
1. Create account at [uptimerobot.com](https://uptimerobot.com)
2. Add monitor:
   - Type: HTTP(s)
   - URL: `https://hay-chess-tracker.vercel.app`
   - Interval: 5 minutes
3. Configure alerts (email/Slack)

---

## Rollback Procedure

### Instant Rollback (Vercel UI)

If a deployment breaks production:

1. **Go to Deployments**
   - Dashboard → Your Project → Deployments

2. **Find Previous Working Deployment**
   - List shows all deployments with status
   - Identify last known good deployment (green checkmark)

3. **Promote to Production**
   - Click "..." menu on deployment
   - Click "Promote to Production"
   - Confirm

**Rollback time:** < 1 minute

### Rollback via Git

```bash
# Find commit of last working version
git log --oneline

# Revert to specific commit
git revert <commit-hash>

# Or reset (destructive)
git reset --hard <commit-hash>
git push --force origin master
```

Vercel will automatically deploy the reverted code.

### Rollback Function Only

If only `/api/scrape` is broken:

1. Deploy previous version of `api/scrape.ts`
2. Or temporarily disable function:

```typescript
// api/scrape.ts
export default async function handler(req, res) {
  return res.status(503).json({
    error: 'Service temporarily unavailable',
  });
}
```

---

## Troubleshooting

### Build Fails on Vercel

**Symptom:** Build succeeds locally but fails on Vercel.

**Common Causes:**

1. **Node version mismatch**
   - Solution: Add `.nvmrc`:
     ```
     20.x
     ```

2. **Missing dependencies**
   - Check `package.json` dependencies vs. devDependencies
   - Move build-time deps to `dependencies`:
     ```bash
     npm install --save-prod vite @vitejs/plugin-react
     ```

3. **TypeScript errors**
   - Vercel runs `tsc` in strict mode
   - Fix all TypeScript errors locally:
     ```bash
     npm run build
     ```

4. **Environment-specific code**
   - Avoid Node.js-only APIs in client code
   - Use `import.meta.env` instead of `process.env`

### Serverless Function Timeout

**Symptom:** `/api/scrape` returns 504 Gateway Timeout.

**Cause:** FFE server slow or unresponsive.

**Solutions:**

1. **Increase timeout (Vercel Pro)**
   - `vercel.json`:
     ```json
     {
       "functions": {
         "api/scrape.ts": {
           "maxDuration": 10
         }
       }
     }
     ```

2. **Add timeout to fetch**
   ```typescript
   const controller = new AbortController();
   const timeoutId = setTimeout(() => controller.abort(), 8000);

   const response = await fetch(url, {
     signal: controller.signal,
   });

   clearTimeout(timeoutId);
   ```

3. **Implement retry logic**

### CORS Errors

**Symptom:** CORS errors when calling `/api/scrape`.

**Cause:** Missing CORS headers (shouldn't happen with Vercel Functions).

**Solution:**

```typescript
// api/scrape.ts
export default async function handler(req, res) {
  // Add CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // ... rest of handler
}
```

### localStorage Quota Exceeded

**Symptom:** Users can't save events. Error: "QuotaExceededError".

**Cause:** localStorage limit (5-10MB) exceeded.

**Solutions:**

1. **Compress data**
   ```typescript
   import { compress, decompress } from 'lz-string';

   const compressed = compress(JSON.stringify(data));
   localStorage.setItem(key, compressed);
   ```

2. **Delete old events**
   - Implement auto-cleanup (keep last 10 events)

3. **Migrate to backend** (Phase 6)

### Deployment URL Not Updating

**Symptom:** Old version still visible after deployment.

**Causes:**

1. **Browser cache**
   - Hard refresh: `Ctrl + Shift + R` (Windows) / `Cmd + Shift + R` (Mac)

2. **CDN cache**
   - Vercel CDN caches static assets
   - Wait 1-2 minutes for cache invalidation

3. **Service Worker cache**
   - Clear service worker:
     ```javascript
     navigator.serviceWorker.getRegistrations().then(registrations => {
       registrations.forEach(reg => reg.unregister());
     });
     ```

---

## Alternative Platforms

While Vercel is recommended, Hay Chess Tracker can be deployed elsewhere:

### Netlify

Similar to Vercel, excellent for Vite projects.

**Deploy Steps:**

1. Connect GitHub repository
2. Configure:
   - Build command: `npm run build`
   - Publish directory: `dist`
3. Deploy

**Serverless Functions:**
- Move `api/scrape.ts` to `netlify/functions/scrape.ts`
- Adjust imports

### Cloudflare Pages

Good performance with global edge network.

**Deploy Steps:**

1. Connect GitHub repository
2. Configure:
   - Framework preset: Vite
   - Build command: `npm run build`
   - Output directory: `dist`
3. Deploy

**Serverless Functions:**
- Use Cloudflare Workers
- Rewrite `/api/scrape` using Workers syntax

### AWS Amplify

For AWS-native deployments.

**Deploy Steps:**

1. Connect GitHub repository
2. Auto-detect Vite configuration
3. Deploy

### Self-Hosted (VPS)

For full control.

**Requirements:**
- Linux VPS (Ubuntu 22.04 recommended)
- Nginx or Caddy reverse proxy
- Node.js 20.x

**Steps:**

```bash
# 1. Build locally
npm run build

# 2. Upload dist/ to server
scp -r dist/* user@server:/var/www/hay-chess-tracker/

# 3. Configure Nginx
# /etc/nginx/sites-available/hay-chess-tracker
server {
  listen 80;
  server_name haychesstracker.com;
  root /var/www/hay-chess-tracker;
  index index.html;

  location / {
    try_files $uri $uri/ /index.html;
  }

  location /api {
    proxy_pass http://localhost:3000;
  }
}

# 4. Run API server
cd api
npm install
node scrape.js # Requires Express wrapper
```

---

## Performance Checklist

Before deploying to production, verify:

- [ ] Lighthouse Performance >= 90
- [ ] Bundle size < 300KB (gzipped)
- [ ] Images optimized (WebP/AVIF)
- [ ] Code-splitting implemented
- [ ] Lazy loading for heavy components
- [ ] Service Worker configured (optional)
- [ ] CDN enabled (automatic with Vercel)
- [ ] Compression enabled (automatic with Vercel)

---

## Security Checklist

- [ ] HTTPS enabled (automatic with Vercel)
- [ ] Environment variables not in code
- [ ] API rate limiting implemented
- [ ] Input validation on all endpoints
- [ ] CORS configured correctly
- [ ] Dependencies audited (`npm audit`)
- [ ] Security headers configured

**Recommended Headers:**

```typescript
// vercel.json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        }
      ]
    }
  ]
}
```

---

## Production Deployment Checklist

Before promoting to production:

### Code Quality
- [ ] All tests pass (`npm test`)
- [ ] Coverage >= 70% (`npm run test:coverage`)
- [ ] Linter passes (`npm run lint`)
- [ ] Build succeeds (`npm run build`)
- [ ] No console.log or debugger statements

### Performance
- [ ] Lighthouse Performance >= 90
- [ ] Bundle size < 300KB
- [ ] Critical CSS inlined
- [ ] Lazy loading implemented

### Security
- [ ] npm audit 0 high/critical vulnerabilities
- [ ] Environment variables secured
- [ ] HTTPS configured
- [ ] Security headers added

### Monitoring
- [ ] Error tracking configured (Sentry)
- [ ] Uptime monitoring configured (UptimeRobot)
- [ ] Analytics configured (Vercel Analytics)

### Documentation
- [ ] CHANGELOG.md updated
- [ ] Release notes written
- [ ] Deployment verified on staging

---

## Support & Resources

**Vercel Documentation:**
- [Vercel Docs](https://vercel.com/docs)
- [Vite on Vercel](https://vercel.com/docs/frameworks/vite)
- [Serverless Functions](https://vercel.com/docs/functions)

**Troubleshooting:**
- [Vercel Community](https://github.com/vercel/vercel/discussions)
- [Project Issues](https://github.com/hay-chess/hay-chess-tracker/issues)

---

**Last Updated:** 30 October 2025
**Maintained by:** Hay Chess Tracker Team
