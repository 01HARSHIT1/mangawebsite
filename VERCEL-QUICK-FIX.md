# 🚨 VERCEL DEPLOYMENT - QUICK FIX

## ✅ Problem Solved!

The error you encountered:
```
Environment Variable "MONGODB_URI" references Secret "mongodb_uri", which does not exist.
```

**Has been fixed!** I've removed the secret references from `vercel.json`.

---

## 🚀 How to Deploy Now (3 Simple Steps)

### **Step 1: Import Project to Vercel**

1. Go to [https://vercel.com/new](https://vercel.com/new)
2. Sign in with GitHub
3. Click **"Import"** next to your `mangawebsite` repository

---

### **Step 2: Add Environment Variables**

**IMPORTANT:** Before clicking "Deploy", add these environment variables:

Click **"Environment Variables"** section and add:

#### **1. MONGODB_URI**
```
mongodb+srv://username:password@cluster.mongodb.net/mangawebsite?retryWrites=true&w=majority
```
**How to get this:**
- Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
- Create a free cluster (M0 - Free tier)
- Click "Connect" → "Connect your application"
- Copy the connection string
- Replace `<password>` with your actual password
- Replace database name with `mangawebsite`

#### **2. JWT_SECRET**
```
your-super-secret-random-string-here
```
**How to generate:**
- Use [randomkeygen.com](https://randomkeygen.com/)
- Or run: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
- Copy any long random string (at least 32 characters)

#### **3. NEXT_PUBLIC_API_URL** (Optional - can add later)
```
https://your-project-name.vercel.app
```
**Note:** You'll get this URL after first deployment. You can add it later.

---

### **Step 3: Deploy!**

1. After adding environment variables, click **"Deploy"**
2. Wait 3-5 minutes for the build to complete
3. Your site will be live! 🎉

---

## 📋 Environment Variable Setup (Detailed)

### **In Vercel Dashboard:**

1. **Environment Variables** section
2. Add each variable:
   - **Key**: `MONGODB_URI`
   - **Value**: Your MongoDB connection string
   - **Environments**: Check all (Production, Preview, Development)
   - Click **"Add"**

3. Repeat for `JWT_SECRET`

4. Click **"Deploy"**

---

## 🔍 MongoDB Atlas Quick Setup

### **1. Create Free Account**
- Go to [https://www.mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
- Sign up (it's free!)

### **2. Create Cluster**
- Choose **M0 FREE** tier
- Select a region (closest to you)
- Click **"Create Cluster"**

### **3. Create Database User**
- Go to **Database Access** (left sidebar)
- Click **"Add New Database User"**
- Username: `mangauser` (or any name you like)
- Password: Generate a strong password (save it!)
- Privileges: **"Read and write to any database"**
- Click **"Add User"**

### **4. Whitelist IP Addresses**
- Go to **Network Access** (left sidebar)
- Click **"Add IP Address"**
- Click **"Allow Access from Anywhere"**
- Or enter: `0.0.0.0/0`
- Click **"Confirm"**

### **5. Get Connection String**
- Go back to **Database** (left sidebar)
- Click **"Connect"** on your cluster
- Choose **"Connect your application"**
- Copy the connection string
- It looks like:
  ```
  mongodb+srv://mangauser:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
  ```
- Replace `<password>` with your actual password
- Add `/mangawebsite` before the `?`:
  ```
  mongodb+srv://mangauser:yourpassword@cluster0.xxxxx.mongodb.net/mangawebsite?retryWrites=true&w=majority
  ```

---

## ✅ Verification Checklist

Before deploying, make sure:

- ✅ MongoDB Atlas cluster is created and running
- ✅ Database user is created with password
- ✅ Network access allows `0.0.0.0/0` (all IPs)
- ✅ Connection string is correct (with password and database name)
- ✅ JWT_SECRET is a long random string
- ✅ Both environment variables are added in Vercel

---

## 🎯 After Deployment

### **Your site will be live at:**
```
https://mangawebsite-yourusername.vercel.app
```

### **Update NEXT_PUBLIC_API_URL:**
1. Go to Vercel Dashboard → Your Project
2. Go to **Settings** → **Environment Variables**
3. Add `NEXT_PUBLIC_API_URL` with your Vercel URL
4. Redeploy (Vercel will auto-redeploy when you add variables)

---

## 🐛 Troubleshooting

### **If build still fails:**

#### **Error: "Module not found"**
- ✅ Already fixed in latest code
- Make sure you're deploying from the `main` branch

#### **Error: "MongoDB connection failed"**
- Check your `MONGODB_URI` is correct
- Make sure password doesn't have special characters (or URL-encode them)
- Verify network access allows `0.0.0.0/0`

#### **Error: "Dynamic server usage"**
- ✅ Already fixed in latest code
- All routes have `export const dynamic = 'force-dynamic';`

---

## 📞 Need Help?

### **Common Issues:**

**Q: Where do I add environment variables?**
**A:** In the Vercel import screen, scroll down to "Environment Variables" section BEFORE clicking "Deploy"

**Q: Can I add environment variables after deployment?**
**A:** Yes! Go to Settings → Environment Variables → Add, then redeploy

**Q: My MongoDB connection string has special characters**
**A:** URL-encode special characters:
- `@` → `%40`
- `#` → `%23`
- `$` → `%24`
- `%` → `%25`
- `&` → `%26`

**Q: How do I redeploy?**
**A:** Go to Deployments tab → Click "..." on latest deployment → "Redeploy"

---

## ✨ You're All Set!

The configuration error is fixed. Just follow the 3 steps above and you'll be live in minutes!

**Latest commit:** `ca9df00` - Secret references removed from vercel.json

**Ready to deploy!** 🚀
