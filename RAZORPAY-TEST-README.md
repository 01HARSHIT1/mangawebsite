# 🧪 Razorpay Test Mode - Working Test Cards

## ❌ The Problem
You're getting "International cards are not supported" error in test mode.

## ✅ Solution: Use These Test Card Numbers

### **Working Test Cards for Razorpay Test Mode:**

#### **For Success Payment:**
```
Card Number: 4111 1111 1111 1111
Expiry: Any future date (e.g., 12/28)
CVV: Any 3 digits (e.g., 123)
Card Holder Name: Test User
```

#### **For 3D Secure (OTP) Payment:**
```
Card Number: 4012 0010 3714 1112
Expiry: Any future date
CVV: Any 3 digits
Name: Test User
```

#### **For Debit Card Test:**
```
Card Number: 5104 0600 0000 0008
Expiry: Any future date
CVV: Any 3 digits
Name: Test User
```

## 🧪 Testing Instructions

### **Step 1: Test Payment Flow**
1. Visit: https://mangawebsite.vercel.app/coins
2. Select a package (start with smallest: ₹82.17 / $0.99)
3. Click "Pay via Razorpay" button
4. Enter test card: `4111 1111 1111 1111`
5. Enter any future expiry date
6. Enter any CVV (e.g., 123)
7. Enter any name
8. Click "Pay Now"
9. Payment should succeed
10. Check if coins are credited to your account

### **Step 2: Verify Coins Were Added**
- Go to: https://mangawebsite.vercel.app/coins
- Check your coin balance at the top
- Should show increased coins

### **Step 3: Test All Packages**
- Test ₹82.17 (100 coins)
- Test ₹414.17 (500 coins)  
- Test ₹829.17 (1000 coins)
- Test ₹1659.17 (2500 coins)

### **Step 4: Test Different Payment Methods**
- Try UPI option
- Try Wallet option
- Try different test cards

## 📝 Notes

### **Why Some Cards Don't Work:**
- **International cards not supported:** This is a Razorpay test mode limitation
- **Solution:** Use the test card numbers listed above
- **These cards work:** `4111 1111 1111 1111` is the most reliable

### **QR Code Issue:**
- QR codes in test mode show "cannot pay using this QR code" error
- **This is normal behavior** in test mode
- **Solution:** Use card payments for testing
- QR codes will work properly in live mode

## ✅ Once All Tests Pass:

### **Switch to Live Mode:**
1. Go to Razorpay Dashboard: https://dashboard.razorpay.com/app/settings/api-keys
2. Complete KYC verification
3. Switch to "Live" mode
4. Get live API keys
5. Update Vercel environment variables:
   - `RAZORPAY_KEY_ID` (live)
   - `RAZORPAY_KEY_SECRET` (live)
6. Redeploy on Vercel
7. Test with real payments

## 🚀 Production Payment Methods (Live Mode):
- ✅ Indian Credit/Debit Cards
- ✅ UPI (all apps)
- ✅ Wallets (Paytm, PhonePe, etc.)
- ✅ Net Banking
- ✅ QR Codes (will work properly)

## ⚠️ Important:
- In **test mode**, only specific test cards work
- In **live mode**, all Indian payment methods work
- Keep testing in test mode until everything works
- Then switch to live mode for real payments

