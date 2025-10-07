# Case Management System - Backend

A comprehensive Laravel backend API for the case management system with full CRUD operations and advanced features.

## Features

- **Product Management**: Complete CRUD with photo upload and barcode support
- **Category Management**: Product categorization with color coding
- **Supplier Management**: Supplier information and product relationships
- **Sales Management**: Sales tracking, reporting, and invoice generation
- **Purchase Management**: Purchase orders, receiving, and supplier management
- **Cash Management**: Income/expense tracking with balance calculation
- **Stock Alerts**: Automatic low stock notifications
- **Inventory Management**: Stock movement tracking and adjustments
- **Export/Import**: Excel export and PDF generation
- **No Authentication Required**: Direct API access for all endpoints

## Prerequisites

- PHP >= 8.0
- Composer
- MySQL/PostgreSQL
- Laravel 9.5.2

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd backend
   ```

2. **Install dependencies**
   ```bash
   composer install
   ```

3. **Environment setup**
   ```bash
   cp .env.example .env
   php artisan key:generate
   ```

4. **Database configuration**
   Update `.env` with your database credentials:
   ```env
   DB_CONNECTION=mysql
   DB_HOST=127.0.0.1
   DB_PORT=3306
   DB_DATABASE=case_management
   DB_USERNAME=your_username
   DB_PASSWORD=your_password
   ```

5. **Run migrations**
   ```bash
   php artisan migrate
   ```

6. **Seed the database**
   ```bash
   php artisan db:seed
   ```

7. **Create storage link**
   ```bash
   php artisan storage:link
   ```

8. **Start the server**
   ```bash
   php artisan serve
   ```

The API will be available at `http://localhost:8000/api`

## API Endpoints

### Dashboard
- `GET /api/dashboard` - Dashboard overview
- `GET /api/dashboard/stats` - Dashboard statistics
- `GET /api/dashboard/recent-activities` - Recent activities

### Products
- `GET /api/products` - List products
- `POST /api/products` - Create product
- `GET /api/products/{id}` - Get product details
- `PUT /api/products/{id}` - Update product
- `DELETE /api/products/{id}` - Delete product
- `POST /api/products/upload-photo` - Upload product photo
- `GET /api/products/search` - Search products
- `GET /api/products/barcode/{barcode}` - Find by barcode
- `POST /api/products/bulk-update` - Bulk update products
- `GET /api/export/products` - Export to Excel

### Categories
- `GET /api/categories` - List categories
- `POST /api/categories` - Create category
- `GET /api/categories/{id}` - Get category details
- `PUT /api/categories/{id}` - Update category
- `DELETE /api/categories/{id}` - Delete category

### Suppliers
- `GET /api/suppliers` - List suppliers
- `POST /api/suppliers` - Create supplier
- `GET /api/suppliers/{id}` - Get supplier details
- `PUT /api/suppliers/{id}` - Update supplier
- `DELETE /api/suppliers/{id}` - Delete supplier
- `GET /api/suppliers/{id}/products` - Get supplier products

### Sales
- `GET /api/sales` - List sales
- `POST /api/sales` - Create sale
- `GET /api/sales/{id}` - Get sale details
- `PUT /api/sales/{id}` - Update sale
- `DELETE /api/sales/{id}` - Delete sale
- `GET /api/sales/reports` - Sales reports
- `GET /api/sales/export` - Export sales
- `POST /api/sales/bulk` - Bulk create sales
- `GET /api/pdf/invoice/{id}` - Generate invoice PDF

### Purchases
- `GET /api/purchases` - List purchases
- `POST /api/purchases` - Create purchase
- `GET /api/purchases/{id}` - Get purchase details
- `PUT /api/purchases/{id}` - Update purchase
- `DELETE /api/purchases/{id}` - Delete purchase
- `PUT /api/purchases/{id}/receive` - Receive purchase
- `GET /api/purchases/reports` - Purchase reports
- `GET /api/purchases/export` - Export purchases

### Cash Transactions
- `GET /api/cash-transactions` - List transactions
- `POST /api/cash-transactions` - Create transaction
- `GET /api/cash-transactions/{id}` - Get transaction details
- `PUT /api/cash-transactions/{id}` - Update transaction
- `DELETE /api/cash-transactions/{id}` - Delete transaction
- `GET /api/cash-transactions/balance` - Get current balance
- `GET /api/cash-transactions/reports` - Transaction reports
- `GET /api/cash-transactions/export` - Export transactions
- `GET /api/pdf/receipt/{id}` - Generate receipt PDF

### Stock Alerts
- `GET /api/stock-alerts` - List alerts
- `POST /api/stock-alerts` - Create alert
- `GET /api/stock-alerts/{id}` - Get alert details
- `PUT /api/stock-alerts/{id}` - Update alert
- `DELETE /api/stock-alerts/{id}` - Delete alert
- `GET /api/stock-alerts/active` - Get active alerts
- `PUT /api/stock-alerts/{id}/resolve` - Resolve alert
- `POST /api/stock-alerts/check` - Check for new alerts

### Inventory
- `GET /api/inventory` - List movements
- `POST /api/inventory` - Create movement
- `GET /api/inventory/{id}` - Get movement details
- `PUT /api/inventory/{id}` - Update movement
- `DELETE /api/inventory/{id}` - Delete movement
- `GET /api/inventory/movements` - Get movements
- `GET /api/inventory/reports` - Inventory reports
- `GET /api/inventory/export` - Export inventory
- `POST /api/inventory/adjustment` - Stock adjustment

## Database Structure

The system includes the following main tables:

- **products** - Product information with photos and stock
- **categories** - Product categories with color coding
- **suppliers** - Supplier information
- **sales** - Sales records with customer details
- **purchases** - Purchase orders and receiving
- **cash_transactions** - Income and expense tracking
- **stock_alerts** - Low stock notifications
- **inventories** - Stock movement history

## Key Features

### Product Management
- Full CRUD operations
- Photo upload and storage
- Barcode and SKU support
- Category organization
- Stock quantity tracking
- Minimum stock alerts

### Sales & Purchases
- Complete transaction tracking
- Customer and supplier management
- Payment method tracking
- Status management
- Bulk operations
- Export functionality

### Cash Management
- Income and expense tracking
- Balance calculation
- Payment method categorization
- Receipt generation
- Financial reporting

### Stock Management
- Real-time stock tracking
- Automatic low stock alerts
- Stock movement history
- Inventory adjustments
- Stock reports

### Export & Reporting
- Excel export for all data
- PDF generation for invoices and receipts
- Customizable reports
- Data filtering and sorting

## Development

### Adding New Features

1. Create migrations for new tables
2. Create models with relationships
3. Create API controllers
4. Add routes to `routes/api.php`
5. Update frontend API service

### File Upload

Product photos are stored in `storage/app/public/products/` and are accessible via the storage link.

### Database Seeding

The system includes seeders for:
- Categories with predefined colors
- Sample data for testing

## Production Deployment

1. Set `APP_ENV=production` in `.env`
2. Configure database for production
3. Run `php artisan config:cache`
4. Run `php artisan route:cache`
5. Set up proper file permissions
6. Configure web server (Apache/Nginx)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.
