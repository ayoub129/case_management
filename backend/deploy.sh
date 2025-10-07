#!/bin/bash

# Laravel Backend Deployment Script
# Usage: ./deploy.sh

set -e

echo "🚀 Starting Laravel Backend Deployment..."

# Stop the service
echo "⏹️  Stopping Laravel Backend service..."
systemctl stop laravel-backend || true

# Clear Laravel caches
echo "🧹 Clearing Laravel caches..."
php artisan route:clear
php artisan config:clear
php artisan cache:clear
php artisan view:clear

# Run migrations
echo "🗄️  Running database migrations..."
php artisan migrate --force

# Set proper permissions
echo "🔐 Setting permissions..."
chmod -R 775 storage bootstrap/cache
chown -R root:root storage bootstrap/cache

# Start the service
echo "▶️  Starting Laravel Backend service..."
systemctl start laravel-backend

# Check service status
echo "📊 Checking service status..."
systemctl status laravel-backend --no-pager

echo "✅ Deployment completed successfully!"
echo "📝 Service logs: journalctl -u laravel-backend -f" 