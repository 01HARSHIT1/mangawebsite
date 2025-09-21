# Manga Website Deployment Script for Windows
# Comprehensive Docker deployment with health checks and database seeding

param(
    [switch]$Clean = $false,
    [switch]$SkipSeed = $false
)

Write-Host "🚀 Starting Manga Website Deployment" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan

# Check if Docker is running
try {
    docker info | Out-Null
    Write-Host "✅ Docker is running" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker is not running. Please start Docker Desktop first." -ForegroundColor Red
    exit 1
}

# Stop existing containers
Write-Host "🛑 Stopping existing containers..." -ForegroundColor Yellow
docker-compose down --remove-orphans

# Remove old images if requested
if ($Clean) {
    Write-Host "🧹 Removing old images..." -ForegroundColor Yellow
    docker image prune -a -f
}

# Build and start services
Write-Host "🔨 Building and starting services..." -ForegroundColor Yellow
docker-compose up -d --build

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to start services" -ForegroundColor Red
    exit 1
}

# Wait for services to be healthy
Write-Host "⏳ Waiting for services to be healthy..." -ForegroundColor Yellow

# Wait for MongoDB
Write-Host "Waiting for MongoDB to be ready..." -ForegroundColor White
$timeout = 60
$counter = 0
do {
    if ($counter -ge $timeout) {
        Write-Host "❌ MongoDB failed to start within $timeout seconds" -ForegroundColor Red
        docker-compose logs mongo
        exit 1
    }
    Start-Sleep -Seconds 2
    $counter += 2
    Write-Host "." -NoNewline
    $mongoReady = docker-compose exec -T mongo mongosh --eval "db.adminCommand('ping')" 2>$null
} while (-not $mongoReady)

Write-Host ""
Write-Host "✅ MongoDB is ready" -ForegroundColor Green

# Wait for the application
Write-Host "Waiting for Next.js application to be ready..." -ForegroundColor White
$timeout = 120
$counter = 0
do {
    if ($counter -ge $timeout) {
        Write-Host "❌ Application failed to start within $timeout seconds" -ForegroundColor Red
        docker-compose logs app
        exit 1
    }
    Start-Sleep -Seconds 3
    $counter += 3
    Write-Host "." -NoNewline
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3000/api/health" -UseBasicParsing -TimeoutSec 5
        $appReady = $response.StatusCode -eq 200
    } catch {
        $appReady = $false
    }
} while (-not $appReady)

Write-Host ""
Write-Host "✅ Application is ready" -ForegroundColor Green

# Seed database with sample data
if (-not $SkipSeed) {
    Write-Host "🌱 Seeding database with sample data..." -ForegroundColor Yellow
    try {
        docker-compose exec -T app node seed-database.js
        Write-Host "✅ Database seeded successfully" -ForegroundColor Green
    } catch {
        Write-Host "⚠️  Database seeding failed, but application should still work with mock data" -ForegroundColor Yellow
    }
}

# Show service status
Write-Host "`n📊 Service Status:" -ForegroundColor Cyan
docker-compose ps

# Show service URLs
Write-Host ""
Write-Host "🎉 Deployment Complete!" -ForegroundColor Green
Write-Host "========================" -ForegroundColor Green
Write-Host ""
Write-Host "Your manga website is now running:" -ForegroundColor White
Write-Host "🌐 Main Website: " -NoNewline -ForegroundColor White
Write-Host "http://localhost:3000" -ForegroundColor Cyan
Write-Host "🗄️  Database Admin: " -NoNewline -ForegroundColor White  
Write-Host "http://localhost:8081" -ForegroundColor Cyan
Write-Host "   Username: admin" -ForegroundColor Gray
Write-Host "   Password: admin123" -ForegroundColor Gray
Write-Host ""
Write-Host "Health Check: " -NoNewline -ForegroundColor White
Write-Host "http://localhost:3000/api/health" -ForegroundColor Cyan
Write-Host ""

# Test the deployment
Write-Host "🔍 Running basic health checks..." -ForegroundColor Yellow

# Test main website
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000" -UseBasicParsing -TimeoutSec 10
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ Main website is accessible" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ Main website is not accessible" -ForegroundColor Red
}

# Test API
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/api/manga" -UseBasicParsing -TimeoutSec 10
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ API endpoints are working" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ API endpoints are not working" -ForegroundColor Red
}

# Test database admin
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8081" -UseBasicParsing -TimeoutSec 10
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ Database admin is accessible" -ForegroundColor Green
    }
} catch {
    Write-Host "⚠️  Database admin may not be ready yet" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🚀 Your manga website is ready for use!" -ForegroundColor Green
Write-Host ""
Write-Host "💡 Useful Commands:" -ForegroundColor Cyan
Write-Host "To stop services: " -NoNewline -ForegroundColor White
Write-Host "docker-compose down" -ForegroundColor Yellow
Write-Host "To view logs: " -NoNewline -ForegroundColor White
Write-Host "docker-compose logs -f" -ForegroundColor Yellow
Write-Host "To rebuild: " -NoNewline -ForegroundColor White
Write-Host ".\deploy.ps1 -Clean" -ForegroundColor Yellow
Write-Host ""
