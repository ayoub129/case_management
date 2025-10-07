<?php

namespace App\Exports;

use Maatwebsite\Excel\Writers\LaravelExcelWriter;
use Maatwebsite\Excel\Classes\LaravelExcelWorksheet;

class ProductsExport
{
    protected $products;

    public function __construct($products)
    {
        $this->products = $products;
    }

    public function handle($excel)
    {
        $excel->create('products', function(LaravelExcelWriter $excel) {
            $excel->sheet('Products', function(LaravelExcelWorksheet $sheet) {
                $sheet->fromArray($this->getData());
                $sheet->setAutoSize(true);
            });
        });
    }

    private function getData()
    {
        $data = [['ID', 'Name', 'Description', 'Price', 'Cost Price', 'Barcode', 'SKU', 'Stock Quantity', 'Minimum Stock', 'Category', 'Status', 'Created At']];
        
        foreach ($this->products as $product) {
            $data[] = [
                $product->id,
                $product->name,
                $product->description,
                $product->price,
                $product->cost_price,
                $product->barcode,
                $product->sku,
                $product->stock_quantity,
                $product->minimum_stock,
                $product->category ? $product->category->name : 'N/A',
                $product->is_active ? 'Active' : 'Inactive',
                $product->created_at->format('Y-m-d H:i:s'),
            ];
        }
        
        return $data;
    }
} 