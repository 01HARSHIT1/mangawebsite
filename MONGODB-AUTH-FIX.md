# 🔧 MongoDB Authentication Fix Guide

## 🚨 **CURRENT ERROR:**
```
MongoServerError: bad auth : authentication failed
```

## 🔍 **POSSIBLE CAUSES:**

### 1. **Wrong Username/Password**
- Double-check your MongoDB Atlas credentials
- Username: `mangauser`
- Password: `IL1XzLOGcSfHFLvt`

### 2. **Database User Permissions**
- Your user might not have the right permissions
- Need "Read and write to any database" permission

### 3. **IP Address Not Whitelisted**
- Vercel's IP addresses need to be whitelisted
- Should have `0.0.0.0/0` (allow from anywhere)

### 4. **Database Name Mismatch**
- Connection string should point to `mangawebsite` database

---

## 🔧 **STEP-BY-STEP FIX:**

### **Step 1: Verify Database User**
1. Go to MongoDB Atlas → Database Access
2. Find your user `mangauser`
3. Click "Edit" next to the user
4. Make sure:
   - **Database User Privileges**: "Read and write to any database"
   - **Password**: Reset if needed (save the new password!)

### **Step 2: Check Network Access**
1. Go to MongoDB Atlas → Network Access
2. Make sure you have `0.0.0.0/0` (allow from anywhere)
3. If not, click "Add IP Address" → "Allow Access from Anywhere"

### **Step 3: Test Connection String**
1. Go to MongoDB Atlas → Database → Connect
2. Choose "Connect your application"
3. Copy the connection string
4. Make sure it looks like:
   ```
   mongodb+srv://mangauser:YOUR_PASSWORD@cluster0.fqyro7j.mongodb.net/mangawebsite?retryWrites=true&w=majority&appName=Cluster0
   ```

### **Step 4: Update Vercel Environment Variable**
1. Go to Vercel → Your Project → Settings → Environment Variables
2. Find `MONGODB_URI`
3. Update with the correct connection string
4. Make sure to include `/mangawebsite` in the path

### **Step 5: Redeploy**
1. Go to Vercel → Deployments
2. Click "Redeploy" on the latest deployment

---

## 🧪 **TEST YOUR CONNECTION:**

### **Method 1: MongoDB Compass**
1. Open MongoDB Compass
2. Paste your connection string
3. Click "Connect"
4. If it works, the credentials are correct

### **Method 2: Create Test User**
If the above doesn't work, create a new user:
1. Go to Database Access → Add New Database User
2. Username: `testuser`
3. Password: `testpass123`
4. Database User Privileges: "Read and write to any database"
5. Use this connection string:
   ```
   mongodb+srv://testuser:testpass123@cluster0.fqyro7j.mongodb.net/mangawebsite?retryWrites=true&w=majority&appName=Cluster0
   ```

---

## ⚠️ **COMMON MISTAKES:**

### ❌ **Wrong Database Name**
```
mongodb+srv://mangauser:password@cluster0.abc.mongodb.net/?retryWrites=true&w=majority
                                                          ^
                                                          Missing /mangawebsite
```

### ✅ **Correct Database Name**
```
mongodb+srv://mangauser:password@cluster0.abc.mongodb.net/mangawebsite?retryWrites=true&w=majority
                                                          ^^^^^^^^^^^^^
                                                          Database name included
```

### ❌ **Wrong Permissions**
- User only has "Read" permission
- User only has access to specific database

### ✅ **Correct Permissions**
- User has "Read and write to any database"
- User can access all databases

---

## 🎯 **QUICK FIX CHECKLIST:**

- [ ] Username is correct (`mangauser`)
- [ ] Password is correct (`IL1XzLOGcSfHFLvt`)
- [ ] User has "Read and write to any database" permission
- [ ] Network Access allows `0.0.0.0/0`
- [ ] Connection string includes `/mangawebsite`
- [ ] Vercel environment variable is updated
- [ ] Project is redeployed

---

## 🆘 **IF STILL NOT WORKING:**

### **Option 1: Reset User Password**
1. Go to Database Access
2. Click "Edit" next to `mangauser`
3. Click "Edit Password"
4. Generate new password
5. Update Vercel with new password

### **Option 2: Create New User**
1. Create new user with simple password
2. Use new credentials in Vercel
3. Test connection

### **Option 3: Check Cluster Status**
1. Make sure your cluster is running
2. Check if it's paused (free tier pauses after inactivity)

---

## 📞 **NEED HELP?**

If you're still having issues:
1. Double-check all steps above
2. Try creating a new user with a simple password
3. Test the connection string in MongoDB Compass first
4. Make sure your cluster is running and not paused

The most common issue is wrong permissions or missing database name in the connection string!
