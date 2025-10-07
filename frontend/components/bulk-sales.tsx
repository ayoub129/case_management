"use client"

import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Plus, Loader2, Trash2, Minus, Scan } from 'lucide-react'
import { salesAPI, productsAPI, customersAPI, categoriesAPI } from '@/lib/api'
import { toast } from 'sonner'

interface Customer {
  id: number
  name: string
  email?: string
  phone?: string
  is_loyalty?: boolean
  loyalty_points?: number
}

interface Product {
  id: number
  name: string
  price: number | string
  loyalty_price?: number | string
  stock_quantity: number
  category?: {
    id: number
    name: string
  }
}

interface Category {
  id: number
  name: string
}

interface CartItem {
  product: Product
  quantity: number
  unit_price: number
  discount: number
  tax: number
  total_amount: number
}

interface BulkSaleForm {
  customer_id: string
  payment_method: string
  sale_date: string
  notes: string
  items: CartItem[]
}

export function BulkSales() {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [products, setProducts] = useState<Product[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [cart, setCart] = useState<CartItem[]>([])
  const [customerSearchTerm, setCustomerSearchTerm] = useState('')
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false)
  const [productBarcodeInput, setProductBarcodeInput] = useState('')
  const [customerBarcodeInput, setCustomerBarcodeInput] = useState('')
  const [isScanningProduct, setIsScanningProduct] = useState(false)
  const [isScanningCustomer, setIsScanningCustomer] = useState(false)
  const [barcodeScanTimeout, setBarcodeScanTimeout] = useState<NodeJS.Timeout | null>(null)
  const [clientError, setClientError] = useState('')

  const [formData, setFormData] = useState<BulkSaleForm>({
    customer_id: '',
    payment_method: 'cash',
    sale_date: new Date().toISOString().split('T')[0],
    notes: '',
    items: []
  })

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         (product as any).barcode?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || product.category?.id.toString() === selectedCategory
    return matchesSearch && matchesCategory
  })

  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = customer.name.toLowerCase().includes(customerSearchTerm.toLowerCase()) ||
                         (customer as any).barcode?.toLowerCase().includes(customerSearchTerm.toLowerCase()) ||
                         customer.phone?.toLowerCase().includes(customerSearchTerm.toLowerCase())
    return matchesSearch
  })

  const resetForm = () => {
    setCart([])
    setFormData({
      customer_id: '',
      payment_method: 'cash',
      sale_date: new Date().toISOString().split('T')[0],
      notes: '',
      items: []
    })
    setSearchTerm('')
    setSelectedCategory('all')
    setCustomerSearchTerm('')
    setShowCustomerDropdown(false)
    setProductBarcodeInput('')
    setCustomerBarcodeInput('')
    setIsScanningProduct(false)
    setIsScanningCustomer(false)
    setClientError('')
  }

  useEffect(() => {
    if (isOpen) {
      fetchProducts()
      fetchCustomers()
      fetchCategories()
      resetForm() // Reset form when dialog opens
    }
  }, [isOpen])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (barcodeScanTimeout) {
        clearTimeout(barcodeScanTimeout)
      }
    }
  }, [barcodeScanTimeout])

  const fetchProducts = async () => {
    try {
      const response = await productsAPI.getAll()
      let productsData = response.data?.data || []
      if (productsData && productsData.data) {
        productsData = productsData.data
      }
      if (Array.isArray(productsData)) {
        setProducts(productsData)
      } else {
        console.error('Products data is not an array:', productsData)
        setProducts([])
      }
    } catch (error) {
      console.error('Error fetching products:', error)
      setProducts([])
    }
  }

  const fetchCustomers = async () => {
    try {
      const response = await customersAPI.getAll()
      let customersData = response.data?.data || []
      if (customersData && customersData.data) {
        customersData = customersData.data
      }
      if (Array.isArray(customersData)) {
        setCustomers(customersData)
      } else {
        console.error('Customers data is not an array:', customersData)
        setCustomers([])
      }
    } catch (error) {
      console.error('Error fetching customers:', error)
      setCustomers([])
    }
  }

  const fetchCategories = async () => {
    try {
      const response = await categoriesAPI.getAll()
      let categoriesData = response.data?.data || []
      if (categoriesData && categoriesData.data) {
        categoriesData = categoriesData.data
      }
      if (Array.isArray(categoriesData)) {
        setCategories(categoriesData)
      } else {
        console.error('Categories data is not an array:', categoriesData)
        setCategories([])
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
      setCategories([])
    }
  }

  // Update cart prices when customer changes
  const handleCustomerChange = (customerId: string) => {
    const selectedCustomer = customers.find(c => c.id.toString() === customerId)
    
    setFormData({
      ...formData,
      customer_id: customerId
    })

    // Clear client error when customer is selected
    if (customerId) {
      setClientError('')
    }

    // Update cart prices when customer changes (including when customer is removed)
    if (cart.length > 0) {
      setCart(cart.map(item => {
        const newUnitPrice = getProductPrice(item.product, customerId)
        
        return {
          ...item,
          unit_price: newUnitPrice,
          total_amount: item.quantity * newUnitPrice - item.discount + item.tax
        }
      }))
    }
  }

  const handleCustomerSelect = (customer: Customer) => {
    setFormData({ ...formData, customer_id: customer.id.toString() })
    setCustomerSearchTerm(customer.name)
    setShowCustomerDropdown(false)
    setClientError('') // Clear client error when customer is selected
    
    // Update prices for all cart items when customer changes
    setCart(cart.map(item => {
      const newPrice = getProductPrice(item.product, customer.id.toString())
      return {
        ...item,
        unit_price: newPrice,
        total_amount: item.quantity * newPrice - item.discount + item.tax
      }
    }))
  }

  // Get correct price for a product based on customer loyalty status
  const getProductPrice = (product: Product, customerId?: string) => {
    const customerIdToUse = customerId || formData.customer_id
    const selectedCustomer = customers.find(c => c.id.toString() === customerIdToUse)
    let productPrice = parseFloat(product.price.toString()) || 0
    
    // Use loyalty price if customer is in loyalty program and product has loyalty price
    if (selectedCustomer?.is_loyalty && product.loyalty_price) {
      productPrice = parseFloat(product.loyalty_price.toString()) || productPrice
    }
    
    return productPrice
  }

  const addToCart = (product: Product) => {
    const existingItem = cart.find(item => item.product.id === product.id)
    const productPrice = getProductPrice(product, formData.customer_id)
    
    if (existingItem) {
      // Update quantity if already in cart
      setCart(cart.map(item => 
        item.product.id === product.id 
          ? { 
              ...item, 
              quantity: item.quantity + 1, 
              unit_price: productPrice, // Update with current loyalty price
              total_amount: (item.quantity + 1) * productPrice - item.discount + item.tax 
            }
          : item
      ))
    } else {
      // Add new item to cart
      setCart([...cart, {
        product,
        quantity: 1,
        unit_price: productPrice,
        discount: 0,
        tax: 0,
        total_amount: productPrice
      }])
    }
  }

  const handleBarcodeScan = async (barcode: string) => {
    try {
      // Only scan if barcode is at least 8 digits and we're in the product search field
      if (barcode.length < 8 || !barcode.match(/^\d+$/)) {
        return
      }

      // Search for product by barcode
      const response = await productsAPI.findByBarcode(barcode)
      const product = response.data.data
      
      if (product) {
        // Auto-add the product to cart
        addToCart(product)
        // Clear the search input
        setSearchTerm('')
        toast.success(`✅ Produit ajouté: ${product.name}`)
      } else {
        toast.error(`❌ Aucun produit trouvé pour le code: ${barcode}`)
        // Clear the input even if product not found
        setSearchTerm('')
      }
    } catch (error: any) {
      console.error('Barcode scan error:', error)
      toast.error(`❌ Erreur lors de la recherche du produit: ${barcode}`)
      // Clear the input even if error
      setSearchTerm('')
    }
  }

  const simulateBarcodeScan = async () => {
    const testBarcode = '4044197980611'
    const input = document.querySelector('input[placeholder="Nom du produit ou code-barres..."]') as HTMLInputElement
    
    if (input) {
      // Set the value
      input.value = testBarcode
      setSearchTerm(testBarcode)
      
      // Fire keyup event to simulate real barcode scanner
      const keyupEvent = new KeyboardEvent('keyup', {
        key: 'Enter',
        code: 'Enter',
        keyCode: 13,
        which: 13,
        bubbles: true,
        cancelable: true
      })
      
      input.dispatchEvent(keyupEvent)
      
      // Also fire change event
      const changeEvent = new Event('change', {
        bubbles: true,
        cancelable: true
      })
      
      input.dispatchEvent(changeEvent)
      
      // Trigger the barcode scan
      await handleBarcodeScan(testBarcode)
    }
  }

  const updateQuantity = (productId: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(productId)
      return
    }

    setCart(cart.map(item => {
      if (item.product.id === productId) {
        return {
          ...item,
          quantity: newQuantity,
          total_amount: newQuantity * item.unit_price - item.discount + item.tax
        }
      }
      return item
    }))
  }

  const updateDiscount = (productId: number, discount: number) => {
    setCart(cart.map(item => {
      if (item.product.id === productId) {
        return {
          ...item,
          discount: discount,
          total_amount: item.quantity * item.unit_price - discount + item.tax
        }
      }
      return item
    }))
  }

  const updateTax = (productId: number, tax: number) => {
    setCart(cart.map(item => {
      if (item.product.id === productId) {
        return {
          ...item,
          tax: tax,
          total_amount: item.quantity * item.unit_price - item.discount + tax
        }
      }
      return item
    }))
  }

  const updateUnitPrice = (productId: number, unitPrice: number) => {
    setCart(cart.map(item => {
      if (item.product.id === productId) {
        return {
          ...item,
          unit_price: unitPrice,
          total_amount: item.quantity * unitPrice - item.discount + item.tax
        }
      }
      return item
    }))
  }

  const removeFromCart = (productId: number) => {
    setCart(cart.filter(item => item.product.id !== productId))
  }

  const getTotalAmount = () => {
    return cart.reduce((total, item) => total + item.total_amount, 0)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate that client is selected
    if (!formData.customer_id) {
      setClientError('Veuillez sélectionner un client')
      return
    }
    
    if (cart.length === 0) {
      // Don't show alert, just return silently
      return
    }

    setLoading(true)
    try {
      const selectedCustomer = customers.find(c => c.id.toString() === formData.customer_id)
      
      const salesData = cart.map(item => {
        const saleData: any = {
          product_id: item.product.id,
          quantity: item.quantity,
          unit_price: item.unit_price,
          discount: item.discount,
          tax: item.tax,
          total_amount: item.total_amount,
          customer_name: selectedCustomer?.name || 'Client anonyme',
          payment_method: formData.payment_method,
          sale_date: formData.sale_date,
          notes: formData.notes
        }

        // Only include customer_id if a customer is selected
        if (formData.customer_id) {
          saleData.customer_id = parseInt(formData.customer_id)
        }

        // Only include customer email and phone if customer is selected
        if (selectedCustomer?.email) {
          saleData.customer_email = selectedCustomer.email
        }
        if (selectedCustomer?.phone) {
          saleData.customer_phone = selectedCustomer.phone
        }

        return saleData
      })

      await salesAPI.bulkCreate({ sales: salesData })
      setIsOpen(false)
      resetForm() // Use the reset function
    } catch (error: any) {
      console.error('Error creating sale:', error)
      toast.error(error.response?.data?.message || 'Erreur lors de la création de la vente')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Vente en Lot
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Vente en Lot - Multiple Produits</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Product Selection Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Sélection des Produits</h3>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <Label>Rechercher des produits</Label>
                <div className="relative mt-1">
                  <Input
                    placeholder="Nom du produit ou code-barres..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value)
                      
                      // Clear existing timeout
                      if (barcodeScanTimeout) {
                        clearTimeout(barcodeScanTimeout)
                      }
                      
                      // Check if input looks like a barcode (all digits and at least 8 characters)
                      if (e.target.value.match(/^\d{8,}$/)) {
                        // Debounce barcode scan to prevent multiple API calls
                        const timeout = setTimeout(() => {
                          handleBarcodeScan(e.target.value)
                        }, 500) // 500ms delay
                        setBarcodeScanTimeout(timeout)
                      }
                    }}
                    onKeyUp={(e) => {
                      // Also trigger on keyup for more responsive barcode scanning
                      const target = e.target as HTMLInputElement
                      if (target.value.match(/^\d{8,}$/)) {
                        // Clear existing timeout
                        if (barcodeScanTimeout) {
                          clearTimeout(barcodeScanTimeout)
                        }
                        
                        // Debounce barcode scan to prevent multiple API calls
                        const timeout = setTimeout(() => {
                          handleBarcodeScan(target.value)
                        }, 300) // Shorter delay for keyup
                        setBarcodeScanTimeout(timeout)
                      }
                    }}
                    ref={(input) => {
                      if (input) {
                        // Store ref for focus functionality
                        (window as any).productSearchInput = input
                      }
                    }}
                  />
                </div>
              </div>

              <div>
                <Label>Catégorie</Label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Toutes les catégories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes les catégories</SelectItem>
                    {Array.isArray(categories) && categories.map((category) => (
                      <SelectItem key={category.id} value={category.id.toString()}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="max-h-64 overflow-y-auto border rounded-md p-3">
              <div className="space-y-2">
                {Array.isArray(filteredProducts) && filteredProducts.map((product) => (
                  <div key={product.id} className="flex justify-between items-center p-3 border rounded-md hover:bg-gray-50 cursor-pointer" onClick={() => addToCart(product)}>
                    <div className="flex-1">
                      <h4 className="font-medium">{product.name}</h4>
                      <p className="text-sm text-gray-600">{product.category?.name}</p>
                      <p className="text-sm text-gray-500">Stock: {product.stock_quantity}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{(getProductPrice(product, formData.customer_id) || 0).toFixed(2)} MAD</p>
                      {product.loyalty_price && (
                        <p className="text-xs text-green-600">
                          Fidélité: {(parseFloat(product.loyalty_price.toString()) || 0).toFixed(2)} MAD
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Cart Section */}
          {cart.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Panier ({cart.length} produits)</h3>
              
              <div className="border rounded-md p-4">
                <div className="space-y-3">
                  {Array.isArray(cart) && cart.map((item) => (
                    <div key={item.product.id} className="p-3 border rounded-md bg-gray-50">
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="font-medium">{item.product.name}</h4>
                        <Button
                          type="button"
                          size="sm"
                          variant="destructive"
                          onClick={() => removeFromCart(item.product.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-4 gap-2 text-sm">
                        <div>
                          <Label className="text-xs">Quantité</Label>
                          <div className="flex items-center space-x-1">
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="w-8 text-center">{item.quantity}</span>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        <div>
                          <Label className="text-xs">Prix unitaire</Label>
                          <div className="relative">
                            <Input
                              type="number"
                              value={item.unit_price}
                              onChange={(e) => updateUnitPrice(item.product.id, parseFloat(e.target.value) || 0)}
                              className="h-8 text-sm"
                            />
                            {(() => {
                              const selectedCustomer = customers.find(c => c.id.toString() === formData.customer_id)
                              const isLoyaltyPrice = selectedCustomer?.is_loyalty && item.product.loyalty_price && 
                                parseFloat(item.unit_price.toString()) === parseFloat(item.product.loyalty_price.toString())
                              
                              return isLoyaltyPrice ? (
                                <div className="absolute right-1 top-1/2 transform -translate-y-1/2">
                                  <span className="text-xs bg-green-100 text-green-800 px-1 py-0.5 rounded text-[10px]">
                                    F
                                  </span>
                                </div>
                              ) : null
                            })()}
                          </div>
                        </div>
                        <div>
                          <Label className="text-xs">Remise</Label>
                          <Input
                            type="number"
                            value={item.discount}
                            onChange={(e) => updateDiscount(item.product.id, parseFloat(e.target.value) || 0)}
                            className="h-8 text-sm"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Taxe</Label>
                          <Input
                            type="number"
                            value={item.tax}
                            onChange={(e) => updateTax(item.product.id, parseFloat(e.target.value) || 0)}
                            className="h-8 text-sm"
                          />
                        </div>
                      </div>
                      <div className="text-right mt-2">
                        <p className="font-semibold">{(parseFloat(item.total_amount.toString()) || 0).toFixed(2)} MAD</p>
                      </div>
                    </div>
                  ))}
                  
                  <div className="border-t pt-3">
                    <div className="flex justify-between items-center text-lg font-semibold">
                      <span>Total:</span>
                      <span>{(getTotalAmount() || 0).toFixed(2)} MAD</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Customer Information Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Informations Client</h3>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="space-y-2 relative">
                <Label htmlFor="customer">Client <span className="text-red-500">*</span></Label>
                <div className="relative">
                  <Input
                    placeholder="Nom, téléphone ou code-barres du client..."
                    value={customerSearchTerm}
                    onChange={(e) => {
                      setCustomerSearchTerm(e.target.value)
                      setShowCustomerDropdown(true)
                      if (!e.target.value) {
                        setFormData({ ...formData, customer_id: '' })
                        setClientError('') // Clear error when user starts typing
                        // Update prices when customer is removed
                        if (cart.length > 0) {
                          setCart(cart.map(item => {
                            const newUnitPrice = getProductPrice(item.product, '')
                            
                            return {
                              ...item,
                              unit_price: newUnitPrice,
                              total_amount: item.quantity * newUnitPrice - item.discount + item.tax
                            }
                          }))
                        }
                      }
                    }}
                    onFocus={() => setShowCustomerDropdown(true)}
                    onBlur={() => setTimeout(() => setShowCustomerDropdown(false), 200)}
                    className={clientError ? 'border-red-500 focus:border-red-500' : ''}
                  />
                  {showCustomerDropdown && customerSearchTerm && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-48 overflow-y-auto">
                      {filteredCustomers.length > 0 ? (
                        filteredCustomers.map((customer) => (
                          <div
                            key={customer.id}
                            className="px-3 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                            onClick={() => handleCustomerSelect(customer)}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="font-medium">{customer.name}</div>
                                {customer.phone && (
                                  <div className="text-sm text-gray-500">Tél: {customer.phone}</div>
                                )}
                                {(customer as any).barcode && (
                                  <div className="text-sm text-gray-500">Code: {(customer as any).barcode}</div>
                                )}
                              </div>
                              {customer.is_loyalty && (
                                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                                  Fidélité
                                </span>
                              )}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="px-3 py-2 text-gray-500 text-sm">
                          Aucun client trouvé
                        </div>
                      )}
                    </div>
                  )}
                </div>
                {clientError && (
                  <p className="text-sm text-red-500 mt-1">{clientError}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="payment_method">Méthode de paiement</Label>
                <Select value={formData.payment_method} onValueChange={(value) => setFormData({ ...formData, payment_method: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Espèces</SelectItem>
                    <SelectItem value="card">Carte</SelectItem>
                    <SelectItem value="transfer">Virement</SelectItem>
                    <SelectItem value="check">Chèque</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sale_date">Date de vente</Label>
                <Input
                  id="sale_date"
                  type="date"
                  value={formData.sale_date}
                  onChange={(e) => setFormData({ ...formData, sale_date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Notes additionnelles..."
                  rows={3}
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
              Annuler
            </Button>
            <Button 
              type="submit" 
              disabled={loading || cart.length === 0 || !formData.customer_id}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Création...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Créer la Vente ({cart.length} produits)
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
