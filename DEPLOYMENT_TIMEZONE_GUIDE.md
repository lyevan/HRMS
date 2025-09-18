# 🌍 HRMS Multi-Server Deployment Guide

## Timezone & Date Handling for Distributed Deployments

This guide ensures your HRMS system works correctly when frontend, backend, and database are deployed on different servers/regions.

## 🚀 Deployment Scenarios Supported

### ✅ Scenario 1: Cloud Multi-Region

- **Frontend**: Vercel (Global CDN)
- **Backend**: Railway/Render (US East)
- **Database**: Supabase (Singapore)

### ✅ Scenario 2: Hybrid Cloud

- **Frontend**: Netlify (US)
- **Backend**: AWS EC2 (Europe)
- **Database**: AWS RDS (Asia Pacific)

### ✅ Scenario 3: Multi-Cloud

- **Frontend**: Cloudflare Pages (Global)
- **Backend**: Google Cloud Run (US)
- **Database**: Azure PostgreSQL (Europe)

## 🔧 Environment Configuration

### 1. Backend Environment Variables

```bash
# .env or deployment config
BUSINESS_TIMEZONE=Asia/Manila
DATABASE_URL=postgresql://...
PORT=3000

# Optional: Database timezone setting
PGTZ=UTC  # Keep database in UTC, app handles conversion
```

### 2. Frontend Environment Variables

```bash
# .env.production
VITE_API_URL=https://your-backend-domain.com
VITE_BUSINESS_TIMEZONE=Asia/Manila  # For display purposes
```

### 3. Database Configuration

```sql
-- PostgreSQL timezone settings (run once during setup)
SET timezone = 'UTC';  -- Keep database in UTC
ALTER DATABASE your_hrms_db SET timezone = 'UTC';

-- Verify configuration
SELECT current_setting('TIMEZONE');
```

## 📦 Deployment Best Practices

### Frontend Deployment (Vercel/Netlify)

```json
// vercel.json or netlify.toml
{
  "build": {
    "env": {
      "VITE_API_URL": "https://your-backend.herokuapp.com",
      "VITE_BUSINESS_TIMEZONE": "Asia/Manila"
    }
  },
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        }
      ]
    }
  ]
}
```

### Backend Deployment (Railway/Render/Heroku)

```yaml
# railway.toml or render.yaml
[build]
  builder = "NIXPACKS"

[deploy]
  startCommand = "npm start"

[env]
  BUSINESS_TIMEZONE = "Asia/Manila"
  NODE_ENV = "production"
```

### Database Deployment (Supabase/AWS RDS)

```sql
-- Initial setup script
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Ensure timezone handling
SET timezone = 'UTC';
ALTER DATABASE postgres SET timezone = 'UTC';

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_attendance_date_tz
ON attendance USING btree (date, (time_in AT TIME ZONE 'Asia/Manila'));
```

## 🛠️ Code Implementation

### Frontend Date Handling

```typescript
// utils/dateUtils.ts
export const sendDateToBackend = (date: Date) => {
  // Always send UTC ISO string
  return date.toISOString(); // "2025-09-15T16:00:00.000Z"
};

export const formatBusinessDate = (dateString: string) => {
  // Display in business timezone for users
  return dayjs(dateString).tz("Asia/Manila").format("YYYY-MM-DD");
};
```

### Backend Date Processing

```javascript
// Already implemented in your utils/dateUtils.js
import { normalizeToBusinessDate } from "../utils/dateUtils.js";

// In your controllers
const processedDate = normalizeToBusinessDate(req.body.date);
// Works regardless of where backend is deployed
```

## 🧪 Testing Multi-Server Setup

### 1. Local Testing

```bash
# Test with different server timezones
TZ=America/New_York npm start  # Simulate US deployment
TZ=Europe/London npm start     # Simulate EU deployment
TZ=Asia/Singapore npm start    # Simulate Asia deployment
```

### 2. Production Verification

```javascript
// Add to your server startup
console.log("🌍 Deployment Verification:");
console.log(
  "Server Timezone:",
  Intl.DateTimeFormat().resolvedOptions().timeZone
);
console.log("Business Timezone:", process.env.BUSINESS_TIMEZONE);
console.log("Database Timezone:", process.env.PGTZ || "default");
```

## 🔒 Security Considerations

### 1. Database Connection

```javascript
// Use connection pooling with timezone setting
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production",
  timezone: "UTC", // Keep database operations in UTC
});
```

### 2. API Rate Limiting

```javascript
// Consider time-based rate limiting
const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: "Too many requests",
  standardHeaders: true,
  legacyHeaders: false,
});
```

## 📊 Monitoring & Debugging

### 1. Health Check Endpoint

```javascript
// Add to your Express app
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    businessTime: getCurrentBusinessDateTime(),
    serverTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    businessTimezone: process.env.BUSINESS_TIMEZONE,
  });
});
```

### 2. Date Debug Endpoint (Development)

```javascript
app.get("/debug/dates", (req, res) => {
  const testDate = "2025-09-15T16:00:00.000Z";
  res.json({
    input: testDate,
    normalized: normalizeToBusinessDate(testDate),
    serverTime: new Date().toISOString(),
    businessTime: getCurrentBusinessDateTime(),
  });
});
```

## 🚨 Common Issues & Solutions

### Issue 1: "Date shifts by one day"

**Solution**: Always use the date normalization functions

### Issue 2: "Timestamps are wrong timezone"

**Solution**: Ensure `TIMESTAMP WITH TIME ZONE` in database

### Issue 3: "Payroll dates don't match timesheet"

**Solution**: Use consistent date normalization across all operations

## ✅ Deployment Checklist

- [ ] Set `BUSINESS_TIMEZONE` environment variable
- [ ] Database uses `TIMESTAMP WITH TIME ZONE`
- [ ] Frontend sends UTC ISO strings
- [ ] Backend normalizes all dates
- [ ] Health check endpoint returns correct times
- [ ] Test with sample data across timezones

## 🎯 Expected Results

After proper deployment:

- ✅ Employee in Philippines sees correct local times
- ✅ Payroll calculations use correct date ranges
- ✅ Timesheets match attendance records
- ✅ System works regardless of server locations
- ✅ Data consistency across all operations

Your HRMS is now ready for global deployment! 🌍
