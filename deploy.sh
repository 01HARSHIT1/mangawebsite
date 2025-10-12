#!/bin/bash

# Manga Website Deployment Script
# Comprehensive Docker deployment with health checks and database seeding

set -e

echo "🚀 Starting Manga Website Deployment"
echo "===================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    print_error "Docker is not running. Please start Docker Desktop first."
    exit 1
fi

print_success "Docker is running"

# Stop existing containers
print_status "Stopping existing containers..."
docker-compose down --remove-orphans || true

# Remove old images (optional)
read -p "Do you want to remove old images to force rebuild? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_status "Removing old images..."
    docker image prune -a -f || true
fi

# Build and start services
print_status "Building and starting services..."
docker-compose up -d --build

# Wait for services to be healthy
print_status "Waiting for services to be healthy..."

# Wait for MongoDB
print_status "Waiting for MongoDB to be ready..."
timeout=60
counter=0
while ! docker-compose exec -T mongo mongosh --eval "db.adminCommand('ping')" > /dev/null 2>&1; do
    if [ $counter -ge $timeout ]; then
        print_error "MongoDB failed to start within $timeout seconds"
        docker-compose logs mongo
        exit 1
    fi
    sleep 2
    counter=$((counter + 2))
    echo -n "."
done
echo
print_success "MongoDB is ready"

# Wait for the application
print_status "Waiting for Next.js application to be ready..."
timeout=120
counter=0
while ! curl -f http://localhost:3000/api/health > /dev/null 2>&1; do
    if [ $counter -ge $timeout ]; then
        print_error "Application failed to start within $timeout seconds"
        docker-compose logs app
        exit 1
    fi
    sleep 3
    counter=$((counter + 3))
    echo -n "."
done
echo
print_success "Application is ready"

# Seed database with sample data
print_status "Seeding database with sample data..."
if docker-compose exec -T app node seed-database.js; then
    print_success "Database seeded successfully"
else
    print_warning "Database seeding failed, but application should still work with mock data"
fi

# Show service status
print_status "Service Status:"
docker-compose ps

# Show service URLs
echo
print_success "🎉 Deployment Complete!"
echo "========================"
echo
print_status "Your manga website is now running:"
echo "🌐 Main Website: http://localhost:3000"
echo "🗄️  Database Admin: http://localhost:8081"
echo "   Username: admin"
echo "   Password: admin123"
echo
print_status "Health Check: http://localhost:3000/api/health"
echo

# Test the deployment
print_status "Running basic health checks..."

# Test main website
if curl -f http://localhost:3000 > /dev/null 2>&1; then
    print_success "✅ Main website is accessible"
else
    print_error "❌ Main website is not accessible"
fi

# Test API
if curl -f http://localhost:3000/api/manga > /dev/null 2>&1; then
    print_success "✅ API endpoints are working"
else
    print_error "❌ API endpoints are not working"
fi

# Test database admin
if curl -f http://localhost:8081 > /dev/null 2>&1; then
    print_success "✅ Database admin is accessible"
else
    print_warning "⚠️  Database admin may not be ready yet"
fi

echo
print_success "🚀 Your manga website is ready for use!"
print_status "To stop the services: docker-compose down"
print_status "To view logs: docker-compose logs -f"
print_status "To rebuild: ./deploy.sh"
echo
