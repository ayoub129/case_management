"use client"

import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Truck, Loader2, Trash2, Minus, Plus } from 'lucide-react'
import { purchasesAPI, productsAPI, suppliersAPI, categoriesAPI } from '@/lib/api'

interface Product {
  id: number
  name: string
  cost_price: number | string
  stock_quantity: number
  category?: {
    id: number
    name: string
  }
}

interface Supplier {
  id: number
  name: string
  email?: string
  phone?: string
}

interface Category {
  id: number
  name: string
}

interface CartItem {
  product: Product
  quantity: number
  unit_cost: number
  shipping_cost: number
  tax: number
  total_cost: number
}

interface BulkPurchaseForm {
  supplier_id: string
  payment_method: string
  order_date: string
  expected_delivery_date: string
  notes: string
  items: CartItem[]
}

export function BulkPurchases() {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [products, setProducts] = useState<Product[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [cart, setCart] = useState<CartItem[]>([])

  const [formData, setFormData] = useState<BulkPurchaseForm>({
    supplier_id: '',
    payment_method: 'bank_transfer',
    order_date: new Date().toISOString().split('T')[0],
    expected_delivery_date: new Date().toISOString().split('T')[0],
    notes: '',
    items: []
  })

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || product.category?.id.toString() === selectedCategory
    return matchesSearch && matchesCategory
  })

  useEffect(() => {
    if (isOpen) {
      fetchProducts()
      fetchSuppliers()
      fetchCategories()
    }
  }, [isOpen])

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

  const fetchSuppliers = async () => {
    try {
      const response = await suppliersAPI.getAll()
      let suppliersData = response.data?.data || []
      if (suppliersData && suppliersData.suppliers) {
        suppliersData = suppliersData.suppliers.data || suppliersData.suppliers
      } else if (suppliersData && suppliersData.data) {
        suppliersData = suppliersData.data
      }
      if (Array.isArray(suppliersData)) {
        setSuppliers(suppliersData)
      } else {
        console.error('Suppliers data is not an array:', suppliersData)
        setSuppliers([])
      }
    } catch (error) {
      console.error('Error fetching suppliers:', error)
      setSuppliers([])
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

  const handleSupplierChange = (supplierId: string) => {
    setFormData({
      ...formData,
      supplier_id: supplierId
    })
  }

  const addToCart = (product: Product) => {
    const existingItem = cart.find(item => item.product.id === product.id)
    const productCost = parseFloat(product.cost_price.toString()) || 0
    
    if (existingItem) {
      // Update quantity if already in cart
      setCart(cart.map(item => 
        item.product.id === product.id 
          ? { 
              ...item, 
              quantity: item.quantity + 1, 
              total_cost: (item.quantity + 1) * item.unit_cost + item.shipping_cost + item.tax 
            }
          : item
      ))
    } else {
      // Add new item to cart
      setCart([...cart, {
        product,
        quantity: 1,
        unit_cost: productCost,
        shipping_cost: 0,
        tax: 0,
        total_cost: productCost
      }])
    }
  }

  const handleBarcodeScan = async (barcode: string) => {
    
    try {
      // Search for product by barcode
      const response = await productsAPI.findByBarcode(barcode)
      const product = response.data.data
      
      if (product) {
        // Auto-add the product to cart
        addToCart(product)
        // Clear the search input
        setSearchTerm('')
        console.log(`✅ Produit ajouté: ${product.name} (Code: ${barcode})`)
      } else {
        console.log(`❌ Aucun produit trouvé pour le code: ${barcode}`)
        // Clear the input even if product not found
        setSearchTerm('')
      }
    } catch (error) {
      console.log(`❌ Erreur: Code-barres produit ${barcode} non trouvé`)
      // Clear the input even if error
      setSearchTerm('')
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
          total_cost: newQuantity * item.unit_cost + item.shipping_cost + item.tax
        }
      }
      return item
    }))
  }

  const updateUnitCost = (productId: number, unitCost: number) => {
    setCart(cart.map(item => {
      if (item.product.id === productId) {
        return {
          ...item,
          unit_cost: unitCost,
          total_cost: item.quantity * unitCost + item.shipping_cost + item.tax
        }
      }
      return item
    }))
  }

  const updateShippingCost = (productId: number, shippingCost: number) => {
    setCart(cart.map(item => {
      if (item.product.id === productId) {
        return {
          ...item,
          shipping_cost: shippingCost,
          total_cost: item.quantity * item.unit_cost + shippingCost + item.tax
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
          total_cost: item.quantity * item.unit_cost + item.shipping_cost + tax
        }
      }
      return item
    }))
  }

  const removeFromCart = (productId: number) => {
    setCart(cart.filter(item => item.product.id !== productId))
  }

  const getTotalAmount = () => {
    return cart.reduce((total, item) => total + item.total_cost, 0)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.supplier_id || cart.length === 0) {
      // Don't show alert, just return silently
      return
    }

    setLoading(true)
    try {
      const purchasesData = cart.map(item => ({
        supplier_id: parseInt(formData.supplier_id),
        product_id: item.product.id,
        quantity: item.quantity,
        unit_cost: item.unit_cost,
        shipping_cost: item.shipping_cost,
        tax: item.tax,
        total_cost: item.total_cost,
        payment_method: formData.payment_method,
        order_date: formData.order_date,
        expected_delivery_date: formData.expected_delivery_date,
        notes: formData.notes
      }))

      await purchasesAPI.bulkCreate({ purchases: purchasesData })
      setIsOpen(false)
      setCart([])
      setFormData({
        supplier_id: '',
        payment_method: 'bank_transfer',
        order_date: new Date().toISOString().split('T')[0],
        expected_delivery_date: new Date().toISOString().split('T')[0],
        notes: '',
        items: []
      })
      alert('Achat en lot créé avec succès!')
    } catch (error) {
      console.error('Error creating purchase:', error)
      alert('Erreur lors de la création de l\'achat')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Truck className="h-4 w-4 mr-2" />
          Achat en Lot
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Achat en Lot - Multiple Produits</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Product Selection Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Sélection des Produits</h3>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <Label>Rechercher des produits</Label>
                <Input
                  placeholder="Nom du produit ou code-barres..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value)
                    // Check if input looks like a barcode (all digits and at least 8 characters)
                    if (e.target.value.match(/^\d{8,}$/)) {
                      // Auto-add product when barcode is detected
                      handleBarcodeScan(e.target.value)
                    }
                  }}
                  className="mt-1"
                />
                <div className="text-xs text-gray-500 mt-1">
                  💡 Tapez le nom du produit ou scannez le code-barres pour ajout automatique
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
                      <p className="font-semibold">{(parseFloat(product.cost_price.toString()) || 0).toFixed(2)} MAD</p>
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
                      <div className="grid grid-cols-5 gap-2 text-sm">
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
                          <Input
                            type="number"
                            value={item.unit_cost}
                            onChange={(e) => updateUnitCost(item.product.id, parseFloat(e.target.value) || 0)}
                            className="h-8 text-sm"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Frais de port</Label>
                          <Input
                            type="number"
                            value={item.shipping_cost}
                            onChange={(e) => updateShippingCost(item.product.id, parseFloat(e.target.value) || 0)}
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
                        <div>
                          <Label className="text-xs">Total</Label>
                          <p className="font-semibold">{(parseFloat(item.total_cost.toString()) || 0).toFixed(2)} MAD</p>
                        </div>
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

          {/* Supplier Information Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Informations Fournisseur</h3>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="supplier">Fournisseur *</Label>
                <Select value={formData.supplier_id} onValueChange={handleSupplierChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un fournisseur" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.isArray(suppliers) && suppliers.map((supplier) => (
                      <SelectItem key={supplier.id} value={supplier.id.toString()}>
                        {supplier.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="payment_method">Méthode de paiement</Label>
                <Select value={formData.payment_method} onValueChange={(value) => setFormData({ ...formData, payment_method: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bank_transfer">Virement</SelectItem>
                    <SelectItem value="check">Chèque</SelectItem>
                    <SelectItem value="cash">Espèces</SelectItem>
                    <SelectItem value="card">Carte</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="order_date">Date de commande</Label>
                <Input
                  id="order_date"
                  type="date"
                  value={formData.order_date}
                  onChange={(e) => setFormData({ ...formData, order_date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expected_delivery_date">Date de livraison prévue</Label>
                <Input
                  id="expected_delivery_date"
                  type="date"
                  value={formData.expected_delivery_date}
                  onChange={(e) => setFormData({ ...formData, expected_delivery_date: e.target.value })}
                />
              </div>
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

          {/* Action Buttons */}
          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
              Annuler
            </Button>
            <Button 
              type="submit" 
              disabled={loading || cart.length === 0}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Création...
                </>
              ) : (
                <>
                  <Truck className="h-4 w-4 mr-2" />
                  Créer l'Achat ({cart.length} produits)
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
