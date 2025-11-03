# 🔑 How to Get Razorpay Live API Keys - Step by Step Guide

## 📋 Prerequisites:

Before getting live keys, you need:
- ✅ Razorpay account created
- ✅ Business verification (KYC) completed
- ✅ Bank account linked
- ✅ Documents uploaded (PAN, Address Proof, etc.)

---

## 🎯 STEP 1: Complete Razorpay KYC (If Not Done)

### **A. Go to KYC Section:**
1. Login to: https://dashboard.razorpay.com/login
2. Go to: **Settings** → **Business Profile**
3. Or: https://dashboard.razorpay.com/app/settings

### **B. Upload Required Documents:**

#### **1. Business PAN Card:**
- Upload: PAN card copy
- Status: Verified automatically

#### **2. Bank Account Details:**
- Add: Bank account number
- Add: IFSC code
- Add: Account holder name
- Verify: Email OTP or Bank OTP

#### **3. Address Proof:**
- Options: Electricity bill, Bank statement, Rent agreement
- Must show: Business address
- Valid within: Last 3 months

#### **4. Business Verification:**
- If registered company: Company registration documents
- If individual: Aadhaar/PAN

### **C. Submit for Verification:**
- Click: **Submit for Verification**
- Wait: 1-2 business days
- You'll get: Email notification when approved

---

## 🔑 STEP 2: Get Live API Keys

### **Once KYC is Verified:**

1. **Go to API Keys Section:**
   ```
   https://dashboard.razorpay.com/app/settings/api-keys
   ```

2. **Check Current Mode:**
   - If you see **"Test Mode"** → Continue to step 3
   - If you see **"Live Mode"** → Keys are already live!

3. **Switch to Live Mode:**
   - Look for toggle switch: **Test Mode** ⇄ **Live Mode**
   - Click toggle to switch to **Live Mode**
   - Confirmation: "Switching to Live Mode will enable real payments"

4. **Get Live Keys:**
   - After switching, you'll see:
     ```
     Key ID: rzp_live_xxxxxxxxxxxxx
     Key Secret: xxxxxxxxxxxxxxxxxx
     ```
   - **Copy both values**

5. **Important Settings:**
   - **Webhook URL:** Set to `https://mangawebsite.vercel.app/api/razorpay/webhook`
   - **Selected Events:** Enable all payment events
   - **Webhook Secret:** Copy this if provided

---

## 🔧 STEP 3: Update Vercel Environment Variables

### **Now That You Have Live Keys:**

1. **Go to Vercel:**
   ```
   https://vercel.com/01HARSHIT1/mangawebsite/settings/environment-variables
   ```

2. **Update RAZORPAY_KEY_ID:**
   - Find variable: `RAZORPAY_KEY_ID`
   - Click edit/remove old value
   - Enter: `rzp_live_xxxxxxxxxxxxx` (your live key ID)
   - Make sure checked for: ✅ Production ✅ Preview ✅ Development
   - Click **Save**

3. **Update RAZORPAY_KEY_SECRET:**
   - Find variable: `RAZORPAY_KEY_SECRET`
   - Click edit/remove old value
   - Enter: `xxxxxxxxxxxxxxxxxxxx` (your live secret)
   - Make sure checked for: ✅ Production ✅ Preview ✅ Development
   - Click **Save**

4. **Update RAZORPAY_WEBHOOK_SECRET (Optional):**
   - If you got a webhook secret from Razorpay
   - Add as: `RAZORPAY_WEBHOOK_SECRET`
   - Value: The webhook secret from Razorpay

5. **Redeploy (Automatic):**
   - Vercel will auto-redeploy in 2-3 minutes
   - Or manually: Go to Deployments → Redeploy

---

## ✅ STEP 4: Verify Live Mode

### **After 2-3 Minutes:**

1. **Go to:** https://mangawebsite.vercel.app/coins
2. **Click:** Pay via Razorpay on any package
3. **Check:**
   - ✅ No "Test Mode" banner on payment modal
   - ✅ You see Paytm, PhonePe in wallet options
   - ✅ Cards work without "international cards" error
   - ✅ QR codes work properly

---

## 🧪 STEP 5: Test Live Payments

### **Start with Small Test:**

1. Select smallest package (₹82.17)
2. Try payment with:
   - **UPI:** Your real UPI ID
   - **Paytm:** Should appear now!
   - **PhonePe:** Should appear now!
   - **Cards:** Should work now!

3. **Make a small real payment** (₹10-20)
4. Verify coins are credited
5. Check Razorpay dashboard for payment record

---

## ⚠️ IMPORTANT NOTES:

### **Before Switching to Live Mode:**
- ✅ Complete all KYC documents
- ✅ Verify bank account is linked
- ✅ Business details are verified
- ✅ Read Razorpay live mode terms

### **After Switching to Live Mode:**
- ⚠️ Real money transactions (be careful!)
- ⚠️ No automatic test mode refunds
- ✅ All payment methods work
- ✅ Better for production

---

## 🆘 If KYC Takes Too Long:

### **Alternative:**
You can keep testing in test mode with:
- ✅ UPI (works perfectly)
- ✅ Available wallets (Mobikwik, etc.)
- ✅ Net Banking
- ⚠️ Limited wallet options

### **Then:**
Once KYC is approved:
1. Get live keys (5 minutes)
2. Update Vercel (2 minutes)
3. Switch to live mode
4. Test with real small payment

---

## 📞 Quick Checklist:

**To Get Live Keys:**
- [ ] Login to Razorpay dashboard
- [ ] Check KYC status
- [ ] If complete: Toggle to Live Mode
- [ ] Copy Live Key ID
- [ ] Copy Live Key Secret
- [ ] Copy Webhook Secret (if provided)
- [ ] Update Vercel environment variables
- [ ] Wait for auto-redeploy
- [ ] Test payment

**Share with me:**
1. Have you completed KYC in Razorpay?
2. Can you toggle to Live Mode?
3. What are your Live API keys? (I'll help you add them)

Let me know where you are in this process!


