# 🔍 Production Authentication Debugging Guide

## Current Issue: 401 Authentication Errors in Production

### Quick Fixes Applied:

#### 1. **Cookie Configuration Enhanced**

- Changed `sameSite` to `"none"` for production (allows cross-domain cookies)
- Enhanced cookie clearing in logout
- Added proper domain handling

#### 2. **CORS Configuration Improved**

- Added more detailed origin logging
- Temporarily relaxed CORS in production for debugging
- Added support for common development ports
- Enhanced headers and options handling

#### 3. **Debug Endpoint Added**

- New endpoint: `/debug/auth` to check authentication status
- Shows cookie presence, origin, headers, and environment info

### Next Steps for Debugging:

#### Step 1: Check Your Deployed Backend

1. Visit your deployed API URL + `/debug/auth`
2. Check if cookies are being received
3. Verify the environment variables are set correctly

#### Step 2: Update Environment Variables

Make sure these are set in your production deployment:

```env
# Required for cross-domain cookies
NODE_ENV=production

# Your actual frontend URL (CRITICAL!)
FRONTEND_URL=https://your-actual-frontend-domain.vercel.app

# Alternative frontend URL if needed
FRONTEND_URL_ALT=https://your-frontend-subdomain.vercel.app

# JWT and Cookie settings
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters
JWT_EXPIRATION=7d
COOKIE_EXPIRATION=604800000

# Database
DATABASE_URL=postgresql://user:pass@host:port/db
```

#### Step 3: Frontend Environment Variables

Update your frontend production environment variables:

```env
# Production
VITE_API_BASE_URL=https://your-backend-domain.vercel.app/api
VITE_APP_NAME=HRMS
VITE_NODE_ENV=production
```

#### Step 4: Browser Testing Commands

**Open Browser Developer Tools and run:**

```javascript
// Check if cookies are being set
console.log("Cookies:", document.cookie);

// Check current API base URL
console.log("API Base:", axios.defaults.baseURL);

// Check if credentials are enabled
console.log("With Credentials:", axios.defaults.withCredentials);

// Test authentication endpoint
fetch("/api/users/verify", {
  method: "POST",
  credentials: "include",
  headers: {
    "Content-Type": "application/json",
  },
})
  .then((r) => r.json())
  .then(console.log);
```

### Common Issues and Solutions:

#### Issue 1: SameSite Cookie Problem

**Symptoms:** Cookies not sent in production
**Solution:** ✅ Fixed - Changed to `sameSite: "none"` in production

#### Issue 2: CORS Origin Mismatch

**Symptoms:** CORS errors in browser console
**Solution:** ✅ Enhanced - Added logging and temporary relaxed CORS for debugging

#### Issue 3: Wrong Frontend URL

**Symptoms:** 401 errors, CORS blocks
**Solution:** ⚠️ **ACTION NEEDED** - Set correct `FRONTEND_URL` in production

#### Issue 4: HTTPS vs HTTP Mismatch

**Symptoms:** Cookies not sent over different protocols
**Solution:** ✅ Fixed - `secure: true` only in production

### Debugging Commands:

#### Backend Logs (Check your deployment platform):

```bash
# Vercel
vercel logs

# Railway
railway logs

# Render
# Check logs in dashboard
```

#### Frontend Network Tab:

1. Open Developer Tools → Network tab
2. Try to login
3. Check for:
   - Set-Cookie headers in login response
   - Cookie headers in subsequent requests
   - CORS preflight OPTIONS requests

### Priority Actions:

1. **🔴 CRITICAL:** Set the correct `FRONTEND_URL` in your backend deployment
2. **🟡 MEDIUM:** Test the `/debug/auth` endpoint
3. **🟢 LOW:** Remove temporary CORS relaxation after fixing

### Test Sequence:

1. Deploy the updated backend code
2. Set correct environment variables
3. Test `/debug/auth` endpoint
4. Test login flow
5. Check browser cookies
6. Verify protected routes work

### Contact Points for Issues:

- **CORS Issues:** Check origin logs in backend
- **Cookie Issues:** Check `/debug/auth` endpoint
- **Environment Issues:** Verify all variables are set
- **Network Issues:** Check browser Network tab

---

**🚨 SECURITY NOTE:** The temporary CORS relaxation should be removed once the correct FRONTEND_URL is set!
