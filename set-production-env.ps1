# PowerShell script to set production environment variables on Vercel
# Run this script to configure your production environment

Write-Host "Setting up production environment variables..." -ForegroundColor Green

# Frontend environment variables (set via Vercel dashboard or CLI)
Write-Host "`nFrontend Environment Variables to set on Vercel:" -ForegroundColor Yellow
Write-Host "VITE_API_BASE_URL=https://relyant-demo-api.vercel.app/api"
Write-Host "VITE_APP_NAME=HRMS"
Write-Host "VITE_NODE_ENV=production"

Write-Host "`nBackend Environment Variables to set on Vercel:" -ForegroundColor Yellow
Write-Host "NODE_ENV=production"
Write-Host "FRONTEND_URL=https://relyant-demo-client.vercel.app"
Write-Host "JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters"
Write-Host "JWT_EXPIRATION=7d"
Write-Host "COOKIE_EXPIRATION=604800000"
Write-Host "DATABASE_URL=your-postgresql-connection-string"
Write-Host "ESP32_SECRET=your-esp32-device-secret"
Write-Host "MAIL_HOST=smtp.mailtrap.io"
Write-Host "MAIL_PORT=2525"
Write-Host "MAIL_USER=your-mailtrap-user"
Write-Host "MAIL_PASS=your-mailtrap-pass"
Write-Host "MAIL_FROM=noreply@yourcompany.com"

Write-Host "`nTo set these via Vercel CLI:" -ForegroundColor Cyan
Write-Host "vercel env add FRONTEND_URL production"
Write-Host "# Then enter: https://relyant-demo-client.vercel.app"
Write-Host ""
Write-Host "vercel env add VITE_API_BASE_URL production"
Write-Host "# Then enter: https://relyant-demo-api.vercel.app/api"
Write-Host ""
Write-Host "Or set them via the Vercel dashboard at https://vercel.com/dashboard"

Write-Host "`nAfter setting environment variables, redeploy both frontend and backend." -ForegroundColor Green
