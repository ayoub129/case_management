# Case Management System

A comprehensive business management application built with Laravel (Backend) and React/TypeScript (Frontend) for managing sales, purchases, inventory, and cash transactions.

## 🚀 Features

### 📊 Dashboard
- **Real-time Statistics**: Daily and monthly profit tracking
- **Sales Overview**: Today's sales vs yesterday, monthly sales comparison
- **Cash Flow**: Income, expenses, and balance tracking
- **View Modes**: Daily, Monthly, and All-time views
- **Recent Activities**: Latest transactions and system events

### 💰 Sales & Purchases Management
- **Sales Tracking**: Individual and bulk sales management
- **Purchase Orders**: Supplier purchase management
- **Invoice Generation**: Automatic invoice numbering and PDF generation
- **Period Filtering**: Daily, monthly, and all-time views
- **Search & Filter**: Advanced search across all transactions
- **Export Options**: PDF and Excel export functionality

### 🏦 Cash Management
- **Transaction Tracking**: Income and expense recording
- **Balance Monitoring**: Real-time cash balance updates
- **Period Analysis**: Daily and monthly cash flow analysis
- **Transaction History**: Complete audit trail
- **Barcode Scanning**: Product scanning for quick transactions

### 📦 Inventory Management
- **Product Catalog**: Complete product database
- **Stock Tracking**: Real-time inventory levels
- **Low Stock Alerts**: Automatic notifications for low inventory
- **Category Management**: Organized product categorization
- **Supplier Management**: Vendor information and tracking

### 👥 Customer & Supplier Management
- **Customer Database**: Complete customer information
- **Purchase History**: Customer transaction tracking
- **Supplier Directory**: Vendor management system
- **Contact Management**: Phone, email, and address tracking

### 🔐 Multi-User System
- **User Authentication**: Secure login system
- **Role Management**: Different access levels
- **Profile Management**: User account settings

## 🛠️ Technology Stack

### Backend
- **Framework**: Laravel 9.x
- **Database**: MySQL
- **API**: RESTful API with JSON responses
- **Authentication**: Laravel Sanctum
- **File Generation**: PDF and Excel export
- **Date Handling**: Carbon for date manipulation

### Frontend
- **Framework**: React 18 with TypeScript
- **UI Library**: Tailwind CSS + shadcn/ui components
- **State Management**: React Hooks (useState, useEffect)
- **HTTP Client**: Axios for API communication
- **Icons**: Lucide React
- **Notifications**: Sonner for toast notifications

## 📁 Project Structure

```
/var/www/case/
├── backend/                    # Laravel API
│   ├── app/
│   │   ├── Http/Controllers/Api/  # API Controllers
│   │   ├── Models/               # Eloquent Models
│   │   └── ...
│   ├── database/
│   │   ├── migrations/          # Database migrations
│   │   └── seeders/            # Database seeders
│   ├── routes/
│   │   └── api.php             # API routes
│   └── ...
├── frontend/                   # React Application
│   ├── components/             # React components
│   │   ├── dashboard-overview.tsx
│   │   ├── sales-purchases.tsx
│   │   ├── cash-management.tsx
│   │   └── ...
│   ├── lib/
│   │   └── api.ts             # API client
│   └── ...
└── README.md                  # This file
```

## 🚀 Installation & Setup

### Prerequisites
- PHP 8.1+
- Composer
- Node.js 16+
- MySQL 8.0+
- npm or yarn

### Backend Setup (Laravel)

1. **Navigate to backend directory**:
   ```bash
   cd /var/www/case/backend
   ```

2. **Install dependencies**:
   ```bash
   composer install
   ```

3. **Environment setup**:
   ```bash
   cp .env.example .env
   php artisan key:generate
   ```

4. **Database configuration**:
   Update `.env` file with your database credentials:
   ```env
   DB_CONNECTION=mysql
   DB_HOST=127.0.0.1
   DB_PORT=3306
   DB_DATABASE=case_management
   DB_USERNAME=your_username
   DB_PASSWORD=your_password
   ```

5. **Run migrations**:
   ```bash
   php artisan migrate
   ```

6. **Seed database** (optional):
   ```bash
   php artisan db:seed
   ```

7. **Start Laravel server**:
   ```bash
   php artisan serve --host=0.0.0.0 --port=8000
   ```

### Frontend Setup (React)

