    # GrowthPilot - API Keys Quick Reference

## 🔑 Required API Keys & Setup Links

Copy and paste each link into your browser to get started with each service.

### 1. **Database - Supabase** ⭐ REQUIRED
| Item | Link | Variable Name |
|------|------|---------------|
| Sign Up | https://supabase.com | - |
| Create Project | https://app.supabase.com/projects | - |
| Get Connection URL | Dashboard → Settings → Database → Connection String | `DATABASE_URL` |
| Get Direct URL | Dashboard → Settings → Database → Connection String | `DIRECT_URL` |

**Expected Values:**
```
DATABASE_URL=postgresql://postgres:PASSWORD@db.PROJECT_REF.supabase.co:6543/postgres?pgbouncer=true
DIRECT_URL=postgresql://postgres:PASSWORD@db.PROJECT_REF.supabase.co:5432/postgres
```

---

### 2. **AI Provider - OpenAI** ⭐ RECOMMENDED
| Item | Link | Variable Name |
|------|------|---------------|
| Sign Up | https://platform.openai.com/signup | - |
| Create API Key | https://platform.openai.com/api/keys | `OPENAI_API_KEY` |
| Pricing | https://openai.com/pricing | - |

**Expected Values:**
```
OPENAI_API_KEY=sk-...
OPENAI_BASE_URL=https://api.openai.com/v1
```

**Alternative AI Providers:**
- **Claude (Anthropic):** https://console.anthropic.com → API Keys → `ANTHROPIC_API_KEY=sk-ant-...`
- **Gemini (Google):** https://makersuite.google.com/app/apikey → `GEMINI_API_KEY=AIzaSy...`

---

### 3. **Payment - Razorpay** (India) ⭐ RECOMMENDED
| Item | Link | Variable Name |
|------|------|---------------|
| Sign Up | https://razorpay.com/signup | - |
| API Keys | https://dashboard.razorpay.com/#/app/keys | `RAZORPAY_KEY_ID` |
| Webhook Secret | https://dashboard.razorpay.com/#/app/webhooks | `RAZORPAY_WEBHOOK_SECRET` |

**Expected Values:**
```
RAZORPAY_KEY_ID=rzp_live_... (or rzp_test_...)
RAZORPAY_KEY_SECRET=...
RAZORPAY_WEBHOOK_SECRET=...
```

**Frontend (apps/web/.env):**
```
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_live_...
```

---

### 4. **Payment - Stripe** (Optional, International)
| Item | Link | Variable Name |
|------|------|---------------|
| Sign Up | https://stripe.com/start/checkout | - |
| Secret Key | https://dashboard.stripe.com/apikeys | `STRIPE_SECRET_KEY` |
| Webhook Secret | https://dashboard.stripe.com/webhooks | `STRIPE_WEBHOOK_SECRET` |

**Expected Values:**
```
STRIPE_SECRET_KEY=sk_live_... (or sk_test_...)
STRIPE_WEBHOOK_SECRET=whsec_...
```

**Frontend (apps/web/.env):**
```
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
```

---

### 5. **Email - Resend** ⭐ REQUIRED FOR PRODUCTION
| Item | Link | Variable Name |
|------|------|---------------|
| Sign Up | https://resend.com | - |
| API Keys | https://resend.com/api-keys | `RESEND_API_KEY` |

**Expected Values:**
```
RESEND_API_KEY=re_...
EMAIL_FROM=GrowthPilot <noreply@growthpilot.com>
```

---

### 6. **Cloud Storage - AWS S3**
| Item | Link | Variable Name |
|------|------|---------------|
| Sign Up | https://aws.amazon.com/free | - |
| Create IAM User | https://console.aws.amazon.com/iam/home#/users | - |
| Create Access Keys | IAM → Users → Your User → Security Credentials | `AWS_ACCESS_KEY_ID` |
| Create S3 Bucket | https://console.aws.amazon.com/s3/buckets | `AWS_BUCKET_NAME` |

**Expected Values:**
```
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=ap-south-1
AWS_BUCKET_NAME=growthpilot-storage
```

**Alternative: Cloudflare R2**
```
AWS_REGION=auto
AWS_BUCKET_NAME=your-bucket-name
```

---

### 7. **Redis & Queue - Upstash**
| Item | Link | Variable Name |
|------|------|---------------|
| Sign Up | https://upstash.com | - |
| Create Redis DB | https://console.upstash.com | - |
| Copy Redis URL | Database → Details → Redis URL (TLS) | `REDIS_URL` |

**Expected Values:**
```
REDIS_URL=rediss://default:PASSWORD@host:port
```

**Local Development Alternative:**
```
REDIS_URL=redis://localhost:6379
```

**Installation for Local:**
```bash
# Windows: Install Redis (Memurai)
# https://github.com/microsoftarchive/redis/releases

# macOS:
brew install redis
redis-server

# Linux:
sudo apt-get install redis-server
redis-server
```

---

