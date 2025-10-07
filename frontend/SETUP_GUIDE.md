# Quick Setup Guide - Login System

## 🚀 Quick Start

### 1. Backend Setup
```bash
cd backend

# Install dependencies
composer install

# Copy environment file
cp .env.example .env

# Generate application key
php artisan key:generate

# Configure database in .env file
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=case_management
DB_USERNAME=your_username
DB_PASSWORD=your_password

# Run migrations
php artisan migrate

# Seed database with test accounts
php artisan db:seed

# Start the server
php artisan serve
```

### 2. Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Create environment file
echo "NEXT_PUBLIC_API_URL=http://localhost:8000/api" > .env.local

# Start the development server
npm run dev
```

### 3. Access the Application
- Visit: `http://localhost:3000`
- You'll be redirected to the login page

## 🔑 Test Accounts

### Admin Account
- **Email**: `admin@example.com`
- **Password**: `admin123`
- **Role**: Administrator
- **Permissions**: Full access to all features

### Cashier Account
- **Email**: `cashier@example.com`
- **Password**: `cashier123`
- **Role**: Cashier
- **Permissions**: Basic access to sales and inventory

## 🎯 Features Available

### After Login:
1. **Dashboard** - Overview of system statistics
2. **Products** - Manage inventory items
3. **Categories** - Organize products
4. **Cash Management** - Track income and expenses
5. **Sales** - Process sales transactions
6. **Suppliers** - Manage vendor relationships
7. **Stock Alerts** - Monitor low stock levels
8. **Inventory** - Track stock movements
9. **Users** - Manage system users
10. **Profile** - Update personal information

### User Menu (Top Right):
- View user information
- Access profile settings
- Logout functionality

## 🔧 Troubleshooting

### Common Issues:

1. **Database Connection Error**
   - Check your `.env` file database settings
   - Ensure MySQL/PostgreSQL is running

2. **API Connection Error**
   - Verify backend is running on `http://localhost:8000`
   - Check `NEXT_PUBLIC_API_URL` in frontend `.env.local`

3. **Login Fails**
   - Ensure database is seeded: `php artisan db:seed`
   - Check if users exist in database

4. **CORS Errors**
   - Backend should handle CORS automatically
   - If issues persist, check Laravel CORS configuration

### Reset Database:
```bash
# Drop all tables and recreate
php artisan migrate:fresh --seed
```

## 📝 Notes

- **No Registration**: User registration is disabled for security
- **Token-based Auth**: Uses Laravel Sanctum for secure authentication
- **Role-based Access**: Different permissions for admin and cashier roles
- **Persistent Login**: Tokens are stored in localStorage
- **Auto Logout**: Tokens expire and require re-login

## 🛡️ Security Features

- **Password Hashing**: All passwords are securely hashed
- **Token Authentication**: JWT-style tokens for API access
- **Protected Routes**: All dashboard routes require authentication
- **Form Validation**: Client and server-side validation
- **Error Handling**: Secure error messages without exposing sensitive data 