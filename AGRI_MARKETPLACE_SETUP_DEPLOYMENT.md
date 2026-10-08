# Krishi Market - Setup and Deployment Guide

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Local Development Setup](#local-development-setup)
3. [Database Setup](#database-setup)
4. [Environment Configuration](#environment-configuration)
5. [Running the Application](#running-the-application)
6. [Deployment](#deployment)
7. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Software Requirements

- **Node.js**: Version 18 or higher
- **npm**: Version 9 or higher
- **Git**: Version 2.0 or higher
- **PostgreSQL**: Version 13 or higher (or use Supabase)
- **Code Editor**: VS Code or equivalent

### Hardware Requirements

- **Processor**: Intel i5 or equivalent (minimum)
- **RAM**: 8 GB (minimum), 16 GB (recommended)
- **Storage**: 20 GB free space
- **Network**: Stable internet connection

---

## Local Development Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd calm-archimedes
```

### 2. Install Frontend Dependencies

```bash
npm install
```

This will install the following dependencies:
- next: 16.3.5
- react: 19.2.8
- react-dom: 19.2.8
- typescript: 5
- tailwindcss: 4
- lucide-react: 1.47.0
- recharts: 3.10.1
- qrcode: 1.5.4
- clsx: 2.1.1
- tailwind-merge: 3.7.0

### 3. Install Backend Dependencies

```bash
cd backend
npm install
```

This will install the following dependencies:
- express: 5.2.1
- typescript: 7.0.2
- @prisma/client: 6.19.3
- prisma: 6.19.3
- bcrypt: 6.0.0
- jsonwebtoken: 9.0.3
- cors: 2.8.6
- dotenv: 18.0.3
- qrcode: 1.5.4

### 4. Return to Project Root

```bash
cd ..
```

---

## Database Setup

### Option 1: Using Supabase (Recommended)

#### 1. Create Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign up for a free account
3. Create a new project
4. Wait for the database to be provisioned

#### 2. Get Database Credentials

From your Supabase project dashboard:
1. Go to Settings → Database
2. Copy the following:
   - Host: `aws-0-ap-northeast-1.pooler.supabase.com` (or your region)
   - Port: `6543` (PgBouncer Session Pooler)
   - Database name: `postgres`
   - Username: `postgres`
   - Password: Your database password

#### 3. Configure Connection Pooling

Supabase provides three connection modes:
- **Direct (port 5432)**: Direct connection to PostgreSQL, no pooling
- **Session Pooler (port 6543)**: One connection per client, reused for the session
- **Transaction Pooler (port 6543)**: Connections borrowed only for transactions

**Recommended**: Use Session Pooler (port 6543) for web applications.

#### 4. Set Environment Variables

Create `backend/.env` file:

```env
DATABASE_URL="postgresql://postgres:password@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres:password@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres"
JWT_SECRET="your-secret-key-here"
PORT=5000
NODE_ENV=development
```

Replace:
- `password` with your Supabase database password
- `your-secret-key-here` with a strong random string for JWT signing

#### 5. Run Prisma Migrations

```bash
cd backend
npx prisma migrate dev --name init
```

This will:
- Create the database schema
- Apply all migrations
- Generate the Prisma client

#### 6. Generate Prisma Client

```bash
npx prisma generate
```

#### 7. Seed Database (Optional)

If you have seed data:

```bash
npx prisma db seed
```

---

### Option 2: Using Local PostgreSQL

#### 1. Install PostgreSQL

**Windows**:
- Download from [https://www.postgresql.org/download/windows/](https://www.postgresql.org/download/windows/)
- Run the installer
- Set a password for the postgres user

**macOS**:
```bash
brew install postgresql
brew services start postgresql
```

**Linux (Ubuntu)**:
```bash
sudo apt-get update
sudo apt-get install postgresql postgresql-contrib
sudo service postgresql start
```

#### 2. Create Database

```bash
psql -U postgres
CREATE DATABASE krishi_market;
\q
```

#### 3. Set Environment Variables

Create `backend/.env` file:

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/krishi_market"
DIRECT_URL="postgresql://postgres:password@localhost:5432/krishi_market"
JWT_SECRET="your-secret-key-here"
PORT=5000
NODE_ENV=development
```

Replace:
- `password` with your PostgreSQL password
- `your-secret-key-here` with a strong random string

#### 4. Run Prisma Migrations

```bash
cd backend
npx prisma migrate dev --name init
```

#### 5. Generate Prisma Client

```bash
npx prisma generate
```

---

## Environment Configuration

### Frontend Environment Variables

Create `src/.env.local` file:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

### Backend Environment Variables

Create `backend/.env` file:

```env
DATABASE_URL="postgresql://user:password@host:6543/database?pgbouncer=true"
DIRECT_URL="postgresql://user:password@host:5432/database"
JWT_SECRET="your-secret-key-here"
PORT=5000
NODE_ENV=development
```

### Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| NEXT_PUBLIC_API_URL | Backend API URL | http://localhost:5000 |
| DATABASE_URL | Database connection URL (with pooling) | postgresql://...:6543/db?pgbouncer=true |
| DIRECT_URL | Direct database connection URL (for migrations) | postgresql://...:5432/db |
| JWT_SECRET | Secret key for JWT token signing | random-secret-string |
| PORT | Backend server port | 5000 |
| NODE_ENV | Environment mode | development / production |

---

## Running the Application

### 1. Start Backend Server

```bash
cd backend
npm run dev
```

The backend will start on `http://localhost:5000`

You should see:
```
[Krishi Market Backend] Server listening on port 5000 in development mode
[Krishi Market Backend] Health check available at http://localhost:5000/api/health
```

### 2. Start Frontend Server

Open a new terminal:

```bash
npm run dev
```

The frontend will start on `http://localhost:3000`

You should see:
```
▲ Next.js 16.3.5
- Local: http://localhost:3000
- Network: http://192.168.x.x:3000
```

### 3. Verify Backend Health

```bash
curl http://localhost:5000/api/health
```

Expected response:
```json
{
  "status": "ok",
  "service": "Krishi Market Backend API",
  "timestamp": "2026-10-06T00:00:00.000Z"
}
```

### 4. Access the Application

Open your browser and navigate to:
- **Frontend**: http://localhost:3000
- **Admin Login**: http://localhost:3000/admin/login
- **Farmer Signup**: http://localhost:3000/farmer/signup

### Default Credentials

**Admin**:
- Email: `admin@krishimarket.in`
- Password: `admin123`

**Consumer (Demo)**:
- Email: `consumer@krishimarket.in`
- Password: `consumer123`

---

## Deployment

### Frontend Deployment (Vercel)

#### 1. Install Vercel CLI

```bash
npm install -g vercel
```

#### 2. Login to Vercel

```bash
vercel login
```

#### 3. Deploy Frontend

```bash
vercel
```

Follow the prompts:
- Set project name
- Set root directory to `.`
- Set build command to `npm run build`
- Set output directory to `.next`
- Set environment variable `NEXT_PUBLIC_API_URL` to your backend URL

#### 4. Configure Environment Variables

In Vercel dashboard:
1. Go to Settings → Environment Variables
2. Add `NEXT_PUBLIC_API_URL` with your backend URL

---

### Backend Deployment (Render)

#### 1. Create Render Account

Go to [https://render.com](https://render.com) and sign up.

#### 2. Create New Web Service

1. Click "New +"
2. Select "Web Service"
3. Connect your GitHub repository
4. Configure build settings:
   - **Build Command**: `cd backend && npm install && npm run build`
   - **Start Command**: `cd backend && npm run start`
   - **Runtime**: Node

#### 3. Configure Environment Variables

In Render dashboard:
1. Go to Settings → Environment Variables
2. Add the following variables:
   - `DATABASE_URL`: Your PostgreSQL connection URL
   - `DIRECT_URL`: Your direct PostgreSQL connection URL
   - `JWT_SECRET`: Your JWT secret key
   - `PORT`: 5000
   - `NODE_ENV`: production

#### 4. Deploy

Click "Deploy Web Service"

---

### Backend Deployment (Railway)

#### 1. Install Railway CLI

```bash
npm install -g @railway/cli
```

#### 2. Login to Railway

```bash
railway login
```

#### 3. Initialize Project

```bash
railway init
```

#### 4. Add PostgreSQL Database

```bash
railway add postgresql
```

#### 5. Add Backend Service

```bash
railway up
```

#### 6. Configure Environment Variables

In Railway dashboard:
1. Go to your backend service
2. Add environment variables:
   - `DATABASE_URL`: Use Railway's PostgreSQL variable
   - `DIRECT_URL`: Use Railway's PostgreSQL variable
   - `JWT_SECRET`: Your JWT secret key
   - `PORT`: 5000
   - `NODE_ENV`: production

#### 7. Configure Build and Start Commands

In Railway dashboard:
1. Go to Settings
2. Set **Build Command**: `cd backend && npm install && npm run build`
3. Set **Start Command**: `cd backend && npm run start`

---

### Database Deployment (Supabase)

If not using Supabase for local development:

#### 1. Create Supabase Project

See [Database Setup - Option 1](#option-1-using-supabase-recommended)

#### 2. Get Connection Strings

From Supabase dashboard:
- **Session Pooler URL**: Use for runtime (port 6543)
- **Direct URL**: Use for migrations (port 5432)

#### 3. Update Environment Variables

Update your deployment platform's environment variables with the Supabase connection strings.

---

## Troubleshooting

### Issue: Database Connection Pool Exhaustion

**Error**: `max clients reached in session mode - max clients are limited to pool_size: 15`

**Solution**:
1. Ensure `DATABASE_URL` uses port 6543 (PgBouncer Session Pooler)
2. Add `?pgbouncer=true` to the connection string
3. Example: `postgresql://user:pass@host:6543/db?pgbouncer=true`

### Issue: Prisma Client Stale

**Error**: `Unknown argument userId_productId` or similar Prisma errors

**Solution**:
```bash
cd backend
npx prisma generate
npm run build
```

### Issue: Port Already in Use

**Error**: `EADDRINUSE: address already in use :::5000`

**Solution**:
```bash
# Find process using port 5000
netstat -ano | findstr :5000

# Kill the process (Windows)
taskkill /PID <PID> /F

# Or use a different port in .env
PORT=5001
```

### Issue: Module Not Found

**Error**: `Cannot find module '...'`

**Solution**:
```bash
# Install dependencies
npm install

# Or for backend
cd backend
npm install
```

### Issue: TypeScript Compilation Errors

**Error**: TypeScript compilation errors

**Solution**:
```bash
# For frontend
npm run build

# For backend
cd backend
npm run typecheck
```

### Issue: CORS Errors

**Error**: CORS policy error in browser

**Solution**:
Ensure backend CORS middleware is configured correctly in `backend/src/index.ts`:

```typescript
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
```

### Issue: JWT Token Verification Failed

**Error**: `jwt verification failed`

**Solution**:
1. Ensure `JWT_SECRET` is set in backend `.env`
2. Ensure `JWT_SECRET` is the same across all environments
3. Regenerate token if secret was changed

---

## Production Considerations

### Security

1. **Use Environment Variables**: Never commit `.env` files
2. **Strong JWT Secret**: Use a long, random string for `JWT_SECRET`
3. **HTTPS**: Enable HTTPS in production
4. **Rate Limiting**: Implement rate limiting for API endpoints
5. **Input Validation**: Validate all user inputs
6. **SQL Injection**: Prisma ORM prevents SQL injection, but stay vigilant

### Performance

1. **Connection Pooling**: Use PgBouncer for database connections
2. **Caching**: Consider adding Redis for caching
3. **CDN**: Use CDN for static assets
4. **Image Optimization**: Use Next.js Image optimization
5. **Code Splitting**: Next.js automatically code-splits

### Monitoring

1. **Logging**: Implement comprehensive logging
2. **Error Tracking**: Use error tracking (Sentry, etc.)
3. **APM**: Use Application Performance Monitoring
4. **Uptime Monitoring**: Monitor uptime and response times

### Backup

1. **Database Backups**: Regular database backups
2. **Code Backups**: Use Git for version control
3. **Environment Backups**: Document environment configurations

---

**End of Setup and Deployment Guide**
