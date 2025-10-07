"use client"

import { useState, useEffect } from "react"
import { useLanguage } from "@/components/language-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Plus, Search, Edit, Trash2, Scan, Loader2, Upload } from "lucide-react"
import { productsAPI, categoriesAPI } from "@/lib/api"
import { toast } from "sonner"

interface Product {
  id: number
  name: string
  description?: string
  price: number
  loyalty_price?: number
  cost_price: number
  barcode?: string
  sku?: string
  stock_quantity: number
  minimum_stock: number
  photo_path?: string
  photo_url?: string
  category: {
    id: number
    name: string
    color: string
  }
  is_active: boolean
  created_at: string
}

interface Category {
  id: number
  name: string
  color: string
}

export function ProductManagement() {
  const { t } = useLanguage()
  const [searchTerm, setSearchTerm] = useState("")
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("")
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [perPage, setPerPage] = useState(15)
  const [pagination, setPagination] = useState<any>(null)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    loyalty_price: "",
    cost_price: "",
    barcode: "",
    sku: "",
    stock_quantity: "",
    minimum_stock: "",
    category_id: "",
    is_active: true,
  })
  const [photoFile, setPhotoFile] = useState<File | null>(null)

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
      setCurrentPage(1) // Reset to first page when searching
    }, 500)

    return () => clearTimeout(timer)
  }, [searchTerm])

  useEffect(() => {
    fetchProducts()
    fetchCategories()
  }, [currentPage, perPage, debouncedSearchTerm])

  const fetchProducts = async () => {
    try {
      setLoading(true)
      const response = await productsAPI.getAll({ 
        page: currentPage, 
        per_page: perPage,
        search: debouncedSearchTerm 
      })
      
      // Handle paginated response
      const responseData = response.data
      let productsData = responseData.data || []
      let paginationData = null
      
      // Extract pagination metadata from Laravel pagination response
      if (responseData.data && typeof responseData.data === 'object' && responseData.data.current_page !== undefined) {
        // Laravel pagination response structure (nested in data.data)
        paginationData = responseData.data
        productsData = responseData.data.data || []
      } else if (responseData.current_page !== undefined) {
        // Direct pagination response
        paginationData = responseData
        productsData = responseData.data || []
      }
      
      if (Array.isArray(productsData)) {
        setProducts(productsData)
      } else {
        console.error('Products data is not an array:', productsData)
        setProducts([])
      }
      
      // Set pagination data
      if (paginationData) {
        setPagination({
          current_page: paginationData.current_page,
          last_page: paginationData.last_page,
          per_page: paginationData.per_page,
          total: paginationData.total,
          from: paginationData.from,
          to: paginationData.to
        })
      } else {
        setPagination(null)
      }
    } catch (error: any) {
      console.error('Fetch products error:', error)
      setError(error.response?.data?.message || "Erreur lors du chargement des produits")
      toast.error("Erreur lors du chargement des produits")
      setProducts([]) // Ensure we always have an array
      setPagination(null)
    } finally {
      setLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const response = await categoriesAPI.getAll()
      const categoriesData = response.data.data || []
      setCategories(categoriesData)
    } catch (error: any) {
      console.error("Erreur lors du chargement des catégories:", error)
      setCategories([]) // Ensure we always have an array
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const productData = {
        ...formData,
        price: parseFloat(formData.price),
        loyalty_price: formData.loyalty_price ? parseFloat(formData.loyalty_price) : null,
        cost_price: parseFloat(formData.cost_price),
        stock_quantity: parseInt(formData.stock_quantity),
        minimum_stock: parseInt(formData.minimum_stock),
        category_id: parseInt(formData.category_id),
      }

      if (editingProduct) {
        await productsAPI.update(editingProduct.id, productData)
        
        // Upload photo if selected
        if (photoFile) {
          await productsAPI.uploadPhoto(editingProduct.id, photoFile)
        }
        
        toast.success("Produit mis à jour avec succès")
      } else {
        const response = await productsAPI.create(productData)
        
        // Upload photo if selected
        if (photoFile) {
          await productsAPI.uploadPhoto(response.data.data.id, photoFile)
        }
        
        toast.success("Produit créé avec succès")
      }

      setIsDialogOpen(false)
      resetForm()
      fetchProducts()
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de l'opération")
    }
  }

  const handleDelete = async (productId: number) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer ce produit ?")) {
      try {
        await productsAPI.delete(productId)
        toast.success("Produit supprimé avec succès")
        fetchProducts()
      } catch (error: any) {
        toast.error(error.message || "Erreur lors de la suppression")
      }
    }
  }

  const handleEdit = (product: Product) => {
    setEditingProduct(product)
    setPhotoFile(null) // Clear any previous photo selection
    setFormData({
      name: product.name,
      description: product.description || "",
      price: product.price.toString(),
      loyalty_price: product.loyalty_price?.toString() || "",
      cost_price: product.cost_price.toString(),
      barcode: product.barcode || "",
      sku: product.sku || "",
      stock_quantity: product.stock_quantity.toString(),
      minimum_stock: product.minimum_stock.toString(),
      category_id: product.category.id.toString(),
      is_active: product.is_active,
    })
    setIsDialogOpen(true)
  }

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      price: "",
      loyalty_price: "",
      cost_price: "",
      barcode: "",
      sku: "",
      stock_quantity: "",
      minimum_stock: "",
      category_id: "",
      is_active: true,
    })
    setEditingProduct(null)
    setPhotoFile(null)
  }

  // Use products data directly since backend handles search and pagination
  const filteredProducts = products || []

  const getStockStatus = (product: Product) => {
    if (product.stock_quantity <= 0) return { status: "out_of_stock", label: "Rupture", variant: "destructive" as const }
    if (product.stock_quantity <= product.minimum_stock) return { status: "low_stock", label: "Faible", variant: "secondary" as const }
    return { status: "in_stock", label: "En stock", variant: "default" as const }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t("products.title")}</h1>
          <p className="text-gray-600 dark:text-gray-400">{t("products.subtitle")}</p>
        </div>
        <div className="flex space-x-2 rtl:space-x-reverse">
          <Button variant="outline" className="flex items-center space-x-2 rtl:space-x-reverse bg-transparent">
            <Scan className="h-4 w-4" />
            <span>{t("products.barcode")}</span>
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                className="flex items-center space-x-2 rtl:space-x-reverse"
                onClick={() => {
                  resetForm()
                  setIsDialogOpen(true)
                }}
              >
                <Plus className="h-4 w-4" />
                <span>{t("products.add")}</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingProduct ? "Modifier le produit" : "Ajouter un produit"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nom du produit *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category">Catégorie *</Label>
                    <Select
                      value={formData.category_id}
                      onValueChange={(value) => setFormData({ ...formData, category_id: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner une catégorie" />
                      </SelectTrigger>
                      <SelectContent>
                        {(categories || []).map((category) => (
                          <SelectItem key={category.id} value={category.id.toString()}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="price">Prix de vente *</Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="loyalty_price">Prix de fidélité</Label>
                    <Input
                      id="loyalty_price"
                      type="number"
                      step="0.01"
                      value={formData.loyalty_price}
                      onChange={(e) => setFormData({ ...formData, loyalty_price: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cost_price">Prix d'achat *</Label>
                    <Input
                      id="cost_price"
                      type="number"
                      step="0.01"
                      value={formData.cost_price}
                      onChange={(e) => setFormData({ ...formData, cost_price: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="barcode">Code-barres</Label>
                    <Input
                      id="barcode"
                      value={formData.barcode}
                      onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sku">SKU</Label>
                    <Input
                      id="sku"
                      value={formData.sku}
                      onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="stock_quantity">Quantité en stock *</Label>
                    <Input
                      id="stock_quantity"
                      type="number"
                      value={formData.stock_quantity}
                      onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="minimum_stock">Stock minimum *</Label>
                    <Input
                      id="minimum_stock"
                      type="number"
                      value={formData.minimum_stock}
                      onChange={(e) => setFormData({ ...formData, minimum_stock: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="photo">Photo du produit</Label>
                  {editingProduct && editingProduct.photo_url && (
                    <div className="mb-2">
                      <p className="text-sm text-gray-600 mb-2">Image actuelle:</p>
                      <img 
                        src={editingProduct.photo_url} 
                        alt="Current product" 
                        className="w-20 h-20 object-cover rounded border"
                      />
                    </div>
                  )}
                  <Input
                    id="photo"
                    type="file"
                    accept="image/*"
                    onChange={(e) => setPhotoFile(e.target.files?.[0] || null)}
                  />
                  {photoFile && (
                    <div className="mt-2">
                      <p className="text-sm text-gray-600 mb-2">Nouvelle image:</p>
                      <img 
                        src={URL.createObjectURL(photoFile)} 
                        alt="Preview" 
                        className="w-20 h-20 object-cover rounded border"
                      />
                    </div>
                  )}
                </div>

                <div className="flex justify-end space-x-2 rtl:space-x-reverse">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    {t("common.cancel")}
                  </Button>
                  <Button type="submit">
                    {editingProduct ? t("common.save") : t("common.add")}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center space-x-4 rtl:space-x-reverse">
            <div className="relative flex-1">
              <Search className="absolute left-3 rtl:left-auto rtl:right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder={t("common.search")}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 rtl:pl-4 rtl:pr-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {searchTerm ? "Aucun produit trouvé" : "Aucun produit disponible"}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Image</TableHead>
                  <TableHead>{t("products.name")}</TableHead>
                  <TableHead>{t("products.price")}</TableHead>
                  <TableHead>{t("products.category")}</TableHead>
                  <TableHead>{t("products.stock")}</TableHead>
                  <TableHead>{t("common.actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product) => {
                  const stockStatus = getStockStatus(product)
                  return (
                    <TableRow key={product.id}>
                      <TableCell>
                        <img
                          src={product.photo_url ? product.photo_url : "/placeholder.svg"}
                          alt={product.name}
                          className="w-12 h-12 rounded-lg object-cover"
                        />
                      </TableCell>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell>{product.price} DH</TableCell>
                      <TableCell>
                        <Badge 
                          variant="secondary" 
                          style={{ backgroundColor: product.category.color }}
                        >
                          {product.category.name}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={stockStatus.variant}>
                          {product.stock_quantity} ({stockStatus.label})
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2 rtl:space-x-reverse">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleEdit(product)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleDelete(product.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
          
          {/* Pagination Controls */}
          {filteredProducts.length > 0 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-gray-600">
                {pagination ? (
                  `Affichage de ${pagination.from} à ${pagination.to} sur ${pagination.total} résultats`
                ) : (
                  `Affichage de ${filteredProducts.length} résultats`
                )}
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Par page:</span>
                <Select value={perPage.toString()} onValueChange={(value) => {
                  setPerPage(parseInt(value))
                  setCurrentPage(1)
                }}>
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="15">15</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                >
                  Précédent
                </Button>
                <span className="text-sm">
                  Page {currentPage} sur {pagination?.last_page || 1}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.min(pagination?.last_page || 1, currentPage + 1))}
                  disabled={currentPage === (pagination?.last_page || 1)}
                >
                  Suivant
                </Button>
                <div className="flex items-center space-x-1 ml-2">
                  <span className="text-sm text-gray-600">Aller à:</span>
                  <Input
                    type="number"
                    min="1"
                    max={pagination?.last_page || 1}
                    value={currentPage}
                    onChange={(e) => {
                      const page = parseInt(e.target.value)
                      if (page >= 1 && page <= (pagination?.last_page || 1)) {
                        setCurrentPage(page)
                      }
                    }}
                    className="w-16 h-8 text-sm"
                  />
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
