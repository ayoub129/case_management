#!/bin/bash

# Quick Laravel Backend Restart Script
# Usage: ./restart.sh

echo "🔄 Restarting Laravel Backend service..."

# Clear caches
php artisan route:clear
php artisan config:clear

# Restart service
systemctl restart laravel-backend

# Show status
echo "📊 Service status:"
systemctl status laravel-backend --no-pager

echo "✅ Restart completed!" 