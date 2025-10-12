# 🔧 MongoDB Connection Error - COMPLETE FIX

## ❌ The Error You're Seeing:

```
Error: querySrv ENOTFOUND _mongodb._tcp.cluster.mongodb.net
```

**This means**: Your MongoDB connection string is **incomplete** or **incorrect**.

---

## ✅ THE SOLUTION:

Your `MONGODB_URI` environment variable in Vercel is **NOT complete**. You need to add your **actual cluster details**.

---

## 📋 Step-by-Step Fix:

### **Step 1: Get Your CORRECT MongoDB Connection String**

1. Go to [MongoDB Atlas](https://cloud.mongodb.com)
2. Log in to your account
3. Click on your cluster (or create one if you haven't)
4. Click the **"Connect"** button
5. Choose **"Connect your application"**
6. **Copy the connection string** - it should look like:

```
mongodb+srv://YOUR_USERNAME:YOUR_PASSWORD@cluster0.abc123.mongodb.net/?retryWrites=true&w=majority
```

**IMPORTANT**: Your actual string will have:
- A real username (not `YOUR_USERNAME`)
- A real password (not `YOUR_PASSWORD`)
- A real cluster name (like `cluster0.abc123` - yours will be different!)

---

### **Step 2: Modify the Connection String**

Take your connection string and add `/mangawebsite` **before** the `?`:

**BEFORE:**
```
mongodb+srv://mangauser:MyPassword123@cluster0.abc123.mongodb.net/?retryWrites=true&w=majority
```

**AFTER:**
```
mongodb+srv://mangauser:MyPassword123@cluster0.abc123.mongodb.net/mangawebsite?retryWrites=true&w=majority
```

Notice: `/mangawebsite` is added after `.net` and before the `?`

---

### **Step 3: Update Vercel Environment Variable**

1. Go to your Vercel Dashboard
2. Click on your project
3. Go to **Settings** → **Environment Variables**
4. Find `MONGODB_URI`
5. Click **"Edit"**
6. Replace with your **COMPLETE** connection string
7. Make sure all three environments are checked:
   - ☑ Production
   - ☑ Preview
   - ☑ Development
8. Click **"Save"**

---

### **Step 4: Redeploy**

1. Go to **Deployments** tab
2. Click **"..."** on the latest deployment
3. Click **"Redeploy"**
4. Wait for the build to complete

---

## 🎯 EXAMPLE (With Fake Data):

### ❌ **WRONG** (What you might have now):
```
mongodb+srv://username:password@cluster.mongodb.net/mangawebsite
```
This is incomplete! Missing the actual cluster details.

### ✅ **CORRECT** (What you need):
```
mongodb+srv://mangauser:SecurePass123@cluster0.xyzabc.mongodb.net/mangawebsite?retryWrites=true&w=majority
```

---

## 🔍 How to Find Your Cluster Name:

1. In MongoDB Atlas, look at your cluster
2. The cluster name is shown at the top (usually `Cluster0` or similar)
3. The full cluster address includes random characters like `cluster0.xyzabc`
4. **Use the connection string from the "Connect" button** - it has everything!

---

## ⚠️ Common Mistakes:

### **Mistake 1: Using Template Values**
```
❌ mongodb+srv://username:password@cluster.mongodb.net/...
```
You need to replace `username`, `password`, and `cluster` with YOUR actual values!

### **Mistake 2: Missing Database Name**
```
❌ mongodb+srv://user:pass@cluster0.abc.mongodb.net/?retryWrites=true
```
Add `/mangawebsite` before the `?`:
```
✅ mongodb+srv://user:pass@cluster0.abc.mongodb.net/mangawebsite?retryWrites=true
```

### **Mistake 3: Special Characters Not Encoded**
If your password has special characters like `@`, `#`, `$`, etc., you need to URL-encode them:
- `@` → `%40`
- `#` → `%23`
- `$` → `%24`
- `%` → `%25`
- `&` → `%26`

Example:
```
Password: MyPass@123
Encoded:  MyPass%40123
```

---

## 📝 Complete Checklist:

Before redeploying, verify:

- ✅ You have a MongoDB Atlas account
- ✅ You have created a cluster (M0 Free tier is fine)
- ✅ You have created a database user with password
- ✅ Network Access allows `0.0.0.0/0` (all IPs)
- ✅ You copied the connection string from the "Connect" button
- ✅ You replaced `<password>` with your actual password
- ✅ You added `/mangawebsite` before the `?`
- ✅ Special characters in password are URL-encoded
- ✅ You updated the `MONGODB_URI` in Vercel
- ✅ All three environments are checked (Production, Preview, Development)

---

## 🧪 Test Your Connection String Locally:

Before deploying, test it locally:

1. Create a file `test-connection.js`:
```javascript
const { MongoClient } = require('mongodb');

const uri = 'YOUR_COMPLETE_CONNECTION_STRING_HERE';

async function testConnection() {
    const client = new MongoClient(uri);
    try {
        await client.connect();
        console.log('✅ Connected successfully!');
        await client.db('mangawebsite').command({ ping: 1 });
        console.log('✅ Database accessible!');
    } catch (error) {
        console.error('❌ Connection failed:', error.message);
    } finally {
        await client.close();
    }
}

testConnection();
```

2. Run it:
```bash
node test-connection.js
```

3. If it works locally, it will work on Vercel!

---

## 🆘 Still Not Working?

### **Check 1: MongoDB Atlas Network Access**
1. Go to MongoDB Atlas
2. Click **"Network Access"** in the left sidebar
3. Make sure you have an entry for `0.0.0.0/0` (Allow access from anywhere)
4. If not, click **"Add IP Address"** → **"Allow Access from Anywhere"**

### **Check 2: Database User Exists**
1. Go to **"Database Access"** in MongoDB Atlas
2. Make sure you have a user created
3. The username and password in your connection string must match this user

### **Check 3: Cluster is Running**
1. Go to **"Database"** in MongoDB Atlas
2. Make sure your cluster shows as "Running" (not paused)

---

## 🎉 Success Indicators:

After fixing and redeploying, you should see:
- ✅ No more `ENOTFOUND` errors in Vercel logs
- ✅ Build completes successfully
- ✅ Website loads without database errors
- ✅ You can register/login users
- ✅ Manga data loads correctly

---

## 📞 Quick Reference:

**MongoDB Atlas**: https://cloud.mongodb.com
**Vercel Dashboard**: https://vercel.com/dashboard

**Connection String Format**:
```
mongodb+srv://[USERNAME]:[PASSWORD]@[CLUSTER-ADDRESS]/[DATABASE]?retryWrites=true&w=majority
```

**Example**:
```
mongodb+srv://mangauser:SecurePass123@cluster0.xyzabc.mongodb.net/mangawebsite?retryWrites=true&w=majority
```

---

**Fix this first, then redeploy, and all 6 errors should be resolved!** 🚀
