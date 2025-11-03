# ✅ Switch to Live Mode - Current Steps

## 🔑 Live Keys Received:

```
RAZORPAY_KEY_ID=rzp_live_RYmFOyDhOAEolS
RAZORPAY_KEY_SECRET=IxdDhYkxs4LXB3wfSjatCTl6
RAZORPAY_WEBHOOK_SECRET=fkCUmmQh8@83VLK (stays the same)
```

---

## 🎯 Update Vercel NOW:

### **Step 1: Go to Vercel Environment Variables**
Link: https://vercel.com/01HARSHIT1/mangawebsite/settings/environment-variables

### **Step 2: Update Each Variable**

#### **Update RAZORPAY_KEY_ID:**
1. Find: `RAZORPAY_KEY_ID` in the list
2. Click: Edit button (or Delete then Add)
3. Remove old value: `rzp_test_RSvU1ZAiteh02t`
4. Enter new value: `rzp_live_RYmFOyDhOAEolS`
5. Check all environments: ✅ Production ✅ Preview ✅ Development
6. Click: **Save**

#### **Update RAZORPAY_KEY_SECRET:**
1. Find: `RAZORPAY_KEY_SECRET` in the list
2. Click: Edit button (or Delete then Add)
3. Remove old value: `CyMMQitnvvUDRNZyjYuKcJHz`
4. Enter new value: `IxdDhYkxs4LXB3wfSjatCTl6`
5. Check all environments: ✅ Production ✅ Preview ✅ Development
6. Click: **Save**

#### **RAZORPAY_WEBHOOK_SECRET:**
- Keep it as: `fkCUmmQh8@83VLK` (no change needed)
- Already set correctly

### **Step 3: Verify**
After updating:
- Vercel will auto-redeploy in 2-3 minutes
- Or manually: Deployments → Redeploy

---

## ✅ After Vercel Redeploys (2-3 minutes):

### **Step 4: Test Live Mode**
1. Go to: https://mangawebsite.vercel.app/coins
2. Click any payment option
3. Check: NO "Test Mode" banner visible ✅
4. Verify: Paytm, PhonePe now appear in wallet options
5. Verify: All payment methods work

---

## 🧪 Step 5: Make a Small Real Payment (Test)**

Start with smallest package to test:
1. Select: **$0.99** (₹82.17)
2. Try: UPI payment with your real UPI ID
3. Make the payment (small test amount)
4. Verify: Coins are credited successfully
5. Check: Razorpay dashboard shows the payment

---

## 📊 Step 6: Monitor**
- Check Razorpay Dashboard: https://dashboard.razorpay.com/payments
- All real payments will appear there
- Funds will settle to your bank account

---

## ⚠️ IMPORTANT:

### **You're Now in LIVE Mode!**
- ⚠️ All payments are REAL (real money)
- ⚠️ No automatic refunds like test mode
- ✅ All payment methods work (Paytm, PhonePe, cards, etc.)
- ✅ Ready for production customers

---

## 🆘 If Something Goes Wrong:

**Quick Rollback (if needed):**
1. Go back to Vercel environment variables
2. Change `RAZORPAY_KEY_ID` back to `rzp_test_RSvU1ZAiteh02t`
3. Change `RAZORPAY_KEY_SECRET` back to `CyMMQitnvvUDRNZyjYuKcJHz`
4. Redeploy

This will switch back to test mode.

---

## 🎉 Once Everything Works:

Your payment system is LIVE and ready for real customers! 🚀

---

**Now go update Vercel with the live keys above, and tell me when done so I can help you test!**


