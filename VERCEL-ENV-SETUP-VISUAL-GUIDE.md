# 🎯 Vercel Environment Variables - Visual Guide

## 📝 How to Add Environment Variables in Vercel

When you're importing your project in Vercel, you'll see a section called **"Environment Variables"**. Here's exactly what to do:

---

## 🔑 VARIABLE 1: MONGODB_URI

### **Where to Enter:**

```
┌─────────────────────────────────────────────────────────┐
│  Environment Variables                                  │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Key (Name):    [MONGODB_URI                      ]    │
│                                                         │
│  Value:         [mongodb+srv://username:password...  ] │
│                                                         │
│  Environments:  ☑ Production  ☑ Preview  ☑ Development │
│                                                         │
│                              [Add]                      │
└─────────────────────────────────────────────────────────┘
```

### **Step-by-Step:**

1. **In the "Key" field, type:**
   ```
   MONGODB_URI
   ```
   *(Exactly as shown - all caps, with underscore)*

2. **In the "Value" field, paste your MongoDB connection string:**
   ```
   mongodb+srv://username:password@cluster.mongodb.net/mangawebsite?retryWrites=true&w=majority
   ```
   
   **IMPORTANT:** Replace:
   - `username` → Your MongoDB Atlas username
   - `password` → Your actual MongoDB password
   - `cluster` → Your actual cluster name (like `cluster0.abc123`)

3. **Check all three environments:**
   - ☑ Production
   - ☑ Preview
   - ☑ Development

4. **Click "Add"**

---

## 🔐 VARIABLE 2: JWT_SECRET

### **Where to Enter:**

```
┌─────────────────────────────────────────────────────────┐
│  Environment Variables                                  │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Key (Name):    [JWT_SECRET                       ]    │
│                                                         │
│  Value:         [a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6...] │
│                                                         │
│  Environments:  ☑ Production  ☑ Preview  ☑ Development │
│                                                         │
│                              [Add]                      │
└─────────────────────────────────────────────────────────┘
```

### **Step-by-Step:**

1. **In the "Key" field, type:**
   ```
   JWT_SECRET
   ```
   *(Exactly as shown - all caps, with underscore)*

2. **In the "Value" field, paste a long random string:**
   ```
   a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6
   ```
   
   **Generate one here:**
   - Go to: https://randomkeygen.com/
   - Copy any "Fort Knox Password" (long random string)
   - Or use this command in your terminal:
     ```bash
     node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
     ```

3. **Check all three environments:**
   - ☑ Production
   - ☑ Preview
   - ☑ Development

4. **Click "Add"**

---

## 📸 Visual Example

### **What You'll See in Vercel:**

```
┌────────────────────────────────────────────────────────────────┐
│                                                                │
│  Configure Project                                             │
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │  Build and Output Settings                              │ │
│  │  Framework Preset: Next.js                              │ │
│  │  Build Command: npm run build                           │ │
│  │  Output Directory: .next                                │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │  Environment Variables                    ← HERE!       │ │
│  │                                                          │ │
│  │  Key                                                     │ │
│  │  ┌────────────────────────────────────────────────────┐ │ │
│  │  │ MONGODB_URI                                        │ │ │
│  │  └────────────────────────────────────────────────────┘ │ │
│  │                                                          │ │
│  │  Value (will be encrypted)                               │ │
│  │  ┌────────────────────────────────────────────────────┐ │ │
│  │  │ mongodb+srv://user:pass@cluster.mongodb.net/...   │ │ │
│  │  └────────────────────────────────────────────────────┘ │ │
│  │                                                          │ │
│  │  ☑ Production  ☑ Preview  ☑ Development                 │ │
│  │                                                          │ │
│  │                                            [Add]         │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                │
│                                                   [Deploy]     │
└────────────────────────────────────────────────────────────────┘
```

---

## ✅ Complete Example

### **After Adding Both Variables, You Should See:**

