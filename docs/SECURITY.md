# Security Policy

Security policy and best practices for Hay Chess Tracker.

---

## Table of Contents

- [Reporting Vulnerabilities](#reporting-vulnerabilities)
- [Supported Versions](#supported-versions)
- [Known Vulnerabilities](#known-vulnerabilities)
- [Security Best Practices](#security-best-practices)
- [CORS Policy](#cors-policy)
- [Input Validation](#input-validation)
- [Dependencies Audit](#dependencies-audit)
- [Authentication & Authorization](#authentication--authorization)
- [Data Privacy](#data-privacy)
- [Incident Response](#incident-response)

---

## Reporting Vulnerabilities

We take security seriously. If you discover a security vulnerability, please follow responsible disclosure:

### How to Report

**DO NOT** open a public GitHub issue for security vulnerabilities.

Instead, please email:

**Security Contact:** security@haychess.club (or create a GitHub Security Advisory)

**Include:**

1. **Description** - Clear description of the vulnerability
2. **Impact** - What could an attacker do?
3. **Steps to Reproduce** - Detailed reproduction steps
4. **Proof of Concept** - Code, screenshots, or video
5. **Suggested Fix** - If you have one (optional)
6. **Your Contact Info** - So we can discuss the issue

### What to Expect

- **Acknowledgment:** Within 48 hours
- **Initial Assessment:** Within 1 week
- **Fix Timeline:** Depends on severity (see below)
- **Disclosure:** After fix is deployed (coordinated disclosure)

### Severity Levels

| Severity | Examples | Response Time |
|----------|----------|---------------|
| **Critical** | RCE, SQL injection, authentication bypass | 24-48 hours |
| **High** | XSS, CSRF, sensitive data exposure | 1 week |
| **Medium** | Information disclosure, DoS | 2 weeks |
| **Low** | Minor information leakage | 1 month |

### Bug Bounty

Currently no bug bounty program. This may change in the future.

---

## Supported Versions

| Version | Supported | Notes |
|---------|-----------|-------|
| 1.0.0-beta (current) | ✅ Yes | Active development |
| < 1.0.0 | ❌ No | Pre-release versions |

**Security Updates:**

- Critical/High vulnerabilities: Patch released ASAP
- Medium vulnerabilities: Next minor release
- Low vulnerabilities: Next major release

---

## Known Vulnerabilities

### Current Status (v1.0.0-beta)

**npm audit results:**

```
5 vulnerabilities (3 moderate, 2 high)
```

**Details:**

#### 1. esbuild - Moderate

- **Package:** `esbuild` (transitive dependency via Vite)
- **CVE:** CVE-2024-XXXXX
- **Impact:** Potential arbitrary code execution during build
- **Mitigation:** Build runs in CI environment (not production)
- **Status:** Monitoring for upstream fix
- **Fix ETA:** Q4 2025 (Vite update)

#### 2. path-to-regexp - Moderate

- **Package:** `path-to-regexp` (transitive via Express)
- **CVE:** CVE-2024-45296
- **Impact:** ReDoS (Regular Expression Denial of Service)
- **Mitigation:** Not used in production code
- **Status:** Monitoring for upstream fix
- **Fix ETA:** Q4 2025

#### 3. undici - High

- **Package:** `undici` (transitive via Node.js fetch polyfill)
- **CVE:** CVE-2024-XXXXX
- **Impact:** HTTP request smuggling
- **Mitigation:** Not exposed in client code; serverless function isolated
- **Status:** **URGENT** - Awaiting Node.js 20.x patch
- **Fix ETA:** Q4 2025 (Node.js update)

### Automatic Vulnerability Scanning

- **Dependabot:** Enabled on GitHub
- **npm audit:** Run weekly via GitHub Actions
- **Snyk:** Planned for Phase 2

---

## Security Best Practices

### For Developers

#### 1. Input Validation

**ALWAYS validate user input:**

```typescript
// ❌ BAD
function scrape(url: string) {
  return fetch(url);
}

// ✅ GOOD
function scrape(url: string) {
  if (!url || typeof url !== 'string') {
    throw new Error('Invalid URL');
  }

  if (!url.includes('echecs.asso.fr')) {
    throw new Error('Only FFE URLs allowed');
  }

  const parsedUrl = new URL(url); // Throws if invalid
  return fetch(parsedUrl.toString());
}
```

#### 2. Output Encoding

**Escape user-generated content:**

```typescript
// ❌ BAD
<div dangerouslySetInnerHTML={{__html: userInput}} />

// ✅ GOOD
<div>{userInput}</div> // React auto-escapes
```

#### 3. Secure localStorage

**Never store sensitive data in localStorage:**

- ❌ Passwords
- ❌ API keys
- ❌ Personal data (GDPR violation)
- ✅ Public tournament data (OK)

**Sanitize before storing:**

```typescript
function saveEvent(event: Event) {
  // Validate event structure
  if (!event.id || !event.name) {
    throw new Error('Invalid event');
  }

  // Sanitize URLs
  event.tournaments.forEach(t => {
    t.url = sanitizeUrl(t.url);
  });

  localStorage.setItem('hay-chess-tracker', JSON.stringify(event));
}
```

#### 4. HTTPS Only

**Never disable HTTPS in production:**

- Vercel enforces HTTPS automatically
- All API calls must use HTTPS

#### 5. No Secrets in Code

**Never commit:**

- API keys
- Passwords
- Private keys
- `.env` files

**Use environment variables:**

```typescript
// ✅ GOOD
const apiKey = process.env.API_KEY;
```

**.gitignore:**

```
.env
.env.local
.env.production
credentials.json
secrets/
```

---

## CORS Policy

### Current Policy

**Frontend (SPA):**
- Same-origin policy enforced by browser
- No CORS issues (static assets from same domain)

**API (/api/scrape):**
- Accepts requests from any origin (`Access-Control-Allow-Origin: *`)
- Public endpoint (no authentication required)

**Rationale:**

- Tournament data is public on FFE website
- No sensitive data transmitted
- No authentication/authorization

### Future Policy (Phase 6 - Backend)

When implementing backend with authentication:

```typescript
// vercel.json
{
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        {
          "key": "Access-Control-Allow-Origin",
          "value": "https://haychesstracker.com"
        },
        {
          "key": "Access-Control-Allow-Methods",
          "value": "GET, POST, PUT, DELETE, OPTIONS"
        },
        {
          "key": "Access-Control-Allow-Headers",
          "value": "Content-Type, Authorization"
        },
        {
          "key": "Access-Control-Allow-Credentials",
          "value": "true"
        }
      ]
    }
  ]
}
```

---

## Input Validation

### API Endpoint Validation

**Endpoint:** `/api/scrape`

**Validation Rules:**

1. **Method:** POST only (reject GET, PUT, DELETE, etc.)
2. **Content-Type:** `application/json`
3. **Body:**
   - Must contain `url` field
   - `url` must be a string
   - `url` must contain `echecs.asso.fr` domain
   - `url` must be valid URL (throw if `new URL(url)` fails)

**Implementation:**

```typescript
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // 1. Validate method
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // 2. Extract URL
  const { url } = req.body;

  // 3. Validate URL exists
  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'URL is required' });
  }

  // 4. Validate domain
  if (!url.includes('echecs.asso.fr')) {
    return res.status(400).json({ error: 'Only FFE URLs are allowed' });
  }

  // 5. Validate URL format
  try {
    new URL(url);
  } catch {
    return res.status(400).json({ error: 'Invalid URL format' });
  }

  // Proceed with fetch
  // ...
}
```

### Client-Side Validation

**EventForm:**

```typescript
// Validate event name
if (!eventName || eventName.trim().length < 3) {
  setError('Event name must be at least 3 characters');
  return;
}

// Validate tournament URL
if (!url.includes('echecs.asso.fr')) {
  setError('Invalid FFE URL');
  return;
}

try {
  new URL(url);
} catch {
  setError('Invalid URL format');
  return;
}
```

**Benefits:**

- Immediate user feedback
- Reduced invalid API calls
- Better UX

---

## Dependencies Audit

### Automated Auditing

**npm audit:**

```bash
# Run audit
npm audit

# Fix automatically (non-breaking)
npm audit fix

# Fix with breaking changes (use caution)
npm audit fix --force
```

**GitHub Actions (Weekly):**

```yaml
# .github/workflows/security-audit.yml
name: Security Audit
on:
  schedule:
    - cron: '0 0 * * 0' # Every Sunday
  workflow_dispatch:

jobs:
  audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm audit --audit-level=high
```

**Dependabot:**

GitHub automatically creates PRs for dependency updates.

### Manual Review

**Before merging dependency updates:**

1. Check CHANGELOG of updated package
2. Look for security advisories
3. Review breaking changes
4. Test locally (`npm install && npm test && npm run build`)
5. Merge PR

### Pinning Dependencies

**Strategy:**

- ✅ Pin exact versions in `package.json` for reproducible builds
- ✅ Use `package-lock.json` (committed to Git)
- ❌ Don't use `^` or `~` for critical dependencies

**Exception:**

Development tools (ESLint, Prettier) can use `^` for latest features.

---

## Authentication & Authorization

### Current Status (v1.0.0-beta)

**No authentication** - Application is client-side only with localStorage.

**Anyone can:**
- View all events (if they have physical access to the device)
- Create/edit/delete events
- Validate results

**Risk Level:** Low (single-user device, public tournament data)

### Future Implementation (Phase 6)

**Authentication:**
- Supabase Auth (email + password, OAuth)
- JWT tokens (httpOnly cookies)
- Session management

**Authorization:**
- **Admin:** Full access (create events, manage users)
- **Validator:** Can validate results
- **Viewer:** Read-only access

**Implementation:**

```typescript
// Middleware
export function requireAuth(req: Request) {
  const token = req.cookies.get('auth_token');
  if (!token) {
    throw new Error('Unauthorized');
  }

  const user = verifyJWT(token);
  return user;
}

// Usage
export default async function handler(req: Request) {
  const user = requireAuth(req);

  if (!user.isAdmin) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Admin-only logic
}
```

---

## Data Privacy

### GDPR Compliance

**Personal Data Collected:**

- Player names (public from FFE)
- Player ELO (public from FFE)
- Club affiliation (public from FFE)

**No PII (Personally Identifiable Information):**

- ❌ Email addresses
- ❌ Phone numbers
- ❌ Physical addresses
- ❌ Birthdates

**Data Storage:**

- Browser localStorage (client-side only)
- No server-side storage (v1.0.0-beta)
- No cookies (except Vercel analytics)

**User Rights:**

- **Right to Access:** Users can export data (JSON export)
- **Right to Deletion:** Users can delete all data (clear localStorage)
- **Right to Portability:** JSON export/import

**Data Retention:**

- Data persists until user clears localStorage
- No automatic deletion

### Cookies Policy

**Vercel Analytics Cookies:**

- `__vercel_analytics` - Anonymous usage tracking
- No personal data collected
- Can be disabled in browser

**Future (Phase 6):**

- Authentication cookies (JWT)
- Session cookies
- Cookie consent banner (EU requirement)

---

## Incident Response

### Incident Response Plan

#### 1. Detection

**How we detect security incidents:**

- Automated alerts (npm audit, Dependabot)
- User reports (security@haychess.club)
- Monitoring (Sentry error tracking)
- Vercel logs

#### 2. Assessment

**Severity Classification:**

| Severity | Response Time | Team |
|----------|---------------|------|
| **Critical** | < 1 hour | All hands |
| **High** | < 4 hours | Tech lead + developer |
| **Medium** | < 24 hours | Developer |
| **Low** | < 1 week | Next sprint |

#### 3. Containment

**Immediate Actions:**

1. **Disable affected endpoint** (if applicable)
2. **Rollback deployment** (Vercel instant rollback)
3. **Notify users** (if data breach)
4. **Document incident**

#### 4. Eradication

**Fix the vulnerability:**

1. Identify root cause
2. Develop patch
3. Test patch thoroughly
4. Deploy fix

#### 5. Recovery

**Restore normal operations:**

1. Verify fix works
2. Monitor for anomalies
3. Update documentation
4. Communicate resolution

#### 6. Post-Incident

**Learn and improve:**

1. Write incident report
2. Update security procedures
3. Improve monitoring
4. Train team

### Communication Plan

**Internal:**
- Slack channel: #incidents
- Email: team@haychess.club

**External:**
- GitHub Security Advisory
- Blog post (if major incident)
- Email to affected users

---

## Security Checklist

### Pre-Deployment Checklist

- [ ] npm audit shows 0 high/critical vulnerabilities
- [ ] All dependencies up-to-date
- [ ] HTTPS enforced
- [ ] Environment variables not in code
- [ ] No console.log with sensitive data
- [ ] Input validation on all endpoints
- [ ] Output encoding for user input
- [ ] CORS policy configured correctly
- [ ] Security headers configured
- [ ] Error messages don't leak sensitive info

### Security Headers

**Recommended Headers (vercel.json):**

```json
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
        },
        {
          "key": "Permissions-Policy",
          "value": "geolocation=(), microphone=(), camera=()"
        }
      ]
    }
  ]
}
```

**CSP (Content Security Policy):**

```json
{
  "key": "Content-Security-Policy",
  "value": "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://echecs.asso.fr;"
}
```

---

## Resources

### External Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [OWASP Cheat Sheet Series](https://cheatsheetseries.owasp.org/)
- [CWE (Common Weakness Enumeration)](https://cwe.mitre.org/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [React Security Best Practices](https://react.dev/reference/react-dom/server)

### Tools

- [npm audit](https://docs.npmjs.com/cli/v8/commands/npm-audit)
- [Snyk](https://snyk.io/)
- [OWASP ZAP](https://www.zaproxy.org/)
- [Security Headers](https://securityheaders.com/)
- [SSL Labs](https://www.ssllabs.com/ssltest/)

---

## Contact

**Security Issues:** security@haychess.club

**General Support:** support@haychess.club

**Maintainers:**
- Tech Lead: [Name] - techllead@haychess.club

---

**Last Updated:** 30 October 2025
**Next Review:** 30 January 2026 (Quarterly review)
**Maintained by:** Hay Chess Tracker Security Team
