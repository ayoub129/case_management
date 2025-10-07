import axios from 'axios';

// Helper function to translate field names to French
function getFieldName(field: string): string {
  const fieldTranslations: Record<string, string> = {
    'name': 'Nom',
    'description': 'Description',
    'price': 'Prix',
    'cost_price': 'Prix de revient',
    'barcode': 'Code-barres',
    'sku': 'Référence',
    'stock_quantity': 'Quantité en stock',
    'minimum_stock': 'Stock minimum',
    'category_id': 'Catégorie',
    'is_active': 'Statut actif',
    'email': 'Email',
    'phone': 'Téléphone',
    'address': 'Adresse',
    'city': 'Ville',
    'country': 'Pays',
    'postal_code': 'Code postal',
    'quantity': 'Quantité',
    'unit_price': 'Prix unitaire',
    'total_amount': 'Montant total',
    'customer_name': 'Nom du client',
    'customer_email': 'Email du client',
    'customer_phone': 'Téléphone du client',
    'payment_method': 'Méthode de paiement',
    'sale_date': 'Date de vente',
    'supplier_id': 'Fournisseur',
    'unit_cost': 'Coût unitaire',
    'total_cost': 'Coût total',
    'order_date': 'Date de commande',
    'type': 'Type',
    'amount': 'Montant',
    'transaction_date': 'Date de transaction',
    'reference': 'Référence',
    'notes': 'Notes',
  };
  
  return fieldTranslations[field] || field;
}

// Helper function to translate validation errors to user-friendly French messages
function translateValidationError(field: string, message: string): string {
  const fieldName = getFieldName(field);
  
  if (message.includes('required')) {
    return `Le champ "${fieldName}" est obligatoire`;
  }
  if (message.includes('unique')) {
    return `Cette ${fieldName.toLowerCase()} existe déjà`;
  }
  if (message.includes('exists')) {
    return `La ${fieldName.toLowerCase()} sélectionnée n'existe pas`;
  }
  if (message.includes('numeric')) {
    return `Le champ "${fieldName}" doit être un nombre`;
  }
  if (message.includes('integer')) {
    return `Le champ "${fieldName}" doit être un nombre entier`;
  }
  if (message.includes('min:')) {
    const minValue = message.match(/min:(\d+)/)?.[1];
    return `Le champ "${fieldName}" doit être au moins ${minValue}`;
  }
  if (message.includes('max:')) {
    const maxValue = message.match(/max:(\d+)/)?.[1];
    return `Le champ "${fieldName}" ne peut pas dépasser ${maxValue}`;
  }
  if (message.includes('email')) {
    return `Le champ "${fieldName}" doit être une adresse email valide`;
  }
  if (message.includes('string')) {
    return `Le champ "${fieldName}" doit être du texte`;
  }
  if (message.includes('boolean')) {
    return `Le champ "${fieldName}" doit être vrai ou faux`;
  }
  if (message.includes('date')) {
    return `Le champ "${fieldName}" doit être une date valide`;
  }
  if (message.includes('image')) {
    return `Le champ "${fieldName}" doit être une image`;
  }
  if (message.includes('mimes:')) {
    return `Le champ "${fieldName}" doit être un fichier image valide (JPG, PNG, GIF)`;
  }
  if (message.includes('max:2048')) {
    return `Le fichier "${fieldName}" ne peut pas dépasser 2MB`;
  }
  
  // Default fallback
  return `Erreur dans le champ "${fieldName}": ${message}`;
}

