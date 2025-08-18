# API Deployment Guide

This guide covers deploying your HRMS API (legacy JavaScript server) to various platforms.

## Prerequisites

1. **Database**: You need a PostgreSQL database. Options:

   - [Neon](https://neon.tech) (Free tier available)
   - [Supabase](https://supabase.com) (Free tier available)
   - [Railway PostgreSQL](https://railway.app) (Usage-based pricing)
   - [Vercel Postgres](https://vercel.com/storage/postgres) (Hobby plan available)

2. **Environment Variables**: Set up all required environment variables (see `.env.example`)

## Deployment Options

### Option 1: Vercel (Recommended for ease)

1. **Deploy to Vercel:**

   ```bash
   # Install Vercel CLI
   npm i -g vercel

   # Deploy
   vercel
   ```

2. **Set Environment Variables:**

   - Go to Vercel Dashboard → Project → Settings → Environment Variables
   - Add all variables from `.env.example`

3. **Update Frontend:**
   ```env
   # In frontend/.env.production
   VITE_API_BASE_URL=https://your-api-domain.vercel.app/api
   ```

### Option 2: Railway (Recommended for databases)

1. **Connect GitHub:**

   - Go to [Railway.app](https://railway.app)
   - Connect your GitHub repository

2. **Add PostgreSQL:**

   - Create new project
   - Add PostgreSQL service
   - Copy database connection URL

3. **Deploy API:**
   - Add your repository as a service
   - Set environment variables
   - Deploy automatically triggers

### Option 3: Render

1. **Connect Repository:**

   - Go to [Render.com](https://render.com)
   - Create new Web Service from GitHub

2. **Configuration:**

   - Build Command: `npm install`
   - Start Command: `npm start`
   - Environment: Node
   - Plan: Free

3. **Environment Variables:**
   - Add all variables from environment tab

## Environment Variables Setup

### Required Variables:

```env
# Database (get from your database provider)
DATABASE_URL=postgresql://user:pass@host:port/db

# JWT Security (generate strong secrets)
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters
JWT_EXPIRATION=7d
COOKIE_EXPIRATION=604800000

# ESP32 (for RFID functionality)
ESP32_SECRET=your-esp32-device-secret

# Email (Mailtrap for testing, real SMTP for production)
MAIL_HOST=smtp.mailtrap.io
MAIL_PORT=2525
MAIL_USER=your-mailtrap-user
MAIL_PASS=your-mailtrap-pass
MAIL_FROM=noreply@yourcompany.com

# CORS (your frontend URL)
FRONTEND_URL=https://your-frontend.vercel.app

# Server
NODE_ENV=production
PORT=3000
```

### Database Setup:

1. **Create Database:**

   - Sign up for a PostgreSQL service
   - Create a new database
   - Get connection string

2. **Initialize Schema:**
   - The app will create tables automatically via `initDB()`
   - Or manually run the schema creation queries

## Testing Deployment

1. **Health Check:**

   ```
   GET https://your-api-domain.com/test-db
   ```

2. **API Test:**
   ```
   GET https://your-api-domain.com/api/users
   ```

## Updating Frontend

After API deployment, update your frontend:

```env
# frontend/.env.production
VITE_API_BASE_URL=https://your-deployed-api.vercel.app/api
```

## Troubleshooting

### Common Issues:

1. **Database Connection Fails:**

   - Check DATABASE_URL format
   - Verify database is accessible from deployment platform
   - Check firewall/whitelist settings

2. **CORS Errors:**

   - Verify FRONTEND_URL matches your frontend domain
   - Check that credentials: true is set

3. **Environment Variables:**
   - Ensure all required variables are set
   - Check for typos in variable names
   - Verify secrets are properly generated

### Logs:

- **Vercel**: `vercel logs`
- **Railway**: Check dashboard logs
- **Render**: Check service logs in dashboard

## Security Considerations

1. **Secrets**: Use strong, unique secrets for JWT and ESP32
2. **Database**: Use connection pooling and SSL
3. **CORS**: Only allow your frontend domain
4. **Environment**: Never commit `.env` files
5. **Headers**: Helmet middleware is configured for security

## Monitoring

- Set up health checks on `/test-db` endpoint
- Monitor error rates and response times
- Set up alerts for database connection issues