```
Environment Variables (2)

┌─────────────────────────────────────────────────────────────┐
│ MONGODB_URI                                                 │
│ mongodb+srv://***@cluster0.mongodb.net/mangawebsite         │
│ Production, Preview, Development                            │
│                                                    [Edit]   │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ JWT_SECRET                                                  │
│ ********************************** (hidden)                 │
│ Production, Preview, Development                            │
│                                                    [Edit]   │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎯 Quick Copy-Paste Template

### **For MONGODB_URI:**

**Key:**
```
MONGODB_URI
```

**Value Template (Replace the parts in CAPS):**
```
mongodb+srv://YOUR_USERNAME:YOUR_PASSWORD@YOUR_CLUSTER.mongodb.net/mangawebsite?retryWrites=true&w=majority
```

**Example (with fake data):**
```
mongodb+srv://mangauser:MySecurePass123@cluster0.abc123.mongodb.net/mangawebsite?retryWrites=true&w=majority
```

---

### **For JWT_SECRET:**

**Key:**
```
JWT_SECRET
```

**Value (Generate a random one):**
```
Use randomkeygen.com or run:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Example (DO NOT USE THIS - Generate your own!):**
```
a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6
```

---

## ⚠️ Common Mistakes to Avoid

### ❌ **WRONG:**
```
Key: mongodb_uri          ← lowercase
Value: MONGODB_URI        ← swapped!
```

### ✅ **CORRECT:**
```
Key: MONGODB_URI          ← This is the variable name
Value: mongodb+srv://...  ← This is the actual connection string
```

---

### ❌ **WRONG:**
```
Key: JWT_SECRET
Value: JWT_SECRET         ← Don't put the key name as value!
```

### ✅ **CORRECT:**
```
Key: JWT_SECRET
Value: a1b2c3d4e5f6...    ← Actual random string
```

---

## 🔍 How to Get Your MongoDB Connection String

### **Step 1: Go to MongoDB Atlas**
- Visit: https://cloud.mongodb.com
- Log in to your account

### **Step 2: Click "Connect" on Your Cluster**
- Go to "Database" in the left sidebar
- Find your cluster
- Click the "Connect" button

### **Step 3: Choose "Connect your application"**
- Select "Drivers" method
- Choose: Driver: Node.js, Version: 4.1 or later

### **Step 4: Copy the Connection String**
You'll see something like:
```
mongodb+srv://mangauser:<password>@cluster0.abc123.mongodb.net/?retryWrites=true&w=majority
```

### **Step 5: Modify It**
1. Replace `<password>` with your actual password
2. Add `/mangawebsite` after `.net` and before the `?`:
   ```
   mongodb+srv://mangauser:YourPassword@cluster0.abc123.mongodb.net/mangawebsite?retryWrites=true&w=majority
   ```

---

## 🎉 Final Checklist

Before clicking "Deploy", make sure:

- ✅ You've added **MONGODB_URI** with your actual connection string
- ✅ You've added **JWT_SECRET** with a long random string
- ✅ Both variables have all three environments checked
- ✅ Your MongoDB password doesn't have special characters (or is URL-encoded)
- ✅ You've replaced `<password>` in the connection string
- ✅ You've added `/mangawebsite` to the connection string

---

## 🚀 Ready to Deploy!

Once you've added both environment variables:
1. Scroll down
2. Click the big **"Deploy"** button
3. Wait 3-5 minutes
4. Your site will be live! 🎉

---

## 💡 Pro Tips

### **Tip 1: Test Your Connection String**
Before deploying, you can test your MongoDB connection string locally:
```bash
# In your terminal
node -e "const { MongoClient } = require('mongodb'); const client = new MongoClient('YOUR_CONNECTION_STRING'); client.connect().then(() => { console.log('✅ Connected!'); client.close(); }).catch(err => console.error('❌ Error:', err));"
```

### **Tip 2: Special Characters in Password**
If your MongoDB password has special characters, URL-encode them:
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

### **Tip 3: Add Variables After Deployment**
You can also add environment variables after deployment:
1. Go to your project in Vercel Dashboard
2. Click "Settings"
3. Click "Environment Variables"
4. Add new variables
5. Redeploy (Vercel will prompt you)

---

## 📞 Need Help?

If you get stuck:
1. Double-check your MongoDB connection string
2. Make sure you've replaced `<password>` with your actual password
3. Verify your MongoDB Atlas cluster is running
4. Check that Network Access allows `0.0.0.0/0` in MongoDB Atlas

---

**You're all set! Just follow the steps above and you'll be deployed in minutes!** 🚀