// Create axios instance with base configuration
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error);
    
    // Handle different types of errors
    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response;
      
      if (status === 422) {
        // Validation errors - translate to user-friendly French messages
        const validationErrors = data.errors || {};
        const translatedErrors = [];
        
        for (const [field, messages] of Object.entries(validationErrors)) {
          const fieldName = getFieldName(field);
          const message = Array.isArray(messages) ? messages[0] : messages;
          const translatedMessage = translateValidationError(field, message);
          translatedErrors.push(translatedMessage);
        }
        
        error.message = translatedErrors.join(', ');
      } else if (status === 404) {
        error.message = 'Ressource introuvable';
      } else if (status === 500) {
        error.message = 'Erreur serveur - veuillez réessayer plus tard';
      } else if (data && data.message) {
        error.message = data.message;
      } else {
        error.message = `Erreur de requête (${status})`;
      }
    } else if (error.request) {
      // Network error or server not responding
      error.message = 'Erreur de connexion - impossible de joindre le serveur';
    } else {
      // Something else happened
      error.message = error.message || 'Une erreur inattendue s\'est produite';
    }
    
    return Promise.reject(error);
  }
);

// Authentication API
export const authAPI = {
  login: (data: { email: string; password: string }) => api.post('/login', data),
  logout: () => api.post('/logout'),
  getUser: () => api.get('/user'),
  updateProfile: (data: { name?: string; email?: string; phone?: string; address?: string }) =>
    api.put('/user/profile', data),
  updatePassword: (data: { current_password: string; password: string; password_confirmation: string }) =>
    api.put('/user/password', data),
};

// Users API
export const usersAPI = {
  getAll: (params = '') => api.get(`/users?${params}`),
  getById: (id: number) => api.get(`/users/${id}`),
  create: (data: any) => api.post('/users', data),
  update: (id: number, data: any) => api.put(`/users/${id}`, data),
  delete: (id: number) => api.delete(`/users/${id}`),
  getRoles: () => api.get('/users/roles'),
  getPermissions: () => api.get('/users/permissions'),
};

// Dashboard API
export const dashboardAPI = {
  getOverview: () => api.get('/dashboard'),
  getStats: (period?: string) => api.get(`/dashboard/stats?period=${period || 'month'}`),
  getRecentActivities: () => api.get('/dashboard/recent-activities'),
  getDailyStats: () => api.get('/dashboard/daily-stats'),
};

// Products API
export const productsAPI = {
  getAll: (params?: {
    search?: string;
    category_id?: number;
    stock_status?: string;
    is_active?: boolean;
    page?: number;
    per_page?: number;
    sort_by?: string;
    sort_order?: string;
  }) => api.get('/products', { params }),
  
  getById: (id: number) => api.get(`/products/${id}`),
  
  create: (data: {
    name: string;
    description?: string;
    price: number;
    cost_price?: number;
    barcode?: string;
    sku?: string;
    stock_quantity: number;
    minimum_stock: number;
    category_id: number;
    is_active?: boolean;
  }) => api.post('/products', data),
  
  update: (id: number, data: any) => api.put(`/products/${id}`, data),
  
  delete: (id: number) => api.delete(`/products/${id}`),
  
  uploadPhoto: (productId: number, photo: File) => {
    const formData = new FormData();
    formData.append('product_id', productId.toString());
    formData.append('photo', photo);
    return api.post('/products/upload-photo', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  
  search: (query: string) => api.get(`/products/search?query=${query}`),
  
  findByBarcode: (barcode: string) => api.get(`/products/barcode/${barcode}`),
  
  bulkUpdate: (products: any[]) => api.post('/products/bulk-update', { products }),
  
  export: (params?: any) => api.get('/export/products', { params, responseType: 'blob' }),
};

// Customers API
export const customersAPI = {
  getAll: (params?: string) => api.get(`/customers${params ? `?${params}` : ''}`),
  getById: (id: number) => api.get(`/customers/${id}`),
  findByBarcode: (barcode: string) => api.get(`/customers/barcode/${barcode}`),
  create: (data: {
    name: string;
    email?: string;
    phone?: string;
    barcode?: string;
    is_loyalty: boolean;
  }) => api.post('/customers', data),
  update: (id: number, data: any) => api.put(`/customers/${id}`, data),
  delete: (id: number) => api.delete(`/customers/${id}`),
  toggleLoyalty: (id: number) => api.put(`/customers/${id}/toggle-loyalty`),
  addPoints: (id: number, points: number) => api.post(`/customers/${id}/add-points`, { points }),
  getStatistics: () => api.get('/customers/statistics'),
};

// Categories API
export const categoriesAPI = {
  getAll: () => api.get('/categories'),
  getById: (id: number) => api.get(`/categories/${id}`),
  create: (data: { name: string; description?: string; color?: string }) =>
    api.post('/categories', data),
  update: (id: number, data: any) => api.put(`/categories/${id}`, data),
  delete: (id: number) => api.delete(`/categories/${id}`),
};

// Suppliers API
export const suppliersAPI = {
  getAll: (params?: { search?: string; page?: number; per_page?: number }) =>
    api.get('/suppliers', { params }),
  getById: (id: number) => api.get(`/suppliers/${id}`),
  create: (data: {
    name: string;
    contact_person?: string;
    email?: string;
    phone?: string;
    address?: string;
    city?: string;
    country?: string;
    postal_code?: string;
    notes?: string;
  }) => api.post('/suppliers', data),
  update: (id: number, data: any) => api.put(`/suppliers/${id}`, data),
  delete: (id: number) => api.delete(`/suppliers/${id}`),
  getProducts: (id: number) => api.get(`/suppliers/${id}/products`),
};

// Sales API
export const salesAPI = {
  getAll: (params?: {
    search?: string;
    start_date?: string;
    end_date?: string;
    page?: number;
    per_page?: number;
  }) => api.get('/sales', { params }),
  
  getById: (id: number) => api.get(`/sales/${id}`),
  
  create: (data: {
    customer_id?: number;
    product_id: number;
    quantity: number;
    unit_price: number;
    total_amount: number;
    discount?: number;
    tax?: number;
    final_amount: number;
    customer_name?: string;
    customer_email?: string;
    customer_phone?: string;
    payment_method?: string;
    status?: string;
    sale_date: string;
    notes?: string;
  }) => api.post('/sales', data),
  
  update: (id: number, data: any) => api.put(`/sales/${id}`, data),
  delete: (id: number) => api.delete(`/sales/${id}`),
  getReports: (params?: any) => api.get('/sales/reports', { params }),
  export: (params?: any) => api.get('/sales/export', { params, responseType: 'blob' }),
  bulkCreate: (data: { sales: any[] }) => api.post('/sales/bulk', data),
  generateInvoice: (id: number) => api.get(`/pdf/invoice/${id}`, { responseType: 'blob' }),
};

// Purchases API
export const purchasesAPI = {
  getAll: (params?: {
    search?: string;
    supplier_id?: number;
    status?: string;
    start_date?: string;
    end_date?: string;
    page?: number;
    per_page?: number;
  }) => api.get('/purchases', { params }),
  
  getById: (id: number) => api.get(`/purchases/${id}`),
  
  create: (data: {
    product_id: number;
    supplier_id: number;
    quantity: number;
    unit_cost: number;
    total_cost: number;
    shipping_cost?: number;
    tax?: number;
    final_cost: number;
    payment_method?: string;
    status?: string;
    order_date: string;
    expected_delivery_date?: string;
    notes?: string;
  }) => api.post('/purchases', data),
  
  update: (id: number, data: any) => api.put(`/purchases/${id}`, data),
  delete: (id: number) => api.delete(`/purchases/${id}`),
  receive: (id: number) => api.put(`/purchases/${id}/receive`),
  getReports: (params?: any) => api.get('/purchases/reports', { params }),
  export: (params?: any) => api.get('/purchases/export', { params, responseType: 'blob' }),
  bulkCreate: (data: { purchases: any[] }) => api.post('/purchases/bulk', data),
};

// Cash Transactions API
export const cashTransactionsAPI = {
  getAll: (params?: {
    type?: string;
    start_date?: string;
    end_date?: string;
    page?: number;
    per_page?: number;
    search?: string;
  }) => api.get('/cash-transactions', { params }),
  
  getById: (id: number) => api.get(`/cash-transactions/${id}`),
  
  create: (data: {
    type: 'income' | 'expense';
    amount: number;
    description: string;
    reference?: string;
    payment_method?: string;
    transaction_date: string;
    notes?: string;
  }) => api.post('/cash-transactions', data),
  
  update: (id: number, data: any) => api.put(`/cash-transactions/${id}`, data),
  delete: (id: number) => api.delete(`/cash-transactions/${id}`),
  getBalance: (params?: any) => api.get('/cash-transactions/balance', { params }),
  getReports: (params?: any) => api.get('/cash-transactions/reports', { params }),
  export: (params?: any) => api.get('/cash-transactions/export', { 
    params, 
    responseType: 'blob',
    headers: {
      'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    }
  }),
  generateReceipt: (id: number) => api.get(`/pdf/receipt/${id}`, { responseType: 'blob' }),
};

// Stock Alerts API
export const stockAlertsAPI = {
  getAll: (params?: {
    search?: string;
    category_id?: number;
    status?: string;
    is_resolved?: boolean;
    page?: number;
    per_page?: number;
  }) => api.get('/stock-alerts', { params }),
  
  getById: (id: number) => api.get(`/stock-alerts/${id}`),
  
  create: (data: {
    product_id: number;
    alert_type: string;
    threshold_stock: number;
    priority: string;
    notes?: string;
  }) => api.post('/stock-alerts', data),
  
  update: (id: number, data: any) => api.put(`/stock-alerts/${id}`, data),
  
  delete: (id: number) => api.delete(`/stock-alerts/${id}`),
  
  getActive: () => api.get('/stock-alerts/active'),
  
  resolve: (id: number) => api.put(`/stock-alerts/${id}/resolve`),
  
  checkAlerts: () => api.post('/stock-alerts/check'),
};

// Inventory API
export const inventoryAPI = {
  getAll: (params?: {
    product_id?: number;
    movement_type?: string;
    start_date?: string;
    end_date?: string;
    page?: number;
    per_page?: number;
  }) => api.get('/inventory', { params }),
  
  getById: (id: number) => api.get(`/inventory/${id}`),
  
  create: (data: {
    product_id: number;
    movement_type: string;
    quantity: number;
    previous_stock: number;
    new_stock: number;
    reference?: string;
    reference_type?: string;
    reason?: string;
    movement_date: string;
    notes?: string;
  }) => api.post('/inventory', data),
  
  update: (id: number, data: any) => api.put(`/inventory/${id}`, data),
  delete: (id: number) => api.delete(`/inventory/${id}`),
  getMovements: (params?: any) => api.get('/inventory/movements', { params }),
  getReports: (params?: any) => api.get('/inventory/reports', { params }),
  export: (params?: any) => api.get('/inventory/export', { params, responseType: 'blob' }),
  adjustment: (data: any) => api.post('/inventory/adjustment', data),
};



// Export API
export const exportAPI = {
  products: (params?: any) => api.get('/export/products', { params, responseType: 'blob' }),
  sales: (params?: any) => api.get('/export/sales', { params, responseType: 'blob' }),
  purchases: (params?: any) => api.get('/export/purchases', { params, responseType: 'blob' }),
  inventory: (params?: any) => api.get('/export/inventory', { params, responseType: 'blob' }),
  cashTransactions: (params?: any) => api.get('/export/cash-transactions', { params, responseType: 'blob' }),
};

// PDF API
export const pdfAPI = {
  salesReport: (type: string, params: { start_date: string; end_date: string }) =>
    api.get(`/pdf/report/${type}`, { params, responseType: 'blob' }),
};

export default api; 