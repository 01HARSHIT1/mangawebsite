# 🚀 Switching to Razorpay Live Mode - Complete Guide

## ⚠️ IMPORTANT WARNINGS:

1. **Real Money:** Live mode processes real transactions with real money
2. **Testing:** Use small amounts (₹10-50) for initial tests
3. **Refunds:** Test payments are real - no automatic refunds in test mode
4. **KYC:** Complete Razorpay KYC before switching

---

## 📋 STEP 1: Complete Razorpay KYC

1. Go to: https://dashboard.razorpay.com/app/settings
2. Complete business verification
3. Upload required documents
4. Wait for approval (usually 1-2 business days)

---

## 🔑 STEP 2: Get Live API Keys

1. Go to: https://dashboard.razorpay.com/app/settings/api-keys
2. Toggle from **Test Mode** to **Live Mode**
3. Copy these values:
   - **Live Key ID:** `rzp_live_xxxxxxxxxxxxx`
   - **Live Key Secret:** `xxxxxxxxxxxxxxxxxxxx`
   - **Webhook Secret** (if available)

---

## 🔧 STEP 3: Update Vercel Environment Variables

1. Go to: https://vercel.com/01HARSHIT1/mangawebsite/settings/environment-variables
2. Find these variables:
   - `RAZORPAY_KEY_ID`
   - `RAZORPAY_KEY_SECRET`
   - `RAZORPAY_WEBHOOK_SECRET` (optional)
3. **Delete the old TEST keys**
4. **Add NEW LIVE keys:**
   - Key: `RAZORPAY_KEY_ID`
   - Value: `rzp_live_xxxxxxxxxxxxx` (your live key)
   - Environment: ✅ Production ✅ Preview ✅ Development
   - Click **Save**
   
   - Key: `RAZORPAY_KEY_SECRET`
   - Value: `xxxxxxxxxxxxxxxxxxxx` (your live secret)
   - Environment: ✅ Production ✅ Preview ✅ Development
   - Click **Save**

5. **Redeploy:**
   - Go to: https://vercel.com/01HARSHIT1/mangawebsite/deployments
   - Click the latest deployment
   - Click **Redeploy**
   - Or just wait - Vercel auto-redeploys on env var changes

---

## 🧪 STEP 4: Test in Live Mode

### **Wait for Redeploy (2-3 minutes)**

### **Test 1: Check Payment Options**
1. Go to: https://mangawebsite.vercel.app/coins
2. Click "Pay via Razorpay" on any package
3. **Verify you see:**
   - ✅ UPI option
   - ✅ **Paytm** wallet ✅ **PhonePe** wallet (NEW!)
   - ✅ Google Pay, Paytm wallets
   - ✅ All major banks
   - ✅ Cards (should work now!)

### **Test 2: Test with Real Small Payment**
1. Select smallest package (₹82.17 / $0.99)
2. Click "Pay via Razorpay"
3. Try different methods:
   - **UPI:** Use your real UPI ID (or test before confirming)
   - **Paytm/PhonePe:** See if they appear in wallets
   - **Google Pay:** Should work now
   - **Cards:** Should work in live mode!
4. Make a real small payment (₹10-50)
5. Verify coins are credited
6. Check Razorpay dashboard for payment records

### **Test 3: QR Code Test**
1. Click "Pay via Razorpay"
2. Look for "Scan QR" option
3. If available, scan with Google Pay/PhonePe
4. Should work properly in live mode!

---

## ✅ What Works in Live Mode:

- ✅ All Indian Cards (Credit/Debit)
- ✅ UPI (all apps: PhonePe, GPay, Paytm, BHIM)
- ✅ **Paytm Wallet** 🎉
- ✅ **PhonePe Wallet** 🎉
- ✅ All popular wallets
- ✅ Net Banking (all major banks)
- ✅ **QR Code Scanning** 🎉
- ✅ All payment methods you saw failing in test mode

---

## 💰 Testing Safely:

### **Option 1: Dry Run (No Real Payment)**
- Open payment modal
- Check all options are visible
- Don't complete payment
- Just verify UI shows Paytm, PhonePe, etc.

### **Option 2: Small Real Payment**
- Start with ₹10-20
- Test one payment method
- Verify coins credited
- Then test other methods

### **Option 3: Use Razorpay Test Payment Option**
- Some payment apps have "test payment" mode
- Check if your wallet has test mode

---

## 🎯 Expected Results:

### **✅ Success Indicators:**
- Payment modal shows Paytm, PhonePe, etc.
- Cards don't show "international cards not supported"
- QR codes can be scanned successfully
- All major banks appear in net banking
- Payments complete successfully
- Coins are credited to account

### **❌ If Something Fails:**
- Check Vercel logs for errors
- Verify live keys are correct in environment variables
- Check Razorpay dashboard for payment status
- Contact me with specific error message

---

## 📝 Testing Checklist:

- [ ] KYC completed in Razorpay
- [ ] Switched to Live Mode in Razorpay dashboard
- [ ] Got Live API Keys
- [ ] Updated Vercel environment variables
- [ ] Redeployed on Vercel
- [ ] Test payment modal shows all options
- [ ] Successfully made a test payment
- [ ] Coins were credited
- [ ] Verified in Razorpay dashboard

---

## 🆘 Troubleshooting:

### **Still Seeing Test Mode:**
- Clear browser cache
- Hard refresh (Ctrl+F5)
- Check environment variables are saved
- Wait 5 minutes for redeploy

### **Cards Still Not Working:**
- Make sure you're in live mode, not test mode
- Check Razorpay account is fully verified
- Try different card

### **Paytm/PhonePe Still Not Showing:**
- Clear cache and hard refresh
- Verify live keys are active
- Check if your Razorpay account supports these wallets

---

## 🎉 Ready to Switch?

Let me know when you:
1. ✅ Complete KYC
2. ✅ Get Live API Keys
3. ✅ Ready to update Vercel

Then I'll help you update the environment variables and test!


