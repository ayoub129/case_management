<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\SupplierController;
use App\Http\Controllers\Api\CashTransactionController;
use App\Http\Controllers\Api\SaleController;
use App\Http\Controllers\Api\PurchaseController;
use App\Http\Controllers\Api\StockAlertController;
use App\Http\Controllers\Api\InventoryController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\CustomerController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

// Authentication routes
Route::post('/login', [AuthController::class, 'login']);

// Protected routes
Route::middleware('auth:sanctum')->group(function () {
    // Dashboard routes
    Route::get('/dashboard/daily-stats', [DashboardController::class, 'getDailyStats']);
    Route::get('/dashboard/stats', [DashboardController::class, 'getStats']);
    Route::get('/dashboard/recent-activities', [DashboardController::class, 'getRecentActivities']);
    
    // User profile routes
    Route::get('/user', [AuthController::class, 'user']);
    Route::put('/user/profile', [AuthController::class, 'updateProfile']);
    Route::put('/user/password', [AuthController::class, 'updatePassword']);
    Route::post('/logout', [AuthController::class, 'logout']);

    // Users routes (admin only)
    Route::get('/users/roles', [UserController::class, 'roles']);
    Route::get('/users/permissions', [UserController::class, 'permissions']);
    Route::apiResource('users', UserController::class);

    // Customers routes
    Route::apiResource('customers', CustomerController::class);
    Route::get('/customers/barcode/{barcode}', [CustomerController::class, 'findByBarcode']);
    Route::put('/customers/{customer}/toggle-loyalty', [CustomerController::class, 'toggleLoyalty']);
    Route::post('/customers/{customer}/add-points', [CustomerController::class, 'addPoints']);
    Route::get('/customers/statistics', [CustomerController::class, 'statistics']);

    // Categories routes
Route::apiResource('categories', CategoryController::class);

// Products routes
Route::apiResource('products', ProductController::class);
Route::post('/products/upload-photo', [ProductController::class, 'uploadPhoto']);
Route::get('/products/search', [ProductController::class, 'search']);
Route::get('/products/barcode/{barcode}', [ProductController::class, 'findByBarcode']);
Route::post('/products/bulk-update', [ProductController::class, 'bulkUpdate']);

// Suppliers routes
Route::apiResource('suppliers', SupplierController::class);
Route::get('/suppliers/{supplier}/products', [SupplierController::class, 'products']);

// Cash transactions routes
Route::get('/cash-transactions/balance', [CashTransactionController::class, 'balance']);
Route::get('/cash-transactions/reports', [CashTransactionController::class, 'reports']);
Route::apiResource('cash-transactions', CashTransactionController::class);

// Sales routes
Route::apiResource('sales', SaleController::class);
Route::get('/sales/reports', [SaleController::class, 'reports']);
Route::get('/sales/export', [SaleController::class, 'export']);
Route::post('/sales/bulk', [SaleController::class, 'bulkCreate']);

// Purchases routes
Route::apiResource('purchases', PurchaseController::class);
Route::get('/purchases/reports', [PurchaseController::class, 'reports']);
Route::get('/purchases/export', [PurchaseController::class, 'export']);
Route::put('/purchases/{purchase}/receive', [PurchaseController::class, 'receive']);
Route::post('/purchases/bulk', [PurchaseController::class, 'bulkCreate']);

// Stock alerts routes
Route::apiResource('stock-alerts', StockAlertController::class);
Route::get('/stock-alerts/active', [StockAlertController::class, 'active']);
Route::put('/stock-alerts/{stockAlert}/resolve', [StockAlertController::class, 'resolve']);
Route::post('/stock-alerts/check', [StockAlertController::class, 'checkAlerts']);

// Inventory routes
Route::apiResource('inventory', InventoryController::class);
Route::get('/inventory/movements', [InventoryController::class, 'movements']);
Route::get('/inventory/reports', [InventoryController::class, 'reports']);
Route::get('/inventory/export', [InventoryController::class, 'export']);
Route::post('/inventory/adjustment', [InventoryController::class, 'adjustment']);

// Export routes
Route::get('/export/products', [ProductController::class, 'export']);
Route::get('/export/sales', [SaleController::class, 'export']);
Route::get('/export/purchases', [PurchaseController::class, 'export']);
Route::get('/export/inventory', [InventoryController::class, 'export']);
Route::get('/export/cash-transactions', [CashTransactionController::class, 'export']);

// PDF routes
Route::get('/pdf/invoice/{sale}', [SaleController::class, 'generateInvoice']);
Route::get('/pdf/receipt/{cashTransaction}', [CashTransactionController::class, 'generateReceipt']);
Route::get('/pdf/report/{type}', [DashboardController::class, 'generateReport']);
});
