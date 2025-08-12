# Authentication System Implementation

## Overview

This document describes the authentication system implementation for the manga website. The system provides role-based access control with three user roles: `viewer`, `creator`, and `admin`.

## Features Implemented

### 1. Authentication Context (`src/contexts/AuthContext.tsx`)
- Global state management for user authentication
- Automatic token validation on app startup
- Login/logout functionality
- User data persistence

### 2. Conditional Navigation (`src/components/Navigation.tsx`)
- **Non-authenticated users**: See "Sign Up" and "Log In" buttons
- **Authenticated users**: See "Creator Panel", "Profile", and "Logout" buttons
- **Admin users**: Additionally see "Admin Dashboard" button
- Mobile-responsive design with collapsible menu

### 3. Updated Pages

#### Home Page (`src/app/page.tsx`)
- Conditional hero section buttons based on authentication status
- Personalized recommendations section for logged-in users

#### Login Page (`src/app/login/page.tsx`)
- Uses authentication context for login
- Automatic redirect after successful login
- Error handling with modal dialogs

#### Signup Page (`src/app/signup/page.tsx`)
- Uses authentication context for signup
- Automatic login after successful signup
- Role selection (viewer/creator)

#### Profile Page (`src/app/profile/page.tsx`)
- Uses authentication context for user data
- Protected route (redirects to login if not authenticated)

#### Admin Dashboard (`src/app/admin-dashboard/page.tsx`)
- Protected route (only accessible to admin users)
- Uses authentication context for user validation

#### Creator Panel (`src/app/creator-panel/page.tsx`)
- Protected route (only accessible to creator and admin users)
- Uses authentication context for user validation

### 4. API Updates

#### Login API (`src/app/api/auth/login/route.ts`)
- Returns JWT token and user data
- Role-based authentication
- Rate limiting and security features

#### Signup API (`src/app/api/auth/signup/route.ts`)
- Updated to return JWT token and user data
- Simplified validation
- Automatic login after signup

## User Roles

### Viewer (Default)
- Can read manga
- Can bookmark and track reading history
- Can leave comments and ratings
- Cannot access admin or creator features

### Creator
- All viewer permissions
- Can upload manga content
- Can manage their own content
- Can access creator panel
- Cannot access admin features

### Admin
- All creator permissions
- Can access admin dashboard
- Can moderate content
- Can manage users
- Can view site analytics

## Authentication Flow

1. **Signup**: User creates account → Gets JWT token → Automatically logged in
2. **Login**: User enters credentials → Gets JWT token → Logged in
3. **Token Storage**: JWT stored in localStorage
4. **Auto-login**: App checks for token on startup
5. **Logout**: Token removed from localStorage → Redirected to home

## Security Features

- JWT tokens with expiration (7 days)
- Password hashing with bcrypt
- Rate limiting on login attempts
- Account locking after failed attempts
- Role-based access control
- Protected API endpoints

## Usage Examples

### Checking Authentication Status
```typescript
const { user, loading } = useAuth();

if (loading) return <div>Loading...</div>;
if (!user) return <div>Please log in</div>;
```

### Role-Based Rendering
```typescript
const { user } = useAuth();

{user?.role === 'admin' && (
  <Link href="/admin-dashboard">Admin Dashboard</Link>
)}
```

### Protected Components
```typescript
const { user } = useAuth();

useEffect(() => {
  if (!user) {
    router.push('/login');
    return;
  }
  
  if (user.role !== 'admin') {
    router.push('/');
    return;
  }
}, [user, router]);
```

## Testing

To test the authentication system:

1. **Signup Flow**: Visit `/signup` → Create account → Should be automatically logged in
2. **Login Flow**: Visit `/login` → Enter credentials → Should be logged in
3. **Navigation**: Check that buttons appear/disappear based on authentication status
4. **Role Access**: 
   - Admin users should see admin dashboard
   - Non-admin users should not see admin dashboard
   - Creator users should see creator panel
   - Non-creator users should not see creator panel

## Future Enhancements

- Email verification system
- Password reset functionality
- Social login integration
- Two-factor authentication
- Session management improvements
- Refresh token rotation 