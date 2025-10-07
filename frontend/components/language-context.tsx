"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"

type Language = "fr" | "ar"

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string) => string
  isRTL: boolean
}

const translations = {
  fr: {
    // Navigation
    "nav.dashboard": "Tableau de bord",
    "nav.products": "Gestion des produits",
    "nav.categories": "Catégories",
    "nav.cash": "Gestion de la caisse",
    "nav.sales": "Ventes et achats",
    "nav.suppliers": "Gestion des fournisseurs",
    "nav.stock": "Stocks et alertes de niveau",
    "nav.inventory": "Gestion de l'inventaire",
    "nav.users": "Multi-utilisateurs",

    // Common
    "common.add": "Ajouter",
    "common.edit": "Modifier",
    "common.delete": "Supprimer",
    "common.search": "Rechercher",
    "common.filter": "Filtrer",
    "common.export": "Exporter",
    "common.save": "Enregistrer",
    "common.cancel": "Annuler",
    "common.actions": "Actions",
    "common.status": "Statut",
    "common.date": "Date",
    "common.amount": "Montant",
    "common.total": "Total",

    // Products
    "products.title": "Gestion des produits",
    "products.subtitle": "Photos et scan code-barres",
    "products.name": "Nom du produit",
    "products.price": "Prix",
    "products.category": "Catégorie",
    "products.stock": "Stock",
    "products.barcode": "Scanner code-barres",
    "products.add": "Ajouter un produit",
    "products.photo": "Photo du produit",

    // Categories
    "categories.title": "Gestion des Catégories",
    "categories.subtitle": "Gérez les catégories de vos produits",
    "categories.name": "Nom de la catégorie",
    "categories.description": "Description",
    "categories.color": "Couleur",
    "categories.add": "Nouvelle Catégorie",
    "categories.edit": "Modifier la catégorie",
    "categories.new": "Nouvelle catégorie",
    "categories.update": "Mettre à jour",
    "categories.create": "Créer",
    "categories.delete": "Supprimer",
    "categories.deleteConfirm": "Êtes-vous sûr de vouloir supprimer cette catégorie ?",
    "categories.search": "Rechercher des catégories...",
    "categories.noDescription": "Aucune description",
    "categories.noCategories": "Aucune catégorie disponible",
    "categories.noResults": "Aucune catégorie trouvée",
    "categories.loading": "Chargement des catégories...",
    "categories.success.create": "Catégorie créée avec succès",
    "categories.success.update": "Catégorie mise à jour avec succès",
    "categories.success.delete": "Catégorie supprimée avec succès",
    "categories.error.load": "Erreur lors du chargement des catégories",
    "categories.error.save": "Erreur lors de la sauvegarde",
    "categories.error.delete": "Erreur lors de la suppression",

    // Cash Management
    "cash.title": "Gestion de la caisse",
    "cash.subtitle": "Encaissement et dépenses",
    "cash.income": "Revenus totaux",
    "cash.expenses": "Dépenses totales",
    "cash.balance": "Solde",
    "cash.addTransaction": "Ajouter une transaction",
    "cash.encaissement": "Encaissement",
    "cash.depenses": "Dépenses",

    // Sales
    "sales.title": "Gestion des ventes et des achats",
    "sales.recent": "Transactions récentes",
    "sales.type": "Type",
    "sales.customer": "Client",
    "sales.ventes": "Ventes",
    "sales.achats": "Achats",

    // Suppliers
    "suppliers.title": "Gestion des fournisseurs",
    "suppliers.name": "Nom",
    "suppliers.contact": "Contact",
    "suppliers.email": "Email",
    "suppliers.phone": "Téléphone",
    "suppliers.orders": "Commandes",

    // Stock
    "stock.title": "Gestion des stocks et des alertes de niveau",
    "stock.product": "Produit",
    "stock.current": "Stock actuel",
    "stock.minimum": "Stock minimum",
    "stock.alert": "Alerte",
    "stock.low": "Faible",
    "stock.critical": "Critique",
    "stock.normal": "Normal",
    "stock.alertes": "Alertes de niveau",

    // Inventory
    "inventory.title": "Gestion de l'inventaire",
    "inventory.subtitle": "Rapports et historiques",
    "inventory.reports": "Rapports",
    "inventory.historiques": "Historiques",
    "inventory.export.excel": "Exporter en Excel",
    "inventory.export.pdf": "Exporter en PDF",
    "inventory.exportation": "Exportation des données",

    // Users
    "users.title": "Multi-utilisateurs avec rôles définis",
    "users.name": "Nom",
    "users.role": "Rôle",
    "users.permissions": "Permissions",
    "users.lastLogin": "Dernière connexion",
    "users.roles": "Rôles définis",
    "users.multiuser": "Multi-utilisateurs",
  },
  ar: {
    // Navigation
    "nav.products": "إدارة المنتجات",
    "nav.categories": "الفئات",
    "nav.cash": "إدارة الصندوق",
    "nav.sales": "المبيعات والمشتريات",
    "nav.suppliers": "الموردون",
    "nav.stock": "المخزون والتنبيهات",
    "nav.inventory": "الجرد",
    "nav.users": "المستخدمون",

    // Common
    "common.add": "إضافة",
    "common.edit": "تعديل",
    "common.delete": "حذف",
    "common.search": "بحث",
    "common.filter": "تصفية",
    "common.export": "تصدير",
    "common.save": "حفظ",
    "common.cancel": "إلغاء",
    "common.actions": "الإجراءات",
    "common.status": "الحالة",
    "common.date": "التاريخ",
    "common.amount": "المبلغ",
    "common.total": "المجموع",

    // Products
    "products.title": "إدارة المنتجات",
    "products.name": "اسم المنتج",
    "products.price": "السعر",
    "products.category": "الفئة",
    "products.stock": "المخزون",
    "products.barcode": "مسح الباركود",
    "products.add": "إضافة منتج",

    // Categories
    "categories.title": "إدارة الفئات",
    "categories.subtitle": "إدارة فئات منتجاتك",
    "categories.name": "اسم الفئة",
    "categories.description": "الوصف",
    "categories.color": "اللون",
    "categories.add": "فئة جديدة",
    "categories.edit": "تعديل الفئة",
    "categories.new": "فئة جديدة",
    "categories.update": "تحديث",
    "categories.create": "إنشاء",
    "categories.delete": "حذف",
    "categories.deleteConfirm": "هل أنت متأكد من حذف هذه الفئة؟",
    "categories.search": "البحث في الفئات...",
    "categories.noDescription": "لا يوجد وصف",
    "categories.noCategories": "لا توجد فئات متاحة",
    "categories.noResults": "لم يتم العثور على فئات",
    "categories.loading": "جاري تحميل الفئات...",
    "categories.success.create": "تم إنشاء الفئة بنجاح",
    "categories.success.update": "تم تحديث الفئة بنجاح",
    "categories.success.delete": "تم حذف الفئة بنجاح",
    "categories.error.load": "خطأ في تحميل الفئات",
    "categories.error.save": "خطأ في الحفظ",
    "categories.error.delete": "خطأ في الحذف",

    // Cash Management
    "cash.title": "إدارة الصندوق",
    "cash.income": "إجمالي الإيرادات",
    "cash.expenses": "إجمالي المصروفات",
    "cash.balance": "الرصيد",
    "cash.addTransaction": "إضافة معاملة",

    // Sales
    "sales.title": "المبيعات والمشتريات",
    "sales.recent": "المعاملات الأخيرة",
    "sales.type": "النوع",
    "sales.customer": "العميل",

    // Suppliers
    "suppliers.title": "الموردون",
    "suppliers.name": "الاسم",
    "suppliers.contact": "جهة الاتصال",
    "suppliers.email": "البريد الإلكتروني",
    "suppliers.phone": "الهاتف",
    "suppliers.orders": "الطلبات",

    // Stock
    "stock.title": "المخزون وتنبيهات المستوى",
    "stock.product": "المنتج",
    "stock.current": "المخزون الحالي",
    "stock.minimum": "الحد الأدنى للمخزون",
    "stock.alert": "تنبيه",
    "stock.low": "منخفض",
    "stock.critical": "حرج",
    "stock.normal": "طبيعي",

    // Inventory
    "inventory.title": "الجرد",
    "inventory.reports": "التقارير",
    "inventory.export.excel": "تصدير Excel",
    "inventory.export.pdf": "تصدير PDF",

    // Users
    "users.title": "المستخدمون",
    "users.name": "الاسم",
    "users.role": "الدور",
    "users.permissions": "الصلاحيات",
    "users.lastLogin": "آخر تسجيل دخول",
  },
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>("fr")

  const t = (key: string): string => {
    return translations[language][key as keyof (typeof translations)["fr"]] || key
  }

  const isRTL = language === "ar"

  useEffect(() => {
    document.documentElement.dir = isRTL ? "rtl" : "ltr"
    document.documentElement.lang = language
  }, [isRTL, language])

  return <LanguageContext.Provider value={{ language, setLanguage, t, isRTL }}>{children}</LanguageContext.Provider>
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider")
  }
  return context
}
