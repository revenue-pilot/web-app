# GrowthPilot - Complete Setup & Deployment Guide

**GrowthPilot** is a SaaS platform for managing advertising campaigns across multiple channels with AI-powered insights. This monorepo contains a NestJS backend API and Next.js frontend web application.

## 📋 Table of Contents
1. [Project Overview](#project-overview)
2. [Prerequisites](#prerequisites)
3. [Local Development Setup](#local-development-setup)
4. [API Keys & External Services Setup](#api-keys--external-services-setup)
5. [Database Setup](#database-setup)
6. [Running the Application](#running-the-application)
7. [Testing](#testing)
8. [Production Deployment](#production-deployment)

---

## 🎯 Project Overview

**Tech Stack:**
- **Frontend:** Next.js 15 + React 18 + TailwindCSS + NextAuth
- **Backend:** NestJS 10 + TypeScript
- **Database:** PostgreSQL (Supabase)
- **ORM:** Prisma
- **Queue System:** BullMQ + Redis (Upstash/Railway)
- **Storage:** AWS S3 or Cloudflare R2
- **Monorepo:** Turbo
- **Package Manager:** npm 10.5.0+

**Key Features:**
- Multi-channel ad campaign management (Google Ads, Meta Ads)
- AI-powered campaign optimization (OpenAI, Anthropic, Google Gemini)
- Billing integration (Razorpay for India, Stripe for international)
- Email notifications (Resend)
- White-label SaaS capabilities
- Activity & Audit logging

---

## 📦 Prerequisites

### System Requirements
- **Node.js:** v18+ (v20 recommended)
- **npm:** v10.5.0+
- **Git:** Latest version
- **Operating System:** Windows, macOS, or Linux

### Install Node.js & npm
```bash
# Download from https://nodejs.org/
# Choose LTS version (v20+)

# Verify installation
node --version  # Should show v18+
npm --version   # Should show v10.5.0+
```

---

## 🛠️ Local Development Setup

### Step 1: Clone & Install Dependencies

```bash
# Navigate to project directory
cd d:\revenuepilot-main

# Install all dependencies (including monorepo packages)
npm install

# Verify Turbo installation
npx turbo --version
```

### Step 2: Create Environment Files

**For API Backend** (`apps/api/.env`):
```bash
# Copy template
cp apps/api/.env.example apps/api/.env
```

**For Web Frontend** (`apps/web/.env`):
```bash
# Copy template
cp apps/web/.env.example apps/web/.env
```

**For Database Package** (`packages/database/.env`):
```bash
# Copy template  
cp packages/database/.env.example packages/database/.env
```

### Step 3: Generate Secrets

Generate secure JWT and NextAuth secrets:

```bash
# Generate a 64-character hex secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Save this output for later use in environment files.

---

## 🔑 API Keys & External Services Setup

### 1. **Database - Supabase PostgreSQL** (Required)

Supabase is a PostgreSQL database hosting service with built-in auth and storage.

**Steps:**
1. Go to [supabase.com](https://supabase.com) → Sign up
2. Create a new project:
   - **Project name:** growthpilot-local
   - **Database password:** Generate a strong password (save it!)
   - **Region:** Choose closest to you
3. Wait for deployment (2-3 minutes)
4. Go to **Settings → Database → Connection Pooling**
   - Copy the **"Connection string (Pooler)" URL**
5. Also get the direct URL from **Connection string** tab

**Add to `apps/api/.env`:**
```env
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:6543/postgres?pgbouncer=true&sslmode=require"
DIRECT_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres"
```

---

### 2. **AI Provider - OpenAI** (Recommended)

Required for AI-powered campaign insights.

**Steps:**
1. Go to [platform.openai.com](https://platform.openai.com)
2. Sign up or log in
3. Go to **API Keys** → **Create new secret key**
4. Copy the key (starts with `sk-`)

**Add to `apps/api/.env`:**
```env
OPENAI_API_KEY="sk-..."
OPENAI_BASE_URL="https://api.openai.com/v1"
```

**Alternative AI Providers (Optional):**

**Anthropic Claude:**
1. Go to [console.anthropic.com](https://console.anthropic.com)
2. Create account → **API Keys** → Create new
3. Add to `.env`: `ANTHROPIC_API_KEY="sk-ant-..."`

**Google Gemini:**
1. Go to [makersuite.google.com/app/apikey](https://makersuite.google.com/app/apikey)
2. Create new API key
3. Add to `.env`: `GEMINI_API_KEY="AIzaSy..."`

---

### 3. **Payment Gateway - Razorpay** (For Indian Users)

Razorpay handles payment processing for the Indian market.

**Steps:**
1. Go to [razorpay.com](https://razorpay.com) → Sign up
2. Verify email and KYC (business verification)
3. Go to **Settings → API Keys**
4. Copy **Key ID** and **Key Secret**
5. Generate **Webhook Secret** in **Webhooks** section

**Add to `apps/api/.env`:**
```env
RAZORPAY_KEY_ID="rzp_live_..."
RAZORPAY_KEY_SECRET="..."
RAZORPAY_WEBHOOK_SECRET="..."
```

**Add to `apps/web/.env`:**
```env
NEXT_PUBLIC_RAZORPAY_KEY_ID="rzp_live_..."
```

---

### 4. **Payment Gateway - Stripe** (Optional, International)

For worldwide payment processing.

**Steps:**
1. Go to [stripe.com](https://stripe.com) → Sign up
2. Go to **Developers → API Keys**
3. Copy **Secret Key** (starts with `sk_live_` or `sk_test_`)
4. Go to **Webhooks** → Add endpoint
   - Endpoint URL: `https://your-api-domain.com/webhooks/stripe`
   - Events: `payment_intent.succeeded`, `payment_intent.payment_failed`
5. Copy webhook signing secret (`whsec_...`)

**Add to `apps/api/.env`:**
```env
STRIPE_SECRET_KEY="sk_live_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
```

**Add to `apps/web/.env`:**
```env
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_live_..."
```

---

### 5. **Email Service - Resend** (Required for Production)

Resend sends transactional emails.

**Steps:**
1. Go to [resend.com](https://resend.com) → Sign up
2. Go to **API Keys** → Create new
3. Copy the API key

**Add to `apps/api/.env`:**
```env
RESEND_API_KEY="re_..."
EMAIL_FROM="GrowthPilot <noreply@growthpilot.com>"
```

---

### 6. **Cloud Storage - AWS S3**

For storing campaign assets, reports, and media files.

**Steps:**
1. Go to [aws.amazon.com](https://aws.amazon.com) → Sign up (Free tier available)
2. Go to **IAM** → **Users** → Create new user
   - **Username:** growthpilot-app
   - Attach policy: `AmazonS3FullAccess`
3. Go to **Security credentials** → **Create access key**
4. Copy **Access Key ID** and **Secret Access Key**
5. Create S3 bucket:
   - Go to **S3** → **Create bucket**
   - Name: `growthpilot-storage`
   - Region: Same as your DB
   - Block public access: Keep enabled

**Add to `apps/api/.env`:**
```env
AWS_ACCESS_KEY_ID="AKIA..."
AWS_SECRET_ACCESS_KEY="..."
AWS_REGION="ap-south-1"
AWS_BUCKET_NAME="growthpilot-storage"
```

**Alternative: Cloudflare R2**
```env
AWS_ACCESS_KEY_ID="your-access-key"
AWS_SECRET_ACCESS_KEY="your-secret-key"
AWS_REGION="auto"
AWS_BUCKET_NAME="growthpilot"
```

---

### 7. **Redis Cache & Queue - Upstash**

For BullMQ job queue processing.

**Steps:**
1. Go to [upstash.com](https://upstash.com) → Sign up
2. Create new Redis database:
   - Type: **Redis**
   - Region: Closest to your location
   - Data eviction: **No eviction** (for production)
3. Go to **Details** → Copy **Redis URL** (starts with `rediss://`)

**Add to `apps/api/.env`:**
```env
REDIS_URL="rediss://default:password@host:port"
```

**Alternative: Railway Redis**
```bash
# If using Railway for deployment
REDIS_URL="redis://redis:6379"
```

---

### 8. **Ad Platform Integrations** (Optional but Recommended)

#### Google Ads Integration

1. Go to [Google Ads API Console](https://console.developers.google.com)
2. Enable **Google Ads API**
3. Create OAuth 2.0 credentials:
   - Type: **Desktop application**
   - Download JSON file
4. Use client ID, client secret, and refresh token in app

#### Meta Ads Integration

1. Go to [Facebook Developers](https://developers.facebook.com)
2. Create app → **Business Type**
3. Add **Marketing API** product
4. Create system user and generate access token
5. Get ad account ID from Meta Ads Manager

---

### 9. **Authentication - NextAuth** (Required)

For user sign-in.

**Steps:**
1. Generate secret (already done above)

**Add to `apps/web/.env`:**
```env
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="[generated-secret-above]"
```

**Optional: Google OAuth**
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create project → **APIs & Services → OAuth consent screen**
3. Create OAuth 2.0 credentials (Web application)
4. Copy **Client ID** and **Client Secret**

**Add to `apps/web/.env`:**
```env
GOOGLE_ID="your-client-id.apps.googleusercontent.com"
GOOGLE_SECRET="your-client-secret"
```

---

## 🗄️ Database Setup

### Step 1: Push Prisma Schema

```bash
# From project root
cd packages/database

# Generate Prisma client
npm run generate

# Push schema to Supabase (creates tables)
npm run push
```

**You'll see a prompt:**
```
? We detected a config pointing to a pre-defined URL in env var DATABASE_URL.
? We detected an environment variable. Let us examine the used database connection string and compare it to the configuration in your schema.prisma file.
? Do you want to continue? (Y/n) › Y
```

Press `Y` to continue.

### Step 2: Verify Database Tables

```bash
# Check if migrations applied
npx prisma db execute --stdin < path-to-migration
```

---

## 🚀 Running the Application

### Option 1: Monorepo Development (Recommended)

Run all services with automatic rebuilding:

```bash
# From project root (d:\revenuepilot-main)
npm run dev
```

This starts:
- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:3001

### Option 2: Run Services Individually

**Terminal 1 - API Backend:**
```bash
cd apps/api
npm run dev
# API runs on http://localhost:3001
```

**Terminal 2 - Web Frontend:**
```bash
cd apps/web
npm run dev
# Web runs on http://localhost:3000
```

### Step 3: Verify Application

1. Open browser → http://localhost:3000
2. You should see the GrowthPilot login page
3. Check API health: http://localhost:3001/health

---

## ✅ Testing

### Run Unit Tests

```bash
# All tests
npm run test

# Specific app
cd apps/api
npm run test

# With coverage
npm run test:cov
```

### Run Linter

```bash
# Lint all code
npm run lint

# Fix issues automatically
npm run lint -- --fix
```

---

## 🌍 Production Deployment

### Option 1: **Railway** (Recommended - 1-Click Deploy)

Railway is a PaaS platform perfect for Turbo monorepos.

**Steps:**
1. Connect GitHub repo to [Railway.app](https://railway.app)
2. Select this repository
3. Create two services:
   - **Service 1: API**
     - Root directory: `apps/api`
     - Start command: `npm run start:prod`
     - Port: 3001
   - **Service 2: Web**
     - Root directory: `apps/web`
     - Start command: `npm run start`
     - Port: 3000
4. Add environment variables to each service (from `.env` files)
5. Add Redis plugin for BullMQ
6. Add PostgreSQL plugin OR connect to Supabase

### Option 2: **Docker + Docker Compose**

```bash
# Build images
docker-compose build

# Start services
docker-compose up -d

# View logs
docker-compose logs -f
```

### Option 3: **Vercel + Heroku** (Separate Deployments)

**Frontend (Vercel):**
```bash
# Deploy to Vercel
npm install -g vercel
vercel deploy apps/web
```

**Backend (Heroku):**
```bash
# Deploy to Heroku
heroku login
heroku create growthpilot-api
git push heroku main
```

---

## 📊 Environment Checklist

### For Local Development

- [ ] Node.js v18+ installed
- [ ] npm v10.5.0+ installed
- [ ] `npm install` completed
- [ ] `.env` files created in `apps/api` and `apps/web`
- [ ] Database URL set (Supabase)
- [ ] OpenAI API key set
- [ ] JWT_SECRET generated and added
- [ ] NEXTAUTH_SECRET generated and added
- [ ] Redis URL set (for local: `redis://localhost:6379`)

### For Production

- [ ] All local checklist items
- [ ] Razorpay keys configured
- [ ] Stripe keys configured (if using)
- [ ] Resend email service configured
- [ ] AWS S3 bucket and credentials
- [ ] Custom domain configured
- [ ] SSL certificates (auto via Railway)
- [ ] GitHub Actions CI/CD setup
- [ ] Database backups configured
- [ ] Monitoring/logging setup (Sentry, etc.)

---

## 🆘 Common Issues

### Issue: "DATABASE_URL not found"
**Solution:** Ensure `.env` file exists and contains correct `DATABASE_URL`

### Issue: "OPENAI_API_KEY is missing"
**Solution:** This is a warning. The app will use mock responses if no AI key is set.

### Issue: Port 3000/3001 already in use
**Solution:**
```bash
# Windows: Kill process on port 3001
netstat -ano | findstr :3001
taskkill /PID [PID] /F

# macOS/Linux: Kill process on port 3001
lsof -i :3001 | grep LISTEN | awk '{print $2}' | xargs kill -9
```

### Issue: Prisma migration conflicts
**Solution:**
```bash
# Reset database (⚠️ deletes all data)
npx prisma migrate reset

# Or push latest schema
npx prisma db push
```

---

## 📚 Additional Resources

- **NestJS Docs:** https://docs.nestjs.com
- **Next.js Docs:** https://nextjs.org/docs
- **Prisma Docs:** https://www.prisma.io/docs
- **Supabase Docs:** https://supabase.com/docs
- **Turbo Docs:** https://turbo.build/repo/docs

---

## 🎉 Success!

Once everything is set up, you can:
- Create user accounts
- Connect ad platforms (Google Ads, Meta)
- Create and manage campaigns
- Get AI-powered campaign recommendations
- Process payments
- View analytics and reports

**Happy building! 🚀**
