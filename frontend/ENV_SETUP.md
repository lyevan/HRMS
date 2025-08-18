# Environment Variables Setup

This project uses environment variables to configure different settings for development, staging, and production environments.

## Required Environment Variables

### Frontend (.env files)

All environment variables for the frontend must be prefixed with `VITE_` to be accessible in the browser.

- `VITE_API_BASE_URL` - The base URL for your backend API
- `VITE_APP_NAME` - The application name
- `VITE_NODE_ENV` - The environment (development, staging, production)

## Setup Instructions

### 1. Local Development

Create a `.env.local` file in the `frontend` directory:

```bash
cp frontend/.env.example frontend/.env.local
```

Edit `.env.local` with your local values:

```env
VITE_API_BASE_URL=http://localhost:3000/api
VITE_APP_NAME=HRMS
VITE_NODE_ENV=development
```

### 2. Vercel Deployment

In your Vercel dashboard:

1. Go to your project settings
2. Navigate to "Environment Variables"
3. Add the following variables:

**Production:**

- Key: `VITE_API_BASE_URL`
- Value: `https://your-production-backend.com/api`
- Environment: Production

**Preview (optional):**

- Key: `VITE_API_BASE_URL`
- Value: `https://your-staging-backend.com/api`
- Environment: Preview

### 3. File Priority

Vite loads environment variables in this order (higher priority first):

1. `.env.local` (local overrides, ignored by git)
2. `.env.development` / `.env.production` (environment-specific)
3. `.env` (shared across all environments)

## Security Notes

- Never commit `.env.local` files
- Frontend environment variables are exposed to the browser
- Don't put sensitive data in `VITE_` prefixed variables
- Backend secrets should be kept in backend environment variables only

## Usage in Code

```typescript
import config from "./lib/config";

// Access environment variables
console.log(config.api.baseUrl); // VITE_API_BASE_URL
console.log(config.app.name); // VITE_APP_NAME

// Check environment
if (config.isDevelopment) {
  console.log("Running in development mode");
}
```
