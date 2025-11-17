# Admin Dashboard Test Credentials

## ✅ Server Status
The development server should now be running at: **http://localhost:3000**

## 🔐 Admin Login Credentials

**Email:** `admin@mangawebsite.com`  
**Password:** `Admin123!Secure`

## 📝 Testing Steps

1. **Open your browser** and navigate to:
   ```
   http://localhost:3000/admin/login
   ```

2. **Enter the credentials:**
   - Email: `admin@mangawebsite.com`
   - Password: `Admin123!Secure`

3. **Click "Sign in as Admin"**

4. **Expected Result:**
   - You should be redirected to `/admin/dashboard`
   - You'll see the admin dashboard with:
     - Platform statistics
     - Quick action cards
     - Navigation sidebar with all sections

## 🧪 Test All Features

After logging in, test these sections:

1. **Overview** - Main dashboard with stats
2. **User Management** - `/admin/users`
3. **Content Management** - `/admin/content`
4. **Content Moderation** - `/admin/moderation`
5. **Homepage Control** - `/admin/homepage`
6. **Analytics** - `/admin/analytics`
7. **Creator Management** - `/admin/creators`
8. **Monetization** - `/admin/monetization`
9. **Community Tools** - `/admin/community`
10. **SEO & Metadata** - `/admin/seo`
11. **Notifications** - `/admin/notifications`
12. **Settings** - `/admin/settings`
13. **AI Features** - `/admin/ai`

## 🔍 Troubleshooting

If login doesn't work:

1. **Check server is running:**
   - Look for "Ready" message in terminal
   - Server should be on port 3000

2. **Verify environment variables:**
   - Check `.env.local` file exists
   - Should contain:
     ```
     ADMIN_EMAIL=admin@mangawebsite.com
     ADMIN_PASSWORD=Admin123!Secure
     ADMIN_USERNAME=admin
     ```

3. **Check MongoDB connection:**
   - Ensure MongoDB URI is correct in `.env.local`
   - Admin account is created automatically on first login

4. **Check browser console:**
   - Open DevTools (F12)
   - Look for any errors in Console tab

5. **Check server logs:**
   - Look at terminal output for any errors
   - Should see API route being called

## 📊 First Login Behavior

- On first login, the admin account is **automatically created** in MongoDB
- The account will have `role: 'admin'`
- You can verify this by checking the `users` collection in MongoDB

## 🔒 Security Note

These are test credentials. For production:
- Use a strong, unique password
- Never commit `.env.local` to Git
- Use different credentials for production environment

---

**Ready to test!** Open http://localhost:3000/admin/login and use the credentials above.