### 8. **Authentication - Google OAuth** (Optional)
| Item | Link | Variable Name |
|------|------|---------------|
| Create Project | https://console.cloud.google.com | - |
| Enable OAuth | APIs & Services → OAuth consent screen | - |
| Create Credentials | APIs & Services → Credentials → OAuth 2.0 | - |

**Expected Values:**
```
GOOGLE_ID=your-client-id.apps.googleusercontent.com
GOOGLE_SECRET=your-client-secret
```

---

### 9. **Security Secrets - Generated**
Generate using:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

| Variable Name | Backend | Frontend |
|---------------|---------|----------|
| JWT_SECRET | ✅ `apps/api/.env` | - |
| NEXTAUTH_SECRET | - | ✅ `apps/web/.env` |

---

## 📋 Setup Checklist

### Phase 1: Create Accounts (30 minutes)
- [ ] Supabase
- [ ] OpenAI
- [ ] Razorpay
- [ ] Resend
- [ ] AWS (Free tier)
- [ ] Upstash

### Phase 2: Generate Credentials (20 minutes)
- [ ] Supabase: DATABASE_URL, DIRECT_URL
- [ ] OpenAI: API Key
- [ ] Razorpay: Key ID, Key Secret, Webhook Secret
- [ ] Resend: API Key
- [ ] AWS: Access Key ID, Secret, S3 Bucket
- [ ] Upstash: Redis URL
- [ ] Generated: JWT_SECRET, NEXTAUTH_SECRET

### Phase 3: Configure Environment Files (10 minutes)
- [ ] Copy `.env.example` → `.env` in both `apps/api` and `apps/web`
- [ ] Fill in all credentials from Phase 2
- [ ] Verify no credentials are committed to Git

### Phase 4: Database Setup (5 minutes)
```bash
cd packages/database
npm run generate
npm run push
```

### Phase 5: Run Application (5 minutes)
```bash
# From project root
npm install
npm run dev
```

---

## 🔐 Environment Files Reference

### `apps/api/.env`
```env
# Server
PORT=3001
NODE_ENV=development

# Database
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."

# Security
JWT_SECRET="[64-char-hex-secret]"
FRONTEND_URL="http://localhost:3000"

# AI
OPENAI_API_KEY="sk-..."
OPENAI_BASE_URL="https://api.openai.com/v1"

# Billing
RAZORPAY_KEY_ID="rzp_test_..."
RAZORPAY_KEY_SECRET="..."
RAZORPAY_WEBHOOK_SECRET="..."
# STRIPE_SECRET_KEY="sk_test_..."
# STRIPE_WEBHOOK_SECRET="whsec_..."

# Email
RESEND_API_KEY="re_..."
EMAIL_FROM="GrowthPilot <noreply@growthpilot.com>"

# Storage
AWS_ACCESS_KEY_ID="AKIA..."
AWS_SECRET_ACCESS_KEY="..."
AWS_REGION="ap-south-1"
AWS_BUCKET_NAME="growthpilot-storage"

# Redis
REDIS_URL="redis://localhost:6379"
```

### `apps/web/.env`
```env
# Server
PORT=3000
NODE_ENV=development

# Backend URL (optional - leave empty for localhost)
# BACKEND_URL="http://api:3001"
NEXT_PUBLIC_API_URL="/api"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="[64-char-hex-secret]"

# OAuth (optional)
# GOOGLE_ID="..."
# GOOGLE_SECRET="..."

# Public Keys (visible in frontend)
NEXT_PUBLIC_RAZORPAY_KEY_ID="rzp_test_..."
# NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."

# Analytics (optional)
# NEXT_PUBLIC_GA_ID="G-..."
```

---

## 🚀 Quick Start Commands

```bash
# 1. Install dependencies
npm install

# 2. Generate Prisma Client
cd packages/database && npm run generate && cd ../..

# 3. Push database schema
cd packages/database && npm run push && cd ../..

# 4. Start development server
npm run dev
```

Then visit:
- Frontend: http://localhost:3000
- Backend: http://localhost:3001

---

## 💡 Pro Tips

### Using Test Keys During Development
- **Razorpay:** Use `rzp_test_...` keys during development
- **Stripe:** Use `sk_test_...` keys during development
- **Supabase:** Create separate projects for dev/staging/prod

### Local Redis Setup
```bash
# Start Redis server in a separate terminal
redis-server

# In another terminal, check connection
redis-cli ping
# Should return: PONG
```

### Debugging Environment Variables
```bash
# Check if .env is loaded correctly
node -e "require('dotenv').config(); console.log(process.env.DATABASE_URL)"
```

### Database Reset (⚠️ Deletes all data)
```bash
cd packages/database
npx prisma migrate reset
# or
npm run push  # Just re-applies schema
```

---

## 🆘 Support Links

- **NestJS Issues:** https://github.com/nestjs/nest/issues
- **Next.js Issues:** https://github.com/vercel/next.js/issues
- **Prisma Issues:** https://github.com/prisma/prisma/issues
- **Turbo Issues:** https://github.com/vercel/turbo/issues

---

**Last Updated:** 2024
**Project:** GrowthPilot v1.0.0
