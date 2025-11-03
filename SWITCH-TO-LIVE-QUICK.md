# 🚀 Quick Switch to Live Mode - Action Plan

## Current Situation:
You're seeing "Test Mode" banner → Currently using TEST keys
You want to test Paytm, PhonePe, QR codes → Need LIVE keys

---

## 📋 What I Need From You:

### **Option 1: You Already Have Live Keys**
If you have live keys in Vercel:
1. Tell me what `RAZORPAY_KEY_ID` starts with in Vercel
2. If it starts with `rzp_live_` → I'll help you verify it's working
3. If it's still `rzp_test_` → We need to switch

### **Option 2: You Don't Have Live Keys Yet**
You need to:
1. Complete Razorpay KYC
2. Get live API keys
3. Add them to Vercel
4. Then I'll help you test

---

## 🎯 Fastest Path to Live Mode:

### **If KYC is Complete:**
1. Go to: https://dashboard.razorpay.com/app/settings/api-keys
2. Toggle to "Live Mode"
3. Copy these:
   - Live Key ID: `rzp_live_xxxxxxxxxxxxx`
   - Live Key Secret: `xxxxxxxxxxxxxxxxxxxx`
4. **Send them to me** and I'll help you update Vercel

### **If KYC is NOT Complete:**
1. Go to: https://dashboard.razorpay.com/app/settings
2. Complete KYC verification
3. Upload documents (PAN, Aadhaar, Bank details)
4. Wait for approval (1-2 business days)
5. Then get live keys

---

## 💬 What to Tell Me:
Just say:
- "I have live keys: rzp_live_xxx" → I'll help you add them
- "I need to do KYC first" → I'll guide you through it
- "What's the current mode?" → Check if you have Razorpay dashboard access

---

## 🔍 Quick Check:
Go to your Vercel dashboard:
https://vercel.com/01HARSHIT1/mangawebsite/settings/environment-variables

Look for `RAZORPAY_KEY_ID` and tell me:
1. Does it start with `rzp_test_` or `rzp_live_`?
2. That will tell us what mode you're in right now!


