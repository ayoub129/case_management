"use client"

import { useState, useEffect } from "react"
import { useLanguage } from "@/components/language-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Minus, ShoppingCart, ArrowLeft, Loader2, Search } from "lucide-react"
import { categoriesAPI, productsAPI, cashTransactionsAPI } from "@/lib/api"
import { toast } from "sonner"

interface Category {
  id: number
  name: string
  description?: string
  color?: string
}

interface Product {
  id: number
  name: string
  description?: string
  price: number | string
  stock_quantity: number
  minimum_stock: number
  category_id: number
}

interface CartItem {
  product: Product
  quantity: number
  unitPrice: number | string
  totalPrice: number | string
}

export function TransactionFlow({ onSaleComplete, initialProduct }: { 
  onSaleComplete?: () => void;
  initialProduct?: Product | null;
}) {
  const [categories, setCategories] = useState<Category[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)
  const [cart, setCart] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(true)
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [barcodeInput, setBarcodeInput] = useState("")
  const [isScanning, setIsScanning] = useState(false)
  const [scanTimeout, setScanTimeout] = useState<NodeJS.Timeout | null>(null)
  const [currentStep, setCurrentStep] = useState<'categories' | 'products' | 'cart'>('categories')

  useEffect(() => {
    fetchCategories()
  }, [])

  // Handle initial product if provided
  useEffect(() => {
    if (initialProduct) {
      // Add initial product to cart and go directly to cart page
      const productPrice = typeof initialProduct.price === 'number' ? initialProduct.price : parseFloat(initialProduct.price || '0')
      setCart([{
        product: initialProduct,
        quantity: 1,
        unitPrice: productPrice,
        totalPrice: productPrice
      }])
      setCurrentStep('cart')
    }
  }, [initialProduct])

  // Barcode scanning effect
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      // Handle barcode scanning from any step
      if (event.key.length === 1 && event.key.match(/[0-9]/)) {
        setIsScanning(true);
        setBarcodeInput(prev => prev + event.key);
        
        // Clear previous timeout
        if (scanTimeout) {
          clearTimeout(scanTimeout);
        }
        
        // Set new timeout to process barcode after scanning stops
        const timeout = setTimeout(() => {
          processBarcode(barcodeInput + event.key);
          setBarcodeInput("");
          setIsScanning(false);
        }, 100); // 100ms delay to detect end of scan
        
        setScanTimeout(timeout);
      }
    };

    document.addEventListener('keypress', handleKeyPress);
    return () => {
      document.removeEventListener('keypress', handleKeyPress);
      if (scanTimeout) {
        clearTimeout(scanTimeout);
      }
    };
  }, [barcodeInput, scanTimeout]);

  const processBarcode = async (barcode: string) => {
    if (barcode.length < 8) return; // Minimum barcode length
    
    try {
      // Search for product by barcode
      const response = await productsAPI.findByBarcode(barcode);
      const product = response.data.data;
      
      if (product) {
        // Auto-add to cart regardless of category
        addToCart(product);
        toast.success(`✅ ${product.name} ajouté au panier (Code: ${barcode})`);
        
        // Auto-redirect to cart after successful scan
        setTimeout(() => {
          setCurrentStep('cart');
        }, 1000); // 1 second delay to show success message
        
      } else {
        toast.error(`❌ Aucun produit trouvé pour le code: ${barcode}`);
      }
    } catch (error) {
      toast.error(`❌ Erreur: Code-barres ${barcode} non trouvé`);
    }
  };

  const fetchCategories = async () => {
    try {
      setLoading(true)
      const response = await categoriesAPI.getAll()
      const categoriesData = response.data.data || response.data || []
      setCategories(categoriesData)
      
      if (categoriesData.length === 0) {
        toast.warning('Aucune catégorie trouvée. Veuillez d\'abord créer des catégories.')
      }
    } catch (error: any) {
      toast.error('Erreur lors du chargement des catégories')
      console.error('Error fetching categories:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchProductsByCategory = async (categoryId: number) => {
    try {
      setLoading(true)
      const response = await productsAPI.getAll({ category_id: categoryId })
      const productsData = response.data.data || response.data || []
      setProducts(productsData)
      
      if (productsData.length === 0) {
        toast.warning('Aucun produit trouvé dans cette catégorie.')
      }
    } catch (error: any) {
      toast.error('Erreur lors du chargement des produits')
      console.error('Error fetching products:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCategorySelect = (category: Category) => {
    setSelectedCategory(category)
    fetchProductsByCategory(category.id)
    setCurrentStep('products')
  }

  const addToCart = (product: Product) => {
    const existingItem = cart.find(item => item.product.id === product.id)
    const productPrice = typeof product.price === 'number' ? product.price : parseFloat(product.price || '0')
    
    if (existingItem) {
      // Check if adding one more would exceed stock
      if (existingItem.quantity >= product.stock_quantity) {
        toast.error(`Stock insuffisant pour ${product.name}. Stock disponible: ${product.stock_quantity}`)
        return
      }
      
      const currentUnitPrice = typeof existingItem.unitPrice === 'number' ? existingItem.unitPrice : parseFloat(existingItem.unitPrice || '0')
      setCart(cart.map(item => 
        item.product.id === product.id 
          ? { ...item, quantity: item.quantity + 1, totalPrice: (item.quantity + 1) * currentUnitPrice }
          : item
      ))
    } else {
      // Check if product has stock
      if (product.stock_quantity <= 0) {
        toast.error(`${product.name} est en rupture de stock`)
        return
      }
      
      setCart([...cart, {
        product,
        quantity: 1,
        unitPrice: productPrice,
        totalPrice: productPrice
      }])
    }
    
    toast.success(`${product.name} ajouté au panier`)
  }

  const removeFromCart = (productId: number) => {
    setCart(cart.filter(item => item.product.id !== productId))
  }

  const updateQuantity = (productId: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(productId)
      return
    }
    
    const cartItem = cart.find(item => item.product.id === productId)
    if (cartItem && newQuantity > cartItem.product.stock_quantity) {
      toast.error(`Stock insuffisant. Stock disponible: ${cartItem.product.stock_quantity}`)
      return
    }
    
    setCart(cart.map(item => {
      if (item.product.id === productId) {
        const unitPrice = typeof item.unitPrice === 'number' ? item.unitPrice : parseFloat(item.unitPrice || '0')
        return { ...item, quantity: newQuantity, totalPrice: newQuantity * unitPrice }
      }
      return item
    }))
  }

  const getTotalAmount = () => {
    return cart.reduce((total, item) => {
      const itemTotal = typeof item.totalPrice === 'number' ? item.totalPrice : parseFloat(item.totalPrice || '0')
      return total + itemTotal
    }, 0)
  }

  const safePriceDisplay = (price: number | string) => {
    const numPrice = typeof price === 'number' ? price : parseFloat(price || '0')
    return numPrice.toFixed(2)
  }

  const handleCheckout = async () => {
    if (cart.length === 0) {
      toast.error('Le panier est vide')
      return
    }

    setCheckoutLoading(true)
    
    try {
      // Create a cash transaction for the total amount
      const transactionData = {
        type: 'income' as const,
        amount: getTotalAmount(),
        description: `Ventes de ${cart.length} produit(s)`,
        reference: `TRX-${Date.now()}`,
        payment_method: 'cash',
        transaction_date: new Date().toISOString().split('T')[0],
        notes: `Produits: ${cart.map(item => `${item.product.name} (${item.quantity}x${item.unitPrice} MAD)`).join(', ')}`
      }

      // Create the cash transaction
      await cashTransactionsAPI.create(transactionData)
      
      // Update stock quantities for all products in the cart
      const stockUpdates = cart.map(item => ({
        id: item.product.id,
        stock_quantity: item.product.stock_quantity - item.quantity
      }))
      
      // Use bulk update to reduce stock quantities
      await productsAPI.bulkUpdate(stockUpdates)
      
      toast.success('Vente finalisée avec succès - Stock mis à jour')
      
      // Reset cart and refresh the page for new sale
      setCart([])
      setCurrentStep('categories')
      setSelectedCategory(null)
      // Don't call onSaleComplete - stay on current page
      
      // Actually refresh the page for a clean start
      setTimeout(() => {
        window.location.reload();
      }, 1000); // 1 second delay to show success message
    } catch (error: any) {
      console.error('Error during checkout:', error)
      
      // Provide more specific error messages
      if (error.response?.status === 400) {
        toast.error('Erreur de validation lors de la mise à jour du stock')
      } else if (error.response?.status === 404) {
        toast.error('Un ou plusieurs produits n\'ont pas été trouvés')
      } else if (error.response?.status === 422) {
        toast.error('Données invalides pour la mise à jour du stock')
      } else {
        toast.error('Erreur lors de la création de la vente ou de la mise à jour du stock')
      }
    } finally {
      setCheckoutLoading(false)
    }
  }

  const goBack = () => {
    if (currentStep === 'products') {
      setCurrentStep('categories')
      setSelectedCategory(null)
      setProducts([])
    } else if (currentStep === 'cart') {
      setCurrentStep('products')
    }
  }

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.description?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading && currentStep === 'categories') {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  const generateInvoice = (transactionData: any, cartItems: CartItem[]) => {
    const invoiceContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Facture - ${transactionData.reference}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: 'Courier New', monospace; 
            font-size: 12px; 
            line-height: 1.4; 
            color: #000; 
            background: white;
            width: 80mm; /* Standard thermal printer width */
            margin: 0 auto;
            padding: 5mm;
          }
          .container { width: 100%; }
          .header { 
            text-align: center; 
            border-bottom: 2px solid #000; 
            padding-bottom: 8px; 
            margin-bottom: 8px; 
          }
          .company-name { 
            font-size: 16px; 
            font-weight: bold; 
            margin-bottom: 2px; 
            text-transform: uppercase;
          }
          .company-info { 
            font-size: 10px; 
            margin-bottom: 4px; 
            line-height: 1.2;
          }
          .invoice-title { 
            font-size: 14px; 
            font-weight: bold; 
            margin-top: 4px;
            text-transform: uppercase;
          }
          .section { 
            margin-bottom: 8px; 
            border-bottom: 1px dashed #000; 
            padding-bottom: 4px; 
          }
          .section-title { 
            font-weight: bold; 
            font-size: 11px; 
            margin-bottom: 2px;
            text-transform: uppercase;
          }
          .info-line { 
            margin-bottom: 1px; 
            font-size: 10px; 
          }
          .product-item { 
            margin-bottom: 6px; 
            padding: 3px 0; 
            border-bottom: 1px dotted #ccc; 
          }
          .product-name { 
            font-weight: bold; 
            font-size: 11px; 
            margin-bottom: 1px; 
          }
          .product-details { 
            font-size: 9px; 
            display: flex; 
            justify-content: space-between; 
            margin-bottom: 1px; 
          }
          .product-total { 
            font-weight: bold; 
            font-size: 10px; 
            text-align: right; 
            border-top: 1px solid #000; 
            padding-top: 1px; 
          }
          .total-section { 
            margin-top: 8px; 
            border-top: 2px solid #000; 
            padding-top: 4px; 
            text-align: center; 
          }
          .total-amount { 
            font-size: 14px; 
            font-weight: bold; 
            text-transform: uppercase;
          }
          .footer { 
            margin-top: 8px; 
            text-align: center; 
            font-size: 9px; 
            border-top: 1px dashed #000; 
            padding-top: 4px; 
          }
          .separator { 
            text-align: center; 
            margin: 4px 0; 
            font-size: 8px; 
          }
          @media print { 
            body { margin: 0; padding: 2mm; }
            .container { width: 100%; }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="company-name">SEASON CONTROL</div>
            <div class="company-info">Tél: +212 61 007 0143</div>
            <div class="company-info">R.C.7399 / TP 53506169 / IF 53655471</div>
            <div class="company-info">ICE 003253489000064</div>
            <div class="company-info">site: seasoncontrol.ma</div>
            <div class="invoice-title">FACTURE</div>
          </div>
          
          <div class="section">
            <div class="section-title">Détails Transaction</div>
            <div class="info-line"><strong>Date:</strong> ${new Date(transactionData.transaction_date).toLocaleDateString('fr-FR')}</div>
            <div class="info-line"><strong>Heure:</strong> ${new Date().toLocaleTimeString('fr-FR')}</div>
            <div class="info-line"><strong>Référence:</strong> ${transactionData.reference}</div>
          </div>
          
          <div class="section">
            <div class="section-title">Articles</div>
            ${cartItems.map(item => `
              <div class="product-item">
                <div class="product-name">${item.product.name}</div>
                <div class="product-details">
                  <span>Prix: ${safePriceDisplay(item.unitPrice)} MAD</span>
                  <span>Qté: ${item.quantity}</span>
                </div>
                <div class="product-total">Sous-total: ${safePriceDisplay(item.totalPrice)} MAD</div>
              </div>
            `).join('')}
          </div>
          
          <div class="total-section">
            <div class="total-amount">TOTAL: ${safePriceDisplay(transactionData.amount)} MAD</div>
          </div>
          
          <div class="separator">━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</div>
          
          <div class="footer">
            <div><strong>Merci pour votre achat!</strong></div>
            <div>Facture générée le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}</div>
            <div>Conservez cette facture pour toute question</div>
          </div>
        </div>
      </body>
      </html>
    `;
    
    return invoiceContent;
  };

  const downloadInvoice = (transactionData: any, cartItems: CartItem[]) => {
    const invoiceContent = generateInvoice(transactionData, cartItems);
    const blob = new Blob([invoiceContent], { type: 'text/html' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `facture-${transactionData.reference}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const printInvoice = (transactionData: any, cartItems: CartItem[]) => {
    const invoiceContent = generateInvoice(transactionData, cartItems);
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(invoiceContent);
      printWindow.document.close();
      printWindow.print();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {currentStep !== 'categories' && (
            <Button variant="outline" onClick={goBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Button>
          )}
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {currentStep === 'categories' && 'Sélectionner une catégorie'}
            {currentStep === 'products' && `Produits - ${selectedCategory?.name}`}
            {currentStep === 'cart' && 'Panier de vente'}
          </h1>
          {isScanning && (
            <Badge variant="default" className="bg-green-500 text-white animate-pulse">
              🔍 SCANNING
            </Badge>
          )}
        </div>
        
        {currentStep !== 'categories' && (
          <Button 
            onClick={() => setCurrentStep('cart')}
            className="relative"
          >
            <ShoppingCart className="h-4 w-4 mr-2" />
            Panier
            {cart.length > 0 && (
              <Badge className="ml-2 bg-red-500 text-white">
                {cart.length}
              </Badge>
            )}
          </Button>
        )}
      </div>

      {/* Categories Step */}
      {currentStep === 'categories' && (
        <div className="space-y-6">
          {categories.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-500 mb-4">
                <ShoppingCart className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium">Aucune catégorie disponible</p>
                <p className="text-sm">Veuillez d'abord créer des catégories et des produits pour utiliser cette fonctionnalité.</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {categories.map((category) => (
                <Card 
                  key={category.id} 
                  className="cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => handleCategorySelect(category)}
                >
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <div 
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: category.color || '#3b82f6' }}
                      />
                      <span>{category.name}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {category.description || 'Aucune description'}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Products Step */}
      {currentStep === 'products' && (
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder={isScanning ? "Scanning en cours..." : "Rechercher des produits ou scanner un code-barres..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
              disabled={isScanning}
            />
            {isScanning && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-xs text-green-600 font-medium">SCAN</span>
                </div>
              </div>
            )}
          </div>
          
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-500 mb-4">
                <ShoppingCart className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium">Aucun produit trouvé</p>
                <p className="text-sm">Cette catégorie ne contient aucun produit pour le moment.</p>
              </div>
              <Button variant="outline" onClick={goBack}>
                Retour aux catégories
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProducts.map((product) => (
                <Card key={product.id} className="relative">
                  <CardHeader>
                    <CardTitle className="text-lg">{product.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {product.description || 'Aucune description'}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold text-green-600">
                        {safePriceDisplay(product.price)} MAD
                      </span>
                      <Badge variant={product.stock_quantity > 0 ? 
                        (product.stock_quantity <= product.minimum_stock ? 'destructive' : 'default') : 
                        'destructive'}>
                        Stock: {product.stock_quantity}
                      </Badge>
                    </div>
                    {product.stock_quantity <= product.minimum_stock && product.stock_quantity > 0 && (
                      <p className="text-xs text-orange-600 dark:text-orange-400">
                        ⚠️ Stock faible
                      </p>
                    )}
                    {product.stock_quantity === 0 && (
                      <p className="text-xs text-red-600 dark:text-red-400">
                        ❌ Rupture de stock
                      </p>
                    )}
                    <Button 
                      onClick={() => addToCart(product)}
                      disabled={product.stock_quantity <= 0}
                      className="w-full"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      {product.stock_quantity <= 0 ? 'Rupture de stock' : 'Ajouter au panier'}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Cart Step */}
      {currentStep === 'cart' && (
        <div className="space-y-6">
          {/* Cart Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Produits sélectionnés</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Barcode Scanner Status for Cart */}
              <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-sm font-medium text-green-700 dark:text-green-300">
                      Scanner actif dans le panier
                    </span>
                  </div>
                  <div className="text-xs text-green-600 dark:text-green-400">
                    Scannez pour ajouter plus de produits
                  </div>
                </div>
              </div>
              {cart.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Produit</TableHead>
                      <TableHead>Prix unitaire</TableHead>
                      <TableHead>Stock disponible</TableHead>
                      <TableHead>Quantité</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cart.map((item) => (
                      <TableRow key={item.product.id}>
                        <TableCell className="font-medium">
                          {item.product.name}
                        </TableCell>
                        <TableCell>{safePriceDisplay(item.unitPrice)} MAD</TableCell>
                        <TableCell>
                          <Badge variant={item.product.stock_quantity <= item.product.minimum_stock ? 'destructive' : 'default'}>
                            {item.product.stock_quantity}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="w-8 text-center">{item.quantity}</span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                              disabled={item.quantity >= item.product.stock_quantity}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell className="font-bold">
                          {safePriceDisplay(item.totalPrice)} MAD
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => removeFromCart(item.product.id)}
                          >
                            Supprimer
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  Le panier est vide
                </div>
              )}
            </CardContent>
          </Card>

          {cart.length > 0 && (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between text-xl font-bold">
                  <span>Total:</span>
                  <span className="text-green-600">{safePriceDisplay(getTotalAmount())} MAD</span>
                </div>
                                
                <Button 
                  onClick={handleCheckout}
                  className="w-full mt-4"
                  size="lg"
                  disabled={cart.some(item => item.quantity > item.product.stock_quantity) || checkoutLoading}
                >
                  {checkoutLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Finalisation en cours...
                    </>
                  ) : (
                    'Finaliser la vente'
                  )}
                </Button>
                
                {/* Invoice Actions */}
                {cart.length > 0 && (
                  <div className="flex space-x-2 mt-4">
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        const transactionData = {
                          reference: `TRX-${Date.now()}`,
                          transaction_date: new Date().toISOString().split('T')[0],
                          amount: getTotalAmount()
                        };
                        downloadInvoice(transactionData, cart);
                      }}
                      className="flex-1"
                    >
                      📄 Télécharger Facture
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        const transactionData = {
                          reference: `TRX-${Date.now()}`,
                          transaction_date: new Date().toISOString().split('T')[0],
                          amount: getTotalAmount()
                        };
                        printInvoice(transactionData, cart);
                      }}
                      className="flex-1"
                    >
                      🖨️ Imprimer Facture
                    </Button>
                  </div>
                )}
                {cart.some(item => item.quantity > item.product.stock_quantity) && (
                  <p className="text-sm text-red-600 text-center mt-2">
                    ⚠️ Certains produits ont un stock insuffisant pour finaliser la vente
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
