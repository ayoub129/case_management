# Users Management System

## 🎯 Overview

The Users Management system allows administrators to manage all users in the application with role-based permissions. Only users with the `admin` role can access this functionality.

## 🔐 Access Control

- **Admin Role**: Full access to create, read, update, and delete users
- **Cashier Role**: No access to users management (will see permission denied message)

## 🚀 Features

### ✅ User Management
- **List Users**: View all users with pagination
- **Create Users**: Add new users with roles (admin/cashier)
- **Edit Users**: Update user information and change passwords
- **Delete Users**: Remove users (cannot delete your own account)
- **Search Users**: Search by name, email, or phone
- **Filter by Role**: Filter users by admin or cashier role

### ✅ Role Management
- **Two Roles Available**:
  - **Administrateur**: Full system access
  - **Caissier**: Limited access (sales, cash management)

### ✅ Security Features
- **Password Validation**: Strong password requirements
- **Email Uniqueness**: Prevents duplicate email addresses
- **Self-Protection**: Admins cannot delete their own accounts
- **Role-Based Access**: Only admins can manage users

## 📱 User Interface

### Main Dashboard
- **Header**: Title and "Nouvel Utilisateur" button
- **Filters Section**: Search and role filtering
- **Users List**: Card-based layout showing user information

### User Cards Display
- **User Avatar**: Default user icon
- **User Info**: Name, email, phone (if available)
- **Role Badge**: Visual indicator of user role
- **Action Buttons**: Edit and delete options

### Create/Edit Dialogs
- **Form Fields**:
  - Name (required)
  - Email (required, unique)
  - Password (required for new users, optional for updates)
  - Password Confirmation (required when password is set)
  - Phone (optional)
  - Address (optional)
  - Role (required: admin or cashier)

## 🔧 API Endpoints

### Authentication Required
All endpoints require a valid Bearer token from an admin user.

```
GET    /api/users              - List all users (with search/filter)
POST   /api/users              - Create new user
GET    /api/users/{id}         - Get specific user
PUT    /api/users/{id}         - Update user
DELETE /api/users/{id}         - Delete user
GET    /api/users/roles        - Get available roles
```

### Request Examples

#### Create User
```bash
curl -X POST "https://case.berouijil.com/api/users" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123",
    "password_confirmation": "password123",
    "phone": "+1234567890",
    "address": "123 Main St",
    "role": "cashier"
  }'
```

#### List Users
```bash
curl -X GET "https://case.berouijil.com/api/users?search=john&role=cashier" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 🎨 UI Components

### Visual Elements
- **Role Badges**:
  - 🔴 **Administrateur**: Red badge with shield icon
  - 🔵 **Caissier**: Blue badge with user check icon

- **Action Icons**:
  - ✏️ **Edit**: Pencil icon for editing users
  - 🗑️ **Delete**: Trash icon for deleting users
  - ➕ **Add**: Plus icon for creating new users

### Responsive Design
- **Desktop**: Full layout with side-by-side filters
- **Mobile**: Stacked layout for better mobile experience
- **Loading States**: Spinner animation during API calls
- **Empty States**: Helpful messages when no users found

## 🛡️ Security Considerations

### Input Validation
- **Name**: Required, max 255 characters
- **Email**: Required, valid email format, unique
- **Password**: Required for new users, min 8 characters
- **Phone**: Optional, max 20 characters
- **Address**: Optional, max 500 characters
- **Role**: Required, must be 'admin' or 'cashier'

### Error Handling
- **Validation Errors**: User-friendly French error messages
- **Permission Errors**: Clear access denied messages
- **Network Errors**: Connection error notifications
- **Success Messages**: Confirmation of successful operations

## 🔄 Workflow

### Creating a New User
1. Click "Nouvel Utilisateur" button
2. Fill in required fields (name, email, password, role)
3. Optionally add phone and address
4. Click "Créer" to save
5. User appears in the list immediately

### Editing a User
1. Click the edit (pencil) icon on any user card
2. Modify the desired fields
3. Leave password fields empty to keep current password
4. Click "Mettre à jour" to save changes

### Deleting a User
1. Click the delete (trash) icon on any user card
2. Confirm the deletion in the popup dialog
3. User is removed from the system

### Searching and Filtering
1. Use the search box to find users by name, email, or phone
2. Use the role dropdown to filter by admin or cashier
3. Results update automatically as you type

## 📊 Data Structure

### User Object
```json
{
  "id": 1,
  "name": "Administrator",
  "email": "admin@example.com",
  "phone": "+1234567890",
  "address": "123 Admin Street",
  "created_at": "2025-08-06T12:17:14.000000Z",
  "updated_at": "2025-08-06T12:17:14.000000Z",
  "roles": [
    {
      "id": 1,
      "name": "admin",
      "guard_name": "web"
    }
  ]
}
```

### Role Object
```json
{
  "id": 1,
  "name": "admin",
  "guard_name": "web",
  "created_at": "2025-08-06T12:17:14.000000Z",
  "updated_at": "2025-08-06T12:17:14.000000Z"
}
```

## 🚨 Troubleshooting

### Common Issues

**"Permission Denied" Message**
- Ensure you're logged in as an admin user
- Check that your user has the admin role

**"Email Already Exists" Error**
- The email address is already in use
- Use a different email address

**"Password Confirmation Required" Error**
- Make sure password and password_confirmation match
- Both fields are required when setting a password

**"Cannot Delete Own Account" Error**
- Admins cannot delete their own accounts for security
- Have another admin delete the account if needed

### API Errors
- **401 Unauthorized**: Invalid or expired token
- **403 Forbidden**: User doesn't have admin role
- **422 Validation Error**: Invalid form data
- **404 Not Found**: User doesn't exist
- **500 Server Error**: Contact system administrator

## 🔮 Future Enhancements

### Potential Features
- **Bulk Operations**: Select multiple users for bulk actions
- **User Activity Logs**: Track user login times and actions
- **Password Reset**: Allow admins to reset user passwords
- **User Import/Export**: CSV import/export functionality
- **Advanced Permissions**: Granular permission system
- **User Groups**: Organize users into groups
- **Two-Factor Authentication**: Enhanced security

### Performance Optimizations
- **Pagination**: Already implemented for large user lists
- **Caching**: Cache user data for faster loading
- **Search Indexing**: Optimize search performance
- **Lazy Loading**: Load user details on demand

## 📞 Support

For technical support or questions about the Users Management system:
- Check the browser console for error messages
- Verify your user has admin permissions
- Ensure the backend service is running
- Contact the system administrator for backend issues 