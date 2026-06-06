# GrowthPilot - Quick Start & Troubleshooting

## ⚡ Super Quick Start (5 minutes)

If you already have all the API keys ready:

```bash
# 1. Install dependencies
npm install

# 2. Create .env files
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env

# 3. Edit the .env files with your API keys (see API_KEYS_REFERENCE.md)

# 4. Setup database
cd packages/database
npm run generate
npm run push
cd ../..

# 5. Start development
npm run dev
```

Visit:
- **Web:** http://localhost:3000
- **API:** http://localhost:3001

---

## 🐛 Common Issues & Solutions

### ❌ `Port 3000 already in use`

**Problem:** Another process is using port 3000

**Solution:**

**Windows:**
```powershell
# Find process using port 3000
netstat -ano | findstr :3000

# Kill it (replace PID with number from above)
taskkill /PID [PID] /F

# Or use different port
set PORT=3002
npm run dev
```

**macOS/Linux:**
```bash
# Find and kill process
lsof -i :3000 | grep LISTEN | awk '{print $2}' | xargs kill -9

# Or use different port
export PORT=3002
npm run dev
```

---

### ❌ `DATABASE_URL not found` or Connection Error

**Problem:** Database environment variable not set or wrong connection string

**Solution:**

1. **Check .env file exists:**
   ```bash
   ls apps/api/.env  # macOS/Linux
   dir apps\api\.env  # Windows
   ```

2. **Verify content:**
   ```bash
   # Check if DATABASE_URL is set
   grep DATABASE_URL apps/api/.env
   ```

3. **Test connection:**
   ```bash
   # Windows
   node -e "require('dotenv').config({path:'apps/api/.env'}); console.log('DB:', process.env.DATABASE_URL)"
   
   # macOS/Linux
   node -e "require('dotenv').config({path:'apps/api/.env'}); console.log('DB:', process.env.DATABASE_URL)"
   ```

4. **Verify Supabase URL format:**
   - Should contain: `postgresql://`, `@db.`, `.supabase.co:5432`
   - Password must be URL-encoded if it contains special characters
   - Use `%40` for `@`, `%3A` for `:`, etc.

---

### ❌ `OPENAI_API_KEY is missing`

**Problem:** OpenAI key not configured (This is a WARNING, not an error)

**Solution:** This is normal. The app will:
- Use mock AI responses if key is missing
- Work with real OpenAI if key is provided
- Add `OPENAI_API_KEY="sk-..."` to `apps/api/.env` to enable

---

### ❌ `npm ERR! code ERESOLVE` or dependency conflicts

**Problem:** npm can't resolve conflicting dependencies

**Solution:**

```bash
# Clear npm cache
npm cache clean --force

# Remove lock files and modules
rm -r node_modules package-lock.json

# Reinstall with legacy peer deps (if needed)
npm install --legacy-peer-deps

# If still issues, use exact versions
npm ci --legacy-peer-deps
```

---

### ❌ `Prisma generation failed`

**Problem:** Prisma client couldn't generate

**Solution:**

```bash
cd packages/database

# Force regenerate
npx prisma generate --force

# Or reset everything
npx prisma migrate reset

cd ../..
```

---

### ❌ `Can't connect to Redis`

**Problem:** Redis server not running

**Solution:**

**Check if Redis is running:**
```bash
# Test connection
redis-cli ping
# Should return: PONG
```

**Install Redis:**

**Windows (Memurai):**
```powershell
# Download from: https://github.com/microsoftarchive/redis/releases
# Or use WSL2
```

**macOS:**
```bash
brew install redis
brew services start redis
```

**Linux:**
```bash
sudo apt-get install redis-server
sudo systemctl start redis-server
```

**For development, use Upstash instead:**
```env
# In apps/api/.env
REDIS_URL="rediss://default:password@host:port"
```

---

### ❌ `Module not found` or TypeScript errors

**Problem:** Missing dependencies or build issues

**Solution:**

```bash
# Clean and reinstall
rm -rf node_modules
npm install

# Rebuild Turbo cache
npx turbo build

# Check TypeScript
npx tsc --noEmit
```

---

### ❌ `CORS error` in browser console

**Problem:** Frontend can't connect to API

**Solution:**

1. **Verify API is running:**
   ```bash
   curl http://localhost:3001/health
   # Or visit in browser: http://localhost:3001/health
   ```

2. **Check FRONTEND_URL in .env:**
   ```env
   # apps/api/.env
   FRONTEND_URL="http://localhost:3000"
   ```

3. **Verify NEXT_PUBLIC_API_URL:**
   ```env
   # apps/web/.env
   NEXT_PUBLIC_API_URL="/api"
   ```

4. **For production, use full URL:**
   ```env
   # apps/web - Production
   NEXT_PUBLIC_API_URL="https://api.yourdomain.com"
   ```

---

### ❌ `Prisma db push` error

**Problem:** Supabase schema push failed

**Solution:**

