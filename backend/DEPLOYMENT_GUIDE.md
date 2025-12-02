# ArtCollab Backend Deployment Guide

## Overview

This guide provides comprehensive instructions for deploying the ArtCollab backend API to various environments, from local development to production cloud platforms.

## Prerequisites

### System Requirements

- **Node.js**: Version 18.0 or higher
- **MongoDB**: Version 6.0 or higher
- **Memory**: Minimum 512MB RAM (2GB+ recommended for production)
- **Storage**: Minimum 1GB free space
- **Network**: HTTPS support for production deployments

### Required Accounts and Services

- **MongoDB Atlas** (recommended) or local MongoDB installation
- **Cloud Storage Provider** (AWS S3, Google Cloud Storage, or similar)
- **Domain Name** (for production)
- **SSL Certificate** (Let's Encrypt recommended)

## Local Development Setup

### 1. Environment Setup

```bash
# Clone the repository
git clone <repository-url>
cd artcollab-backend

# Install dependencies
npm install

# Copy environment template
cp .env.example .env
```

### 2. Configure Environment Variables

Edit `.env` file:

```env
# Database Configuration
MONGODB_URI=mongodb://localhost:27017/artcollab
DB_NAME=artcollab

# JWT Configuration
JWT_SECRET=your_development_jwt_secret_minimum_32_characters
JWT_EXPIRE=7d

# Server Configuration
PORT=5000
NODE_ENV=development

# Security
BCRYPT_ROUNDS=12

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### 3. Start Local MongoDB

**Option A: Local Installation**
```bash
# Start MongoDB service
sudo systemctl start mongod

# Or using homebrew on macOS
brew services start mongodb-community
```

**Option B: Docker**
```bash
# Run MongoDB in Docker
docker run -d -p 27017:27017 --name mongodb mongo:6.0
```

**Option C: MongoDB Atlas**
- Create account at [MongoDB Atlas](https://www.mongodb.com/atlas)
- Create a cluster and get connection string
- Update `MONGODB_URI` in `.env`

### 4. Start Development Server

```bash
# Development mode with hot reloading
npm run dev

# The server will start on http://localhost:5000
```

### 5. Verify Installation

Test the health endpoint:
```bash
curl http://localhost:5000/health
```

Expected response:
```json
{
  "status": "OK",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "uptime": 123.456,
  "environment": "development"
}
```

## Production Deployment

### Security Checklist

Before deploying to production, ensure:

- [ ] Strong JWT secret (minimum 32 characters, randomly generated)
- [ ] Production MongoDB connection with authentication
- [ ] Environment variables properly configured
- [ ] CORS settings restricted to your domains
- [ ] Rate limiting configured appropriately
- [ ] SSL/TLS certificates installed
- [ ] Firewall rules configured
- [ ] Regular backup strategy implemented
- [ ] Monitoring and logging configured

### Environment Configuration

Create production `.env`:

```env
# Production Environment
NODE_ENV=production
PORT=5000

# Database (MongoDB Atlas recommended)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/artcollab?retryWrites=true&w=majority
DB_NAME=artcollab

# Security (CRITICAL: Use strong, unique values)
JWT_SECRET=your_production_jwt_secret_minimum_32_characters_randomly_generated
JWT_EXPIRE=7d
BCRYPT_ROUNDS=12

# Rate Limiting (adjust based on expected traffic)
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# CORS Origins (comma-separated list of allowed domains)
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

## Cloud Platform Deployments

### Heroku Deployment

#### 1. Prepare for Heroku

```bash
# Install Heroku CLI
# Visit: https://devcenter.heroku.com/articles/heroku-cli

# Login to Heroku
heroku login

# Create Heroku app
heroku create artcollab-backend

# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=your_production_jwt_secret
heroku config:set MONGODB_URI=your_mongodb_atlas_connection_string
heroku config:set BCRYPT_ROUNDS=12
```

#### 2. Create Procfile

```bash
echo "web: npm start" > Procfile
```

#### 3. Deploy

```bash
# Add Heroku remote
git remote add heroku https://git.heroku.com/artcollab-backend.git

# Deploy
git add .
git commit -m "Deploy to Heroku"
git push heroku main

# Open application
heroku open
```

#### 4. Monitor Logs

```bash
heroku logs --tail
```

### AWS EC2 Deployment

#### 1. Launch EC2 Instance

- Choose Ubuntu 22.04 LTS AMI
- Select appropriate instance type (t3.micro for testing, t3.small+ for production)
- Configure security group:
  - SSH (port 22) from your IP
  - HTTP (port 80) from anywhere
  - HTTPS (port 443) from anywhere
  - Custom TCP (port 5000) from anywhere (temporary)

#### 2. Connect and Setup Server

```bash
# Connect to instance
ssh -i your-key.pem ubuntu@your-ec2-ip

# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 for process management
sudo npm install -g pm2

# Install nginx for reverse proxy
sudo apt install nginx -y
```

#### 3. Deploy Application

```bash
# Clone repository
git clone <repository-url>
cd artcollab-backend

# Install dependencies
npm install --production

# Create production environment file
sudo nano .env
# Add production environment variables

# Start with PM2
pm2 start app.js --name "artcollab-backend"
pm2 startup
pm2 save
```

#### 4. Configure Nginx

```bash
# Create nginx configuration
sudo nano /etc/nginx/sites-available/artcollab-backend
```

Add configuration:
```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/artcollab-backend /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### 5. Setup SSL with Let's Encrypt

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Get SSL certificate
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Test auto-renewal
sudo certbot renew --dry-run
```

### Google Cloud Platform Deployment

#### 1. Setup GCP Project

```bash
# Install Google Cloud SDK
# Visit: https://cloud.google.com/sdk/docs/install

# Initialize gcloud
gcloud init

# Create new project
gcloud projects create artcollab-backend --name="ArtCollab Backend"

# Set project
gcloud config set project artcollab-backend
```

#### 2. Deploy to App Engine

Create `app.yaml`:
```yaml
runtime: nodejs18

env_variables:
  NODE_ENV: production
  JWT_SECRET: your_production_jwt_secret
  MONGODB_URI: your_mongodb_atlas_connection_string
  BCRYPT_ROUNDS: 12

automatic_scaling:
  min_instances: 1
  max_instances: 10
```

Deploy:
```bash
gcloud app deploy
gcloud app browse
```

#### 3. Deploy to Cloud Run

```bash
# Build container
gcloud builds submit --tag gcr.io/artcollab-backend/artcollab-api

# Deploy to Cloud Run
gcloud run deploy artcollab-api \
  --image gcr.io/artcollab-backend/artcollab-api \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars NODE_ENV=production,JWT_SECRET=your_secret,MONGODB_URI=your_uri
```

### DigitalOcean Deployment

#### 1. Create Droplet

- Choose Ubuntu 22.04 LTS
- Select appropriate size ($5/month for testing, $10+/month for production)
- Add SSH key
- Enable monitoring and backups

#### 2. Setup Application

Follow similar steps as AWS EC2 deployment:

```bash
# Connect to droplet
ssh root@your-droplet-ip

# Create non-root user
adduser artcollab
usermod -aG sudo artcollab
su - artcollab

# Install Node.js, PM2, and nginx
# Deploy application
# Configure nginx and SSL
```

## Docker Deployment

### 1. Create Dockerfile

```dockerfile
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy application code
COPY . .

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S artcollab -u 1001

# Change ownership
RUN chown -R artcollab:nodejs /app
USER artcollab

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:5000/health || exit 1

# Start application
CMD ["npm", "start"]
```

### 2. Create docker-compose.yml

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=production
      - MONGODB_URI=mongodb://mongo:27017/artcollab
      - JWT_SECRET=your_production_jwt_secret
      - BCRYPT_ROUNDS=12
    depends_on:
      - mongo
    restart: unless-stopped

  mongo:
    image: mongo:6.0
    ports:
      - "27017:27017"
    volumes:
      - mongo_data:/data/db
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - app
    restart: unless-stopped

volumes:
  mongo_data:
```

### 3. Deploy with Docker Compose

```bash
# Build and start services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## Database Setup

### MongoDB Atlas (Recommended)

1. **Create Account**: Sign up at [MongoDB Atlas](https://www.mongodb.com/atlas)

2. **Create Cluster**:
   - Choose cloud provider and region
   - Select cluster tier (M0 free tier for development)
   - Configure cluster name

3. **Setup Security**:
   - Create database user with read/write permissions
   - Configure IP whitelist (0.0.0.0/0 for development, specific IPs for production)

4. **Get Connection String**:
   - Click "Connect" → "Connect your application"
   - Copy connection string
   - Replace `<password>` with your database user password

5. **Configure Environment**:
   ```env
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/artcollab?retryWrites=true&w=majority
   ```

### Self-Hosted MongoDB

#### Production MongoDB Setup

```bash
# Install MongoDB
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org

# Start MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod

# Secure MongoDB
mongo
> use admin
> db.createUser({
    user: "admin",
    pwd: "secure_password",
    roles: ["userAdminAnyDatabase", "dbAdminAnyDatabase", "readWriteAnyDatabase"]
  })
> exit

# Enable authentication
sudo nano /etc/mongod.conf
```

Add to mongod.conf:
```yaml
security:
  authorization: enabled
```

```bash
# Restart MongoDB
sudo systemctl restart mongod

# Update connection string
MONGODB_URI=mongodb://admin:secure_password@localhost:27017/artcollab?authSource=admin
```

## Monitoring and Logging

### Application Monitoring

#### PM2 Monitoring

```bash
# Monitor processes
pm2 monit

# View logs
pm2 logs artcollab-backend

# Restart application
pm2 restart artcollab-backend

# View process status
pm2 status
```

#### Log Management

Create log rotation configuration:
```bash
sudo nano /etc/logrotate.d/artcollab-backend
```

```
/home/artcollab/.pm2/logs/*.log {
    daily
    missingok
    rotate 52
    compress
    notifempty
    create 644 artcollab artcollab
    postrotate
        pm2 reloadLogs
    endscript
}
```

### System Monitoring

#### Basic Monitoring Script

```bash
#!/bin/bash
# monitoring.sh

# Check if application is running
if ! pm2 list | grep -q "artcollab-backend.*online"; then
    echo "Application is down, restarting..."
    pm2 restart artcollab-backend
    echo "Application restarted at $(date)" >> /var/log/artcollab-restart.log
fi

# Check disk space
DISK_USAGE=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')
if [ $DISK_USAGE -gt 80 ]; then
    echo "Disk usage is ${DISK_USAGE}% at $(date)" >> /var/log/artcollab-alerts.log
fi

# Check memory usage
MEMORY_USAGE=$(free | grep Mem | awk '{printf "%.0f", $3/$2 * 100.0}')
if [ $MEMORY_USAGE -gt 80 ]; then
    echo "Memory usage is ${MEMORY_USAGE}% at $(date)" >> /var/log/artcollab-alerts.log
fi
```

Add to crontab:
```bash
crontab -e
# Add line:
*/5 * * * * /home/artcollab/monitoring.sh
```

## Backup and Recovery

### Database Backup

#### Automated Backup Script

```bash
#!/bin/bash
# backup.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/home/artcollab/backups"
DB_NAME="artcollab"

# Create backup directory
mkdir -p $BACKUP_DIR

# MongoDB backup
mongodump --uri="$MONGODB_URI" --db=$DB_NAME --out=$BACKUP_DIR/mongodb_$DATE

# Compress backup
tar -czf $BACKUP_DIR/mongodb_$DATE.tar.gz -C $BACKUP_DIR mongodb_$DATE
rm -rf $BACKUP_DIR/mongodb_$DATE

# Keep only last 7 days of backups
find $BACKUP_DIR -name "mongodb_*.tar.gz" -mtime +7 -delete

echo "Backup completed: mongodb_$DATE.tar.gz"
```

Schedule daily backups:
```bash
crontab -e
# Add line:
0 2 * * * /home/artcollab/backup.sh
```

#### Restore from Backup

```bash
# Extract backup
tar -xzf mongodb_20240115_020000.tar.gz

# Restore database
mongorestore --uri="$MONGODB_URI" --db=artcollab mongodb_20240115_020000/artcollab
```

## Performance Optimization

### Application Optimization

1. **Enable Compression**:
   ```javascript
   const compression = require('compression');
   app.use(compression());
   ```

2. **Connection Pooling**:
   ```javascript
   mongoose.connect(process.env.MONGODB_URI, {
     maxPoolSize: 10,
     serverSelectionTimeoutMS: 5000,
     socketTimeoutMS: 45000,
   });
   ```

3. **Caching Strategy**:
   ```javascript
   const redis = require('redis');
   const client = redis.createClient();
   
   // Cache frequently accessed data
   app.use('/api/media', cacheMiddleware(300)); // 5 minutes
   ```

### Database Optimization

1. **Index Optimization**:
   ```javascript
   // Monitor slow queries
   db.setProfilingLevel(2, { slowms: 100 });
   
   // View slow queries
   db.system.profile.find().sort({ ts: -1 }).limit(5);
   ```

2. **Connection Optimization**:
   ```javascript
   // Optimize connection settings
   const mongoOptions = {
     maxPoolSize: 10,
     minPoolSize: 5,
     maxIdleTimeMS: 30000,
     serverSelectionTimeoutMS: 5000,
   };
   ```

### Server Optimization

1. **Nginx Configuration**:
   ```nginx
   # Enable gzip compression
   gzip on;
   gzip_types text/plain application/json application/javascript text/css;
   
   # Enable caching
   location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
       expires 1y;
       add_header Cache-Control "public, immutable";
   }
   
   # Rate limiting
   limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
   limit_req zone=api burst=20 nodelay;
   ```

2. **PM2 Cluster Mode**:
   ```javascript
   // ecosystem.config.js
   module.exports = {
     apps: [{
       name: 'artcollab-backend',
       script: 'app.js',
       instances: 'max',
       exec_mode: 'cluster',
       env: {
         NODE_ENV: 'production'
       }
     }]
   };
   ```

## Troubleshooting

### Common Issues

#### 1. Application Won't Start

**Symptoms**: Server fails to start or crashes immediately

**Solutions**:
```bash
# Check logs
pm2 logs artcollab-backend

# Common fixes:
# - Verify environment variables
# - Check MongoDB connection
# - Ensure port is available
# - Verify file permissions
```

#### 2. Database Connection Issues

**Symptoms**: "MongoNetworkError" or connection timeouts

**Solutions**:
```bash
# Test MongoDB connection
mongo "$MONGODB_URI"

# Common fixes:
# - Check connection string format
# - Verify network connectivity
# - Check firewall rules
# - Verify authentication credentials
```

#### 3. High Memory Usage

**Symptoms**: Application consuming excessive memory

**Solutions**:
```bash
# Monitor memory usage
pm2 monit

# Restart application
pm2 restart artcollab-backend

# Check for memory leaks in logs
# Consider increasing server resources
```

#### 4. SSL Certificate Issues

**Symptoms**: HTTPS not working or certificate errors

**Solutions**:
```bash
# Check certificate status
sudo certbot certificates

# Renew certificate
sudo certbot renew

# Test nginx configuration
sudo nginx -t
```

### Performance Issues

#### 1. Slow API Responses

**Diagnosis**:
```bash
# Check database performance
db.runCommand({serverStatus: 1}).opcounters

# Monitor API response times
# Check for missing indexes
# Analyze slow queries
```

**Solutions**:
- Add appropriate database indexes
- Implement caching
- Optimize query patterns
- Consider database scaling

#### 2. High CPU Usage

**Diagnosis**:
```bash
# Monitor CPU usage
top -p $(pgrep -f "node.*app.js")

# Check PM2 metrics
pm2 monit
```

**Solutions**:
- Enable PM2 cluster mode
- Optimize CPU-intensive operations
- Consider vertical scaling
- Implement rate limiting

## Security Hardening

### Server Security

1. **Firewall Configuration**:
   ```bash
   # Configure UFW
   sudo ufw default deny incoming
   sudo ufw default allow outgoing
   sudo ufw allow ssh
   sudo ufw allow 'Nginx Full'
   sudo ufw enable
   ```

2. **SSH Hardening**:
   ```bash
   # Edit SSH config
   sudo nano /etc/ssh/sshd_config
   
   # Recommended settings:
   PermitRootLogin no
   PasswordAuthentication no
   PubkeyAuthentication yes
   Port 2222  # Change default port
   ```

3. **Automatic Updates**:
   ```bash
   # Install unattended upgrades
   sudo apt install unattended-upgrades
   sudo dpkg-reconfigure unattended-upgrades
   ```

### Application Security

1. **Environment Variables**:
   ```bash
   # Secure .env file
   chmod 600 .env
   chown artcollab:artcollab .env
   ```

2. **Process Security**:
   ```bash
   # Run as non-root user
   pm2 start app.js --user artcollab
   ```

3. **Regular Updates**:
   ```bash
   # Update dependencies
   npm audit
   npm update
   ```

This comprehensive deployment guide covers all aspects of deploying the ArtCollab backend from development to production environments. Follow the appropriate sections based on your deployment target and requirements.

