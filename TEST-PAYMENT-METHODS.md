# 🧪 Complete Payment Testing Guide for Razorpay Test Mode

## ✅ CONFIRMED WORKING: UPI
- Method: UPI
- Test ID: `success@razorpay`
- Status: ✅ Working perfectly
- Coins: ✅ Credited correctly
- Balance: ✅ Updates automatically

---

## 🎯 TEST THESE METHODS:

### **1️⃣ Wallet Payments (Paytm, PhonePe, etc.)**

#### **Paytm Wallet:**
1. Go to: https://mangawebsite.vercel.app/coins
2. Select any package
3. Click "Pay via Razorpay"
4. Click **"Wallets"** tab in payment modal
5. Select **"Paytm"**
6. Enter test details:
   - Phone: `9876543210` (any 10-digit number)
   - OTP: `1234` (any 4 digits)
7. Complete payment
8. ✅ Should succeed and credit coins

#### **PhonePe Wallet:**
1. Select **"Wallets"** tab
2. Select **"PhonePe"**
3. Enter test phone: `9876543210`
4. Enter OTP: `1234`
5. Complete payment
6. ✅ Should succeed

---

### **2️⃣ Net Banking**

#### **Steps:**
1. Go to payment modal
2. Click **"Net Banking"** tab
3. Select any bank (test banks are: HDFC, ICICI, SBI, Axis, Kotak)
4. Enter test credentials:
   - **Username:** `razorpay`
   - **Password:** `razorpay`
   - **TXNID:** Any number (e.g., `12345`)
5. Click "Pay Now"
6. ✅ Should succeed and credit coins

#### **Available Test Banks:**
- HDFC Bank
- ICICI Bank  
- State Bank of India (SBI)
- Axis Bank
- Kotak Mahindra Bank
- Any other bank shown in the list

---

### **3️⃣ Cards (Limited in Test Mode)**

#### **⚠️ IMPORTANT NOTE:**
- Cards may show "International cards not supported" in test mode
- This is a Razorpay test mode limitation (normal behavior)
- **Solution:** Use UPI, Wallets, or Net Banking for testing
- Cards will work perfectly in **live mode**

#### **Test Cards (If you want to try):**
```
Card Number: 5104 0600 0000 0008 (RuPay Credit)
Expiry: 12/28 (any future date)
CVV: 123 (any 3 digits)
Name: Test User
```

**OR**

```
Card Number: 4012 0010 3714 1112 (Debit Card)
Expiry: 12/28
CVV: 123
Name: Test User
```

**Note:** Even these may not work due to test mode restrictions.

---

### **4️⃣ UPI (Already Tested ✅)**

#### **Test UPI IDs:**
- `success@razorpay` ← You already tested this!
- `success@upi`
- Any valid UPI ID format will work

#### **Steps:**
1. Select **"UPI"** tab
2. Enter UPI ID: `success@razorpay`
3. Click "Pay"
4. ✅ Instant success
5. Coins credited

---

## 📊 TESTING CHECKLIST:

### **Test All Packages:**
- [ ] ₹82.17 (100 coins) - Test UPI ✅
- [ ] ₹414.17 (500 coins) - Test Wallet
- [ ] ₹829.17 (1000 coins) - Test Net Banking  
- [ ] ₹1659.17 (2500 coins) - Test UPI

### **Test All Payment Methods:**
- [x] UPI ✅ Working
- [ ] Paytm Wallet
- [ ] PhonePe Wallet
- [ ] Net Banking (HDFC, ICICI, SBI, Axis, Kotak)
- [ ] Cards (optional - may show restrictions)

---

## 🎯 RECOMMENDED TESTING ORDER:

### **Priority 1: Quick Tests (5 minutes)**
1. **UPI** - Already tested ✅
2. **Paytm Wallet** - Test with phone `9876543210`, OTP `1234`
3. **Net Banking** - Test with bank of choice, credentials `razorpay/razorpay`

### **Priority 2: Extended Tests (15 minutes)**
1. Test all 4 coin packages with UPI
2. Test with different wallets (PhonePe, etc.)
3. Test with different banks
4. Verify coins are credited correctly for each

---

## ✅ WHAT TO VERIFY:

After each test payment:
1. **Payment Success Message** shows
2. **Balance Updates** correctly (check top of page)
3. **No Errors** displayed
4. **Console Logs** show success
5. **Database** has payment record

---

## 🐛 IF SOMETHING FAILS:

### **Common Test Mode Limitations:**
1. **"International cards not supported"** - Normal for cards in test mode
2. **QR codes don't work** - Normal in test mode
3. **Some banks require extra verification** - Try different bank

### **Solutions:**
- ✅ Use UPI: Always works
- ✅ Use Wallets: Usually work
- ✅ Use Net Banking: Most banks work
- ❌ Avoid Cards: Can show restrictions

---

## 🚀 AFTER TESTING:

Once all methods work in test mode:
1. Complete KYC verification in Razorpay Dashboard
2. Switch to **Live Mode** in Razorpay settings
3. Update Vercel environment variables with live keys
4. Test with real payment methods

---

## 📝 RECORD YOUR RESULTS:

Keep a log:
```
✅ UPI: success@razorpay - Working
✅ Paytm Wallet: Working  
✅ Net Banking: Working
⚠️ Cards: International cards not supported (expected)
```

This will help you know which methods work for your users!