```bash
cd packages/database

# View pending migrations
npx prisma migrate status

# View what will change
npx prisma migrate diff --from-empty --to-schema-datamodel

# If conflicts, reset dev database (⚠️ deletes data)
npx prisma migrate reset

# Or just apply schema
npx prisma db push
```

---

### ❌ `.env` not being loaded

**Problem:** Environment variables not accessible

**Solution:**

1. **Verify file path:**
   ```bash
   # Should be at these exact paths:
   # - apps/api/.env
   # - apps/web/.env
   
   # NOT at:
   # - .env (root)
   # - .env.local
   ```

2. **Check file wasn't accidentally ignored:**
   ```bash
   git check-ignore -v apps/api/.env
   # Should return nothing (means file is tracked)
   ```

3. **Ensure no BOM encoding:**
   - Open in VS Code
   - Bottom right → Select Encoding
   - Choose "UTF-8" (not UTF-8 with BOM)

4. **Restart dev server:**
   ```bash
   # Stop with Ctrl+C
   # Then restart
   npm run dev
   ```

---

### ❌ `Turbo build failed`

**Problem:** Monorepo build error

**Solution:**

```bash
# Show which app failed
npm run build -- --verbose

# Build specific app
cd apps/api && npm run build

# Clear Turbo cache
npx turbo prune --docker
rm -rf .turbo node_modules

# Rebuild
npm install
npm run build
```

---

### ❌ Memory/Performance Issues

**Problem:** App running slow or out of memory

**Solution:**

```bash
# Increase Node memory limit
node --max-old-space-size=4096 node_modules/.bin/turbo dev

# Or in package.json
"dev": "NODE_OPTIONS=--max-old-space-size=4096 turbo run dev"
```

---

## 📊 Verification Checklist

Run this to verify everything is set up:

```bash
# Test 1: Node version
node --version  # Should be v18+

# Test 2: npm version
npm --version   # Should be v10+

# Test 3: Dependencies installed
npm list --depth=0

# Test 4: TypeScript check
npx tsc --noEmit -p apps/api

# Test 5: Database connection
node -e "require('dotenv').config({path:'apps/api/.env'}); console.log('DB:', process.env.DATABASE_URL ? '✅ Set' : '❌ Missing')"

# Test 6: OpenAI key
node -e "require('dotenv').config({path:'apps/api/.env'}); console.log('OpenAI:', process.env.OPENAI_API_KEY ? '✅ Set' : '⚠️ Missing (optional)')"

# Test 7: Redis connection
redis-cli ping  # Should return: PONG
```

---

## 🔍 Debug Mode

### Enable Verbose Logging

```bash
# API verbose logging
NODE_DEBUG=* npm run dev

# Prisma debug
DEBUG=prisma:* npm run dev

# Next.js debug
NODE_OPTIONS='--inspect' npm run dev
```

### Check Application Health

```bash
# Backend health check
curl http://localhost:3001/health

# Frontend status
curl http://localhost:3000

# Check API logs
npm run dev 2>&1 | grep -i error
```

---

## 🚀 Performance Optimization

### For Development

```bash
# Only rebuild on changes (not full rebuild)
npm run dev
```

### For Production Build

```bash
# Build all apps
npm run build

# Output size analysis
npm run build -- --summarize

# Check what was built
ls -la apps/api/dist
ls -la apps/web/.next
```

---

## 📝 Useful Commands Reference

| Task | Command |
|------|---------|
| Install all deps | `npm install` |
| Start dev server | `npm run dev` |
| Build for production | `npm run build` |
| Run tests | `npm run test` |
| Run linter | `npm run lint` |
| Fix linting errors | `npm run lint -- --fix` |
| Format code | `npm run format` |
| Database schema push | `cd packages/database && npm run push` |
| Generate Prisma client | `cd packages/database && npm run generate` |
| Reset database | `cd packages/database && npx prisma migrate reset` |
| Check Turbo cache | `npx turbo cache status` |
| Clean Turbo cache | `npx turbo prune --docker` |

---

## 🎓 Learning Resources

- **Project Structure:** https://turbo.build/repo/docs/core-concepts/monorepos/structuring-a-repository
- **Debugging NestJS:** https://docs.nestjs.com/fundamentals/testing
- **Debugging Next.js:** https://nextjs.org/docs/pages/building-your-application/optimizing/debugging
- **Prisma Debugging:** https://www.prisma.io/docs/concepts/more/debugging

---

## 💬 Still Stuck?

1. **Check logs carefully** - First error message is usually the real issue
2. **Google the error** - Most common issues have StackOverflow answers
3. **Check GitHub Issues:**
   - NestJS: https://github.com/nestjs/nest/issues
   - Next.js: https://github.com/vercel/next.js/issues
   - Prisma: https://github.com/prisma/prisma/issues
4. **Create an issue** in your repository with:
   - Exact error message
   - Steps to reproduce
   - Environment info (node version, OS, etc.)
   - `.env` file (with credentials removed)

---

**Happy coding! 🎉**
