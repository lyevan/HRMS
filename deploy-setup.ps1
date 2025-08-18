# HRMS API Deployment Setup Script (PowerShell)
Write-Host "🚀 HRMS API Deployment Setup" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Green

# Check if we're in the right directory
if (-not (Test-Path "server/server.js")) {
    Write-Host "❌ Error: server/server.js not found. Please run this from the HRMS root directory." -ForegroundColor Red
    exit 1
}

Write-Host "✅ Found server/server.js" -ForegroundColor Green

# Check if .env exists
if (-not (Test-Path ".env")) {
    Write-Host "⚠️  No .env file found. Creating from template..." -ForegroundColor Yellow
    Copy-Item ".env.example" ".env"
    Write-Host "📝 Please edit .env with your actual values before deploying!" -ForegroundColor Yellow
    Write-Host "   Required: DATABASE_URL, JWT_SECRET, FRONTEND_URL" -ForegroundColor Yellow
}

# Install dependencies
Write-Host "📦 Installing dependencies..." -ForegroundColor Blue
npm install

# Check if dependencies installed successfully
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to install dependencies." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🎉 Setup complete! Ready for deployment." -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Edit .env with your actual database and secrets" -ForegroundColor White
Write-Host "2. Choose a deployment platform:" -ForegroundColor White
Write-Host "   • Vercel: npm i -g vercel && vercel" -ForegroundColor White
Write-Host "   • Railway: Connect GitHub at railway.app" -ForegroundColor White
Write-Host "   • Render: Connect repository at render.com" -ForegroundColor White
Write-Host ""
Write-Host "📖 See API_DEPLOYMENT_GUIDE.md for detailed instructions" -ForegroundColor Cyan
