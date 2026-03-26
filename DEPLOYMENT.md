# RegIntel — Deployment Guide

## Quick Start (Railway)

### 1. Push to GitHub
```bash
git add -A
git commit -m "Production build: auth, trial, payments, Dark Street branding"
git push origin main
```

### 2. Create Railway Project
- Go to https://railway.app
- New Project → Deploy from GitHub Repo → select `motorkaput/regintel`
- Railway will auto-detect the Dockerfile

### 3. Provision PostgreSQL
- In the Railway project, click "Add Service" → "Database" → PostgreSQL
- Copy the `DATABASE_URL` from the Postgres service

### 4. Set Environment Variables
On the RegIntel service in Railway, add:

| Variable | Value |
|---|---|
| `DATABASE_URL` | *(from Railway Postgres)* |
| `ADMIN_EMAIL` | `david@darkstreet.org` |
| `ADMIN_PASSWORD` | *(your secure password)* |
| `JWT_SECRET` | *(32+ char random string)* |
| `SESSION_SECRET` | *(random string)* |
| `OPENAI_API_KEY` | *(your OpenAI key)* |
| `ANTHROPIC_API_KEY` | *(your Anthropic key)* |
| `GOOGLE_CLIENT_ID` | *(your Google OAuth client ID)* |
| `GOOGLE_CLIENT_SECRET` | *(your Google OAuth secret)* |
| `OAUTH_REDIRECT_BASE` | `https://regintel.darkstreet.tech` |
| `RAZORPAY_KEY_ID` | *(your Razorpay key)* |
| `RAZORPAY_KEY_SECRET` | *(your Razorpay secret)* |
| `RESEND_API_KEY` | *(your Resend API key)* |
| `PORT` | `8080` |
| `NODE_ENV` | `production` |

### 5. Run Database Migration
After first deploy, run in Railway shell:
```bash
npx drizzle-kit push
```

### 6. Configure Custom Domain
- In Railway service settings → Networking → Custom Domain
- Add `regintel.darkstreet.tech`
- Configure DNS: CNAME record pointing to Railway's domain

### 7. Google OAuth Setup
In Google Cloud Console → APIs & Services → Credentials:
- Add authorized redirect URI: `https://regintel.darkstreet.tech/api/auth/google/callback`
- Add authorized JavaScript origin: `https://regintel.darkstreet.tech`

### 8. Resend Domain Verification
In Resend dashboard, verify `darkstreet.org` domain for sending emails from `hello@darkstreet.org`.

---

## Architecture

```
Client (React/Vite)          Server (Express/Node)
├── Landing Page              ├── Auth (email, Google, JWT)
├── Login/Register            ├── Trial/Paywall middleware
├── Document Library          ├── RegTech routes (4800+ lines)
├── AI Console                ├── Razorpay payments
├── Query AI                  ├── Resend emails
├── Document Diff             ├── OpenAI (GPT-4, embeddings)
├── Obligations Analysis      ├── Document processing
├── Alerts                    ├── Vector search (pgvector)
├── Sessions                  └── Admin panel
├── Pricing (Razorpay)
└── Admin Panel
```

## Key URLs
- Landing/Login: `/`
- App: `/regtech/documents`, `/regtech/console`, etc.
- Admin: `/regtech/admin`
- Pricing: `/regtech/pricing`
- Health check: `/api/health`

## Pricing
- **Free Trial**: 14 days, all features, no credit card
- **Professional**: $199/month or $1,990/year
- **Institutional**: Custom pricing → hello@darkstreet.org
