# API Documentation

## Authentication

All API requests (except login and register) require authentication using Bearer tokens.

### Register User
```http
POST /api/register
Content-Type: application/json

{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123",
    "password_confirmation": "password123",
    "phone": "+1234567890",
    "address": "123 Main St, City, Country"
}
```

### Login
```http
POST /api/login
Content-Type: application/json

{
    "email": "admin@example.com",
    "password": "password"
}
```

Response:
```json
{
    "success": true,
    "message": "Login successful",
    "data": {
        "user": {
            "id": 1,
            "name": "Admin",
            "email": "admin@example.com",
            "roles": [...]
        },
        "token": "1|abc123...",
        "token_type": "Bearer"
    }
}
```

## Products

### List Products
```http
GET /api/products?search=phone&category_id=1&stock_status=low_stock&page=1&per_page=15
Authorization: Bearer {token}
```

### Create Product
```http
POST /api/products
Authorization: Bearer {token}
Content-Type: application/json

{
    "name": "iPhone 15",
    "description": "Latest iPhone model",
    "price": 999.99,
    "cost_price": 800.00,
    "barcode": "1234567890123",
    "sku": "IPH15-128GB",
    "stock_quantity": 50,
    "minimum_stock": 10,
    "category_id": 1,
    "is_active": true
}
```

### Upload Product Photo
```http
POST /api/products/upload-photo
Authorization: Bearer {token}
Content-Type: multipart/form-data

{
    "product_id": 1,
    "photo": [file]
}
```

### Search Products
```http
GET /api/products/search?query=iphone
Authorization: Bearer {token}
```

### Find by Barcode
```http
GET /api/products/barcode/1234567890123
Authorization: Bearer {token}
```

## Sales

### Create Sale
```http
POST /api/sales
Authorization: Bearer {token}
Content-Type: application/json

{
    "product_id": 1,
    "quantity": 2,
    "unit_price": 999.99,
    "total_amount": 1999.98,
    "discount": 50.00,
    "tax": 100.00,
    "final_amount": 2049.98,
    "customer_name": "John Doe",
    "customer_email": "john@example.com",
    "customer_phone": "+1234567890",
    "payment_method": "card",
    "status": "completed",
    "sale_date": "2024-01-15",
    "notes": "Customer requested gift wrapping"
}
```

## Cash Transactions

### Create Cash Transaction
```http
POST /api/cash-transactions
Authorization: Bearer {token}
Content-Type: application/json

{
    "type": "income",
    "amount": 1000.00,
    "description": "Daily sales revenue",
    "reference": "SALES-001",
    "payment_method": "cash",
    "transaction_date": "2024-01-15",
    "notes": "Cash sales for the day"
}
```

### Get Cash Balance
```http
GET /api/cash-transactions/balance
Authorization: Bearer {token}
```

Response:
```json
{
    "success": true,
    "data": {
        "total_income": 5000.00,
        "total_expenses": 2000.00,
        "balance": 3000.00
    }
}
```

## Dashboard

### Get Dashboard Stats
```http
GET /api/dashboard/stats?period=month
Authorization: Bearer {token}
```

Response:
```json
{
    "success": true,
    "data": {
        "products": {
            "total": 150,
            "active": 140,
            "low_stock": 15,
            "out_of_stock": 5
        },
        "sales": {
            "total_amount": 25000.00,
            "total_count": 125,
            "average_amount": 200.00
        },
        "purchases": {
            "total_amount": 15000.00,
            "total_count": 45
        },
        "cash": {
            "total_income": 25000.00,
            "total_expenses": 15000.00,
            "balance": 10000.00
        },
        "alerts": {
            "active": 8
        },
        "top_products": [...]
    }
}
```

## Stock Alerts

### Get Active Alerts
```http
GET /api/stock-alerts/active
Authorization: Bearer {token}
```

### Resolve Alert
```http
PUT /api/stock-alerts/{id}/resolve
Authorization: Bearer {token}
Content-Type: application/json

{
    "notes": "Stock replenished"
}
```

## Export & Reports

### Export Products to Excel
```http
GET /api/export/products?category_id=1&is_active=1
Authorization: Bearer {token}
```

### Generate PDF Report
```http
GET /api/pdf/report/sales?start_date=2024-01-01&end_date=2024-01-31
Authorization: Bearer {token}
```

## Error Responses

### Validation Error
```json
{
    "success": false,
    "message": "Validation errors",
    "errors": {
        "email": ["The email field is required."],
        "password": ["The password must be at least 8 characters."]
    }
}
```

### Authentication Error
```json
{
    "success": false,
    "message": "Invalid credentials"
}
```

### Not Found Error
```json
{
    "success": false,
    "message": "Product not found"
}
```

## Pagination

All list endpoints support pagination with the following parameters:
- `page`: Page number (default: 1)
- `per_page`: Items per page (default: 15)

Response format:
```json
{
    "success": true,
    "data": {
        "current_page": 1,
        "data": [...],
        "first_page_url": "...",
        "from": 1,
        "last_page": 5,
        "last_page_url": "...",
        "next_page_url": "...",
        "path": "...",
        "per_page": 15,
        "prev_page_url": null,
        "to": 15,
        "total": 75
    }
}
```

## Filtering & Sorting

Most list endpoints support filtering and sorting:

### Filtering
- `search`: Search in name, description, barcode, SKU
- `category_id`: Filter by category
- `stock_status`: Filter by stock status (in_stock, low_stock, out_of_stock)
- `is_active`: Filter by active status
- `type`: Filter by type (for transactions)
- `start_date` & `end_date`: Date range filtering

### Sorting
- `sort_by`: Field to sort by (name, price, created_at, etc.)
- `sort_order`: Sort order (asc, desc)

Example:
```http
GET /api/products?search=phone&category_id=1&sort_by=price&sort_order=desc&page=1&per_page=20
``` 