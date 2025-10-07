# Case Management System - Frontend

A modern React/Next.js frontend for the case management system with full API integration.

## Features

- **Product Management**: CRUD operations with photo upload
- **Real-time Data**: Live data from Laravel backend
- **Multi-language**: French and Arabic support
- **Responsive Design**: Works on desktop and mobile
- **Dark Mode**: Theme switching support
- **No Authentication Required**: Direct access to all features

## Prerequisites

- Node.js 18+ 
- npm or pnpm
- Laravel backend running on `http://localhost:8000`

## Installation

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Create environment file**
   Create `.env.local` in the root directory:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:8000/api
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:3000`

## API Integration

The frontend is fully integrated with the Laravel backend API. All API calls are handled through the `lib/api.ts` file which includes:

- **Products**: Full CRUD with photo upload and barcode scanning
- **Categories**: Product categorization
- **Suppliers**: Supplier management
- **Sales**: Sales tracking and reporting
- **Purchases**: Purchase management
- **Cash Transactions**: Income/expense tracking
- **Stock Alerts**: Low stock notifications
- **Inventory**: Stock movement tracking
- **Export/Import**: Excel and PDF functionality

## Project Structure

```
frontend/
├── app/                    # Next.js app directory
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Main dashboard
├── components/            # React components
│   ├── ui/               # Shadcn/ui components
│   ├── product-management.tsx
│   ├── cash-management.tsx
│   ├── sales-purchases.tsx
│   ├── suppliers.tsx
│   ├── stock-alerts.tsx
│   ├── inventory.tsx
│   ├── user-management.tsx
│   ├── dashboard-overview.tsx
│   ├── sidebar.tsx
│   ├── top-navbar.tsx
│   ├── language-context.tsx
│   └── theme-provider.tsx
├── lib/                   # Utilities
│   ├── api.ts            # API service layer
│   └── utils.ts          # Helper functions
└── styles/               # Global styles
    └── globals.css
```

## Key Components

### API Service Layer
Centralized API calls with error handling and response processing.

### Product Management
Full CRUD operations for products with:
- Photo upload
- Category selection
- Stock management
- Barcode support
- Search and filtering

### Multi-language Support
French and Arabic interface with RTL support for Arabic.

## Development

### Adding New API Endpoints

1. Add the endpoint to `lib/api.ts`
2. Create the corresponding component
3. Use the API service in your component

### Styling

The project uses:
- **Tailwind CSS** for styling
- **Shadcn/ui** for UI components
- **Lucide React** for icons

### State Management

- **React Context** for global state (language, theme)
- **React State** for component-level state

## Building for Production

```bash
npm run build
npm start
```

## Troubleshooting

### CORS Issues
Make sure your Laravel backend has CORS properly configured to allow requests from `http://localhost:3000`.

### API Connection Issues
1. Verify the backend is running on `http://localhost:8000`
2. Check the `NEXT_PUBLIC_API_URL` in your `.env.local`
3. Ensure the Laravel API routes are working

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License. 