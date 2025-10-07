# Login System Documentation

## Overview

A comprehensive authentication system has been implemented for the Case Management System, providing secure user authentication with login, registration, and profile management capabilities.

## Features

### 🔐 Authentication
- **User Login**: Secure login with email and password
- **Token-based Authentication**: JWT tokens for secure API access
- **Automatic Token Management**: Tokens are automatically stored and included in API requests
- **Logout Functionality**: Secure logout with token invalidation

### 👤 User Management
- **Profile Management**: Update personal information (name, email, phone, address)
- **Password Management**: Change password with current password verification
- **User Roles**: Role-based access control (cashier, admin, etc.)

### 🛡️ Security Features
- **Form Validation**: Client-side and server-side validation
- **Password Security**: Minimum 8 characters, confirmation required
- **Protected Routes**: Automatic redirection to login for unauthenticated users
- **Token Expiration**: Automatic token cleanup on expiration

## Components

### Core Components

1. **AuthContext** (`components/auth-context.tsx`)
   - Manages authentication state across the application
   - Provides login, register, logout, and profile management functions
   - Handles token storage and API authentication

2. **LoginPage** (`components/login-page.tsx`)
   - Beautiful login interface
   - Form validation with error handling
   - Password visibility toggles

3. **ProtectedRoute** (`components/protected-route.tsx`)
   - Wraps protected content
   - Redirects to login if user is not authenticated
   - Shows loading state during authentication check

4. **UserProfile** (`components/user-profile.tsx`)
   - Profile information management
   - Password change functionality
   - Form validation and error handling

5. **NavigationContext** (`components/navigation-context.tsx`)
   - Manages active section state
   - Handles URL parameters for navigation
   - Provides navigation functions to components

### Updated Components

1. **TopNavbar** (`components/top-navbar.tsx`)
   - Added user information display
   - Added logout functionality
   - Added profile navigation link

2. **Sidebar** (`components/sidebar.tsx`)
   - Added profile section link
   - Uses navigation context for state management

3. **Main Layout** (`app/layout.tsx`)
   - Added AuthProvider wrapper
   - Added ThemeProvider for dark mode support

## API Integration

### Backend Routes
The following authentication routes have been added to the backend:

```php
// Authentication routes (public)
POST /api/login - User login

// Protected routes (require authentication)
GET /api/user - Get current user
PUT /api/user/profile - Update user profile
PUT /api/user/password - Update user password
POST /api/logout - User logout
```

### Frontend API Functions
Authentication API functions are available in `lib/api.ts`:

```typescript
// Authentication API
export const authAPI = {
  login: (data: { email: string; password: string }) => api.post('/login', data),
  logout: () => api.post('/logout'),
  getUser: () => api.get('/user'),
  updateProfile: (data: { name?: string; email?: string; phone?: string; address?: string }) => api.put('/user/profile', data),
  updatePassword: (data: { current_password: string; password: string; password_confirmation: string }) => api.put('/user/password', data),
};
```

## Usage

### Login Flow
1. User visits the application
2. If not authenticated, redirected to login page
3. User enters email and password
4. On successful login, redirected to dashboard
5. Token is stored in localStorage for future requests

### Profile Management
1. User clicks "Profil" in sidebar or user menu
2. User can update personal information
3. User can change password
4. Changes are saved to backend

### Logout Flow
1. User clicks "Se déconnecter" in user menu
2. Token is invalidated on backend
3. Token is removed from localStorage
4. User is redirected to login page

## Security Considerations

### Token Management
- Tokens are stored in localStorage
- Tokens are automatically included in API requests
- Tokens are cleared on logout
- Invalid tokens are automatically removed

### Form Validation
- Client-side validation using Zod schemas
- Server-side validation on all endpoints
- Password confirmation required
- Email format validation

### Protected Routes
- All dashboard routes require authentication
- Unauthenticated users are redirected to login
- Loading states during authentication checks

## Styling

The login system uses:
- **Tailwind CSS** for styling
- **Shadcn/ui** components for consistent design
- **Lucide React** icons
- **Dark mode** support
- **Responsive design** for mobile and desktop

## Error Handling

- **Form validation errors** are displayed inline
- **API errors** are translated to user-friendly French messages
- **Network errors** are handled gracefully
- **Authentication errors** redirect to login

## Future Enhancements

Potential improvements for the authentication system:

1. **Password Reset**: Forgot password functionality
2. **Email Verification**: Email confirmation for new accounts
3. **Two-Factor Authentication**: Additional security layer
4. **Session Management**: Multiple device login handling
5. **Remember Me**: Extended session duration
6. **Social Login**: Google, Facebook, etc.
7. **Audit Logs**: Track login/logout events

## Testing

To test the login system:

1. **Start the backend server**:
   ```bash
   cd backend
   php artisan serve
   ```

2. **Start the frontend server**:
   ```bash
   cd frontend
   npm run dev
   ```

3. **Test login**:
   - Visit `http://localhost:3000`
   - Use one of the test accounts below
   - Login and verify access to dashboard

### Test Accounts
- **Admin User**: `admin@example.com` / `admin123`
- **Cashier User**: `cashier@example.com` / `cashier123`

4. **Test profile management**:
   - Click "Profil" in sidebar
   - Update information and change password

5. **Test logout**:
   - Click user menu in top navbar
   - Click "Se déconnecter"
   - Verify redirect to login page 