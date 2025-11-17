# Admin Dashboard Setup Guide

## Admin Authentication

The admin dashboard uses a secure, dedicated authentication system that is separate from regular user login.

### Setting Up Admin Credentials

1. **Environment Variables**

   Add the following environment variables to your `.env.local` file:

   ```env
   ADMIN_EMAIL=your-admin-email@example.com
   ADMIN_PASSWORD=your-secure-admin-password
   ADMIN_USERNAME=admin
   ```

   **Important Security Notes:**
   - Use a strong, unique password for `ADMIN_PASSWORD`
   - Never commit these credentials to version control
   - Use different credentials for production and development
   - Consider using a password manager to generate and store the password

2. **Accessing Admin Dashboard**

   - Navigate to `/admin/login` in your browser
   - Enter the admin email and password you set in environment variables
   - You will be redirected to `/admin/dashboard` upon successful login

3. **Admin Account Creation**

   - The admin account is automatically created on first login if it doesn't exist
   - The account will have `role: 'admin'` in the database
   - Only the email/password combination specified in environment variables can access the admin dashboard

## Admin Dashboard Features

### ✅ Implemented Features

1. **Secure Admin Login** (`/admin/login`)
   - Separate authentication from regular users
   - Environment variable-based credentials
   - Automatic admin account creation

2. **Dashboard Overview** (`/admin/dashboard`)
   - Platform statistics
   - Quick actions
   - Recent activity feed

3. **User Management** (`/admin/users`)
   - View all users (readers + creators)
   - Search/filter by username, email, role, status
   - Suspend/ban users
   - Verify creator accounts
   - Upgrade users to creator/admin roles

4. **Content Management** (`/admin/content`)
   - View all manga and chapters
   - Edit/delete content
   - Approve/reject submissions

5. **Content Moderation** (`/admin/moderation`)
   - Review content reports
   - Resolve/reject reports
   - View report details

6. **Homepage Control** (`/admin/homepage`)
   - Manage banners and sliders
   - Configure homepage sections
   - Reorder sections

7. **System Settings** (`/admin/settings`)
   - Maintenance mode toggle
   - Registration controls
   - Upload limits
   - Performance settings (CDN, cache)

### 🚧 Features to Implement

The following features have the structure in place but need full implementation:

1. **Analytics Dashboard** (`/admin/analytics`)
   - Platform analytics (visitors, reading time, bounce rate)
   - Content analytics (views, likes, completion rates)
   - Creator analytics (earnings, performance)
   - Device breakdown
   - Retention metrics

2. **Creator Management** (`/admin/creators`)
   - Revenue share configuration
   - Upload limits
   - Verification badges
   - Support tickets

3. **Monetization Management** (`/admin/monetization`)
   - Coin packages
   - Discounts & promo codes
   - Payment tracking
   - Refund management
   - Ad placement management

4. **Community Tools** (`/admin/community`)
   - Comments moderation
   - Ratings management
   - User reports system

5. **SEO & Metadata** (`/admin/seo`)
   - Meta tags editor
   - Structured data
   - Sitemap generation
   - Canonical URLs

6. **Notifications System** (`/admin/notifications`)
   - Push notifications
   - Email notifications
   - Targeted messaging

7. **AI Features** (`/admin/ai`)
   - Recommendation engine
   - Quality checks
   - NSFW detection
   - OCR/transcription

## API Endpoints

### Admin Authentication
- `POST /api/admin/auth/login` - Admin login

### Admin Stats
- `GET /api/admin/stats` - Platform statistics

### User Management
- `GET /api/admin/users` - List users with filters
- `PUT /api/admin/users/[userId]` - Update user (suspend, ban, promote)
- `GET /api/admin/users/[userId]` - Get user details

### Content Management
- `GET /api/admin/manga` - List all manga
- `PATCH /api/admin/manga/[mangaId]` - Update manga
- `DELETE /api/admin/manga/[mangaId]` - Delete manga

### Moderation
- `GET /api/admin/reports` - List reports
- `PUT /api/admin/reports` - Update report status

### Settings
- `GET /api/admin/settings` - Get system settings
- `PUT /api/admin/settings` - Update system settings

## Security Best Practices

1. **Environment Variables**
   - Never hardcode admin credentials
   - Use different credentials for each environment
   - Rotate passwords regularly

2. **Access Control**
   - Admin routes are protected by `requireAdmin` middleware
   - Only users with `role: 'admin'` can access admin features
   - All admin actions are logged in `admin_logs` collection

3. **Session Management**
   - Admin sessions use JWT tokens
   - Tokens expire after 7 days
   - Logout clears tokens from localStorage

4. **Audit Logging**
   - All admin actions are logged with:
     - Admin ID and email
     - Action type
     - Timestamp
     - IP address
     - User agent

## Database Collections

### Admin Logs
```javascript
{
  adminId: ObjectId,
  adminEmail: string,
  action: string, // e.g., 'admin_login', 'user_ban', 'content_delete'
  timestamp: Date,
  ipAddress: string,
  userAgent: string,
  details: object // Additional action-specific data
}
```

## Troubleshooting

### Cannot Login to Admin Dashboard

1. Check that environment variables are set correctly:
   ```bash
   echo $ADMIN_EMAIL
   echo $ADMIN_PASSWORD
   ```

2. Verify the admin account exists in the database:
   ```javascript
   db.users.findOne({ email: 'your-admin-email@example.com', role: 'admin' })
   ```

3. Check server logs for authentication errors

### Admin Account Not Created

- The admin account is created automatically on first login
- If it fails, check MongoDB connection and permissions
- Verify environment variables are loaded correctly

### Access Denied Errors

- Ensure your user has `role: 'admin'` in the database
- Check that the JWT token is valid and not expired
- Verify the `requireAdmin` middleware is working correctly

## Next Steps

1. Set up environment variables for admin credentials
2. Test admin login at `/admin/login`
3. Explore the dashboard and familiarize yourself with features
4. Implement remaining features as needed
5. Customize the dashboard to match your platform's needs

## Support

For issues or questions about the admin dashboard:
1. Check the server logs for error messages
2. Review the API endpoint responses
3. Verify database collections and permissions
4. Check environment variable configuration

