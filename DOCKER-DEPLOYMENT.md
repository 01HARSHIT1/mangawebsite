# 🐳 Docker Deployment Guide

Complete guide for deploying your Manga Website using Docker containers.

## 🚀 Quick Start

### Prerequisites
- Docker Desktop installed and running
- Git (for cloning)
- 4GB+ RAM available
- 10GB+ disk space

### One-Click Deployment

**Windows:**
```powershell
.\deploy.ps1
```

**Linux/Mac:**
```bash
chmod +x deploy.sh
./deploy.sh
```

## 📋 Detailed Setup

### 1. Clone and Setup
```bash
git clone <your-repo-url>
cd mangawebsite
```

### 2. Environment Configuration
```bash
# Copy and customize environment file
cp production.env.template .env.production
# Edit .env.production with your settings
```

### 3. Deploy Services
```bash
# Basic deployment
docker-compose up -d

# Clean deployment (rebuild everything)
docker-compose up -d --build --force-recreate
```

## 🏗️ Architecture

### Services Overview
```
┌─────────────────────────────────────────────────────────┐
│                    Nginx (Port 80/443)                 │
│                   Reverse Proxy                        │
└─────────────────────┬───────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────┐
│                Next.js App (Port 3000)                 │
│              Production Optimized                      │
└─────────────────────┬───────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────┐
│                MongoDB (Port 27017)                    │
│              Persistent Storage                        │
└─────────────────────────────────────────────────────────┘
```

### Container Details

#### Next.js Application
- **Image**: Custom built from Dockerfile
- **Port**: 3000
- **Features**: 
  - Multi-stage build for optimization
  - Non-root user for security
  - Health checks enabled
  - Standalone output for minimal size

#### MongoDB Database
- **Image**: mongo:7.0
- **Port**: 27017
- **Features**:
  - Authentication enabled
  - Persistent volume storage
  - Health checks enabled
  - Automatic initialization

#### Mongo Express (Optional)
- **Image**: mongo-express:1.0.2
- **Port**: 8081
- **Purpose**: Database administration UI

#### Nginx (Production Only)
- **Image**: nginx:alpine
- **Ports**: 80, 443
- **Purpose**: Reverse proxy and SSL termination

## 🔧 Configuration Options

### Development Mode
```bash
# Use development docker-compose
docker-compose -f docker-dev.yml up -d
```

### Production Mode
```bash
# Include Nginx reverse proxy
docker-compose --profile production up -d
```

### Custom Configuration
```bash
# Override specific services
docker-compose -f docker-compose.yml -f docker-compose.override.yml up -d
```

## 📊 Monitoring and Health Checks

### Health Check Endpoints
- **Application**: `http://localhost:3000/api/health`
- **Database**: Built-in MongoDB health check
- **Admin UI**: `http://localhost:8081`

### Viewing Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f app
docker-compose logs -f mongo

# Last 100 lines
docker-compose logs --tail=100 app
```

### Service Status
```bash
# Check running containers
docker-compose ps

# Check resource usage
docker stats

# Check health status
docker-compose exec app curl -f http://localhost:3000/api/health
```

## 🛠️ Maintenance Commands

### Update and Rebuild
```bash
# Pull latest changes
git pull origin main

# Rebuild and restart
docker-compose up -d --build

# Force recreate everything
docker-compose up -d --build --force-recreate
```

### Database Operations
```bash
# Seed database with sample data
docker-compose exec app node seed-database.js

# Connect to MongoDB shell
docker-compose exec mongo mongosh -u admin -p password123

# Backup database
docker-compose exec mongo mongodump --host localhost --port 27017 --username admin --password password123 --authenticationDatabase admin --out /backup

# Restore database
docker-compose exec mongo mongorestore --host localhost --port 27017 --username admin --password password123 --authenticationDatabase admin /backup
```

### Volume Management
```bash
# List volumes
docker volume ls

# Backup volumes
docker run --rm -v manga-website_mongo_data:/data -v $(pwd):/backup alpine tar czf /backup/mongo_backup.tar.gz /data

# Restore volumes
docker run --rm -v manga-website_mongo_data:/data -v $(pwd):/backup alpine tar xzf /backup/mongo_backup.tar.gz -C /
```

## 🔒 Security Configuration

### Production Security Checklist
- [ ] Change default MongoDB passwords
- [ ] Update JWT secret key
- [ ] Configure Stripe with production keys
- [ ] Set up SSL certificates
- [ ] Configure firewall rules
- [ ] Enable container security scanning
- [ ] Set up monitoring and alerting

### SSL/HTTPS Setup
```bash
# Generate SSL certificates (Let's Encrypt example)
certbot certonly --standalone -d yourdomain.com

# Copy certificates to ssl directory
mkdir ssl
cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem ssl/
cp /etc/letsencrypt/live/yourdomain.com/privkey.pem ssl/
```

## 🚀 Deployment Strategies

### Blue-Green Deployment
```bash
# Deploy to staging environment
docker-compose -f docker-compose.staging.yml up -d

# Test staging environment
./test-deployment.sh staging

# Switch to production
docker-compose up -d
```

### Rolling Updates
```bash
# Update application without downtime
docker-compose up -d --no-deps app

# Update database with migration
docker-compose exec app npm run migrate
```

## 🐛 Troubleshooting

### Common Issues

#### Application Won't Start
```bash
# Check logs
docker-compose logs app

# Check environment variables
docker-compose exec app env

# Verify build
docker-compose build --no-cache app
```

#### Database Connection Issues
```bash
# Check MongoDB status
docker-compose exec mongo mongosh --eval "db.adminCommand('ping')"

# Verify network connectivity
docker-compose exec app ping mongo

# Check authentication
docker-compose exec mongo mongosh -u admin -p password123
```

#### Performance Issues
```bash
# Check resource usage
docker stats

# Monitor container metrics
docker-compose exec app top

# Check disk space
df -h
docker system df
```

### Recovery Procedures

#### Complete Reset
```bash
# Stop all services
docker-compose down

# Remove all data (WARNING: This deletes everything)
docker-compose down -v
docker system prune -a

# Fresh deployment
docker-compose up -d --build
```

#### Partial Recovery
```bash
# Restart specific service
docker-compose restart app

# Recreate service with new image
docker-compose up -d --force-recreate app
```

## 📈 Performance Optimization

### Production Optimizations
- Multi-stage Docker builds for smaller images
- Non-root user for security
- Health checks for reliability
- Volume mounts for persistent data
- Resource limits for stability

### Scaling Options
```bash
# Scale application instances
docker-compose up -d --scale app=3

# Add load balancer
docker-compose -f docker-compose.yml -f docker-compose.scale.yml up -d
```

## 🔗 External Integrations

### Cloud Deployment
- **AWS ECS**: Use with AWS Application Load Balancer
- **Google Cloud Run**: Deploy as container service
- **Azure Container Instances**: Direct Docker deployment
- **DigitalOcean Apps**: Git-based deployment

### CI/CD Integration
```yaml
# Example GitHub Actions workflow
name: Deploy to Production
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to server
        run: |
          docker-compose up -d --build
```

## 📞 Support

### Getting Help
- Check logs: `docker-compose logs -f`
- Health check: `http://localhost:3000/api/health`
- Database admin: `http://localhost:8081`

### Useful Resources
- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Reference](https://docs.docker.com/compose/)
- [Next.js Docker Guide](https://nextjs.org/docs/deployment#docker-image)

---

**Your manga website is now ready for production deployment! 🎉**