1. **Navigate to frontend directory**:
   ```bash
   cd /var/www/case/frontend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Start development server**:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

## 📊 API Endpoints

### Dashboard
- `GET /api/dashboard/stats` - General statistics
- `GET /api/dashboard/daily-stats` - Daily statistics
- `GET /api/dashboard/recent-activities` - Recent activities

### Sales
- `GET /api/sales` - List sales (with pagination and filters)
- `POST /api/sales` - Create new sale
- `GET /api/sales/{id}` - Get specific sale
- `PUT /api/sales/{id}` - Update sale
- `DELETE /api/sales/{id}` - Delete sale
- `POST /api/sales/bulk` - Bulk sales creation
- `GET /api/sales/export` - Export sales data

### Purchases
- `GET /api/purchases` - List purchases (with pagination and filters)
- `POST /api/purchases` - Create new purchase
- `GET /api/purchases/{id}` - Get specific purchase
- `PUT /api/purchases/{id}` - Update purchase
- `DELETE /api/purchases/{id}` - Delete purchase
- `POST /api/purchases/bulk` - Bulk purchases creation

### Cash Transactions
- `GET /api/cash-transactions` - List transactions
- `POST /api/cash-transactions` - Create transaction
- `GET /api/cash-transactions/balance` - Get balance summary
- `GET /api/cash-transactions/reports` - Get reports

### Products
- `GET /api/products` - List products
- `POST /api/products` - Create product
- `PUT /api/products/{id}` - Update product
- `DELETE /api/products/{id}` - Delete product

### Customers
- `GET /api/customers` - List customers
- `POST /api/customers` - Create customer
- `PUT /api/customers/{id}` - Update customer
- `DELETE /api/customers/{id}` - Delete customer

### Suppliers
- `GET /api/suppliers` - List suppliers
- `POST /api/suppliers` - Create supplier
- `PUT /api/suppliers/{id}` - Update supplier
- `DELETE /api/suppliers/{id}` - Delete supplier

## 🔧 Key Features Implementation

### Date Filtering System
The application supports three view modes:
- **Daily**: Shows data for a specific date
- **Monthly**: Shows data for a specific calendar month
- **All**: Shows all data without date restrictions

### Total Calculations
- Backend calculates totals for the entire filtered dataset
- Search filters only affect displayed data, not summary totals
- Proper handling of pagination vs. total calculations

### Export Functionality
- PDF generation for sales and purchases reports
- Excel export with proper formatting
- Date range filtering for exports

### Real-time Updates
- Automatic data refresh when filters change
- Live balance updates
- Recent activities tracking

## 🎨 UI Components

### Dashboard Cards
- Profit tracking with daily/monthly comparisons
- Sales statistics with trend indicators
- Cash flow monitoring
- Color-coded status indicators

### Data Tables
- Paginated data display
- Search and filter capabilities
- Sortable columns
- Action buttons (edit, delete, print)

### Forms
- Modal dialogs for data entry
- Form validation
- Auto-complete fields
- Date pickers and selectors

## 🔒 Security Features

- API authentication with Laravel Sanctum
- CSRF protection
- Input validation and sanitization
- SQL injection prevention
- XSS protection

## 📱 Responsive Design

- Mobile-first approach
- Responsive grid layouts
- Touch-friendly interface
- Dark mode support
- Accessible design patterns

## 🚀 Deployment

### Production Setup

1. **Backend deployment**:
   ```bash
   cd /var/www/case/backend
   composer install --optimize-autoloader --no-dev
   php artisan config:cache
   php artisan route:cache
   php artisan view:cache
   ```

2. **Frontend build**:
   ```bash
   cd /var/www/case/frontend
   npm run build
   ```

3. **Web server configuration**:
   - Configure Apache/Nginx to serve the frontend
   - Set up SSL certificates
   - Configure database connections

## 🐛 Troubleshooting

### Common Issues

1. **CORS Issues**:
   - Ensure CORS is properly configured in Laravel
   - Check API base URL in frontend configuration

2. **Database Connection**:
   - Verify database credentials in `.env`
   - Ensure MySQL service is running
   - Check database permissions

3. **File Permissions**:
   ```bash
   chmod -R 755 /var/www/case
   chown -R www-data:www-data /var/www/case
   ```

4. **Cache Issues**:
   ```bash
   php artisan cache:clear
   php artisan config:clear
   php artisan route:clear
   ```

## 📈 Performance Optimization

- Database indexing on frequently queried fields
- API response caching
- Frontend code splitting
- Image optimization
- Lazy loading for large datasets

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is proprietary software. All rights reserved.

## 📞 Support

For technical support or questions, please contact the development team.

---

**Version**: 1.0.0  
**Last Updated**: January 2025  
**Maintainer**: Development Team
