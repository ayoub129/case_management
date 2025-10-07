# Laravel Backend Service Management

## 🚀 Service Commands

### Basic Service Management
```bash
# Start the service
systemctl start laravel-backend

# Stop the service
systemctl stop laravel-backend

# Restart the service
systemctl restart laravel-backend

# Check service status
systemctl status laravel-backend

# Enable service to start on boot
systemctl enable laravel-backend

# Disable service from starting on boot
systemctl disable laravel-backend
```

### Quick Restart (Recommended)
```bash
# From the backend directory
cd /var/www/case/backend
./restart.sh
```

### Full Deployment
```bash
# From the backend directory
cd /var/www/case/backend
./deploy.sh
```

## 📊 Monitoring

### View Service Logs
```bash
# Real-time logs
journalctl -u laravel-backend -f

# Recent logs
journalctl -u laravel-backend -n 50

# Logs since last boot
journalctl -u laravel-backend -b

# Logs for specific time
journalctl -u laravel-backend --since "2025-08-06 10:00:00"
```

### Check Service Health
```bash
# Test API endpoint
curl -X POST http://localhost:8000/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}'

# Test external URL
curl -X POST https://case.berouijil.com/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}'
```

## 🔧 Troubleshooting

### Service Won't Start
```bash
# Check detailed status
systemctl status laravel-backend --no-pager

# Check logs for errors
journalctl -u laravel-backend -n 20

# Check if port is in use
netstat -tlnp | grep :8000

# Kill any existing processes
pkill -f "php artisan serve"
```

### Permission Issues
```bash
# Fix storage permissions
chmod -R 775 storage bootstrap/cache
chown -R root:root storage bootstrap/cache
```

### Cache Issues
```bash
# Clear all Laravel caches
php artisan route:clear
php artisan config:clear
php artisan cache:clear
php artisan view:clear
```

## 📝 Test Accounts

### Admin Account
- **Email:** admin@example.com
- **Password:** admin123
- **Role:** Administrator

### Cashier Account
- **Email:** cashier@example.com
- **Password:** cashier123
- **Role:** Cashier

## 🔄 After Code Changes

When you make changes to your Laravel application:

1. **Quick restart (most common):**
   ```bash
   cd /var/www/case/backend
   ./restart.sh
   ```

2. **Full deployment (for major changes):**
   ```bash
   cd /var/www/case/backend
   ./deploy.sh
   ```

3. **Manual restart:**
   ```bash
   systemctl restart laravel-backend
   ```

## 🛡️ Service Features

- **Auto-restart:** Service automatically restarts if it crashes
- **Boot persistence:** Service starts automatically on system boot
- **Proper logging:** All logs are captured in systemd journal
- **Security:** Service runs with restricted permissions
- **Health monitoring:** Easy to check service status and logs

## 📞 Emergency Commands

```bash
# Force stop and restart
systemctl stop laravel-backend
pkill -f "php artisan serve"
systemctl start laravel-backend

# Check if service is responding
curl -f http://localhost:8000/api/login || echo "Service not responding"

# View real-time logs during issues
journalctl -u laravel-backend -f
``` 