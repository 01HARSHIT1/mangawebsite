# 🔍 Check If You're in Live or Test Mode

## How to Check:

### **Look at Your Razorpay API Key:**

**Test Mode Keys:**
- Key ID starts with: `rzp_test_`
- Example: `rzp_test_xxxxxxxxxxxxx`

**Live Mode Keys:**
- Key ID starts with: `rzp_live_`
- Example: `rzp_live_xxxxxxxxxxxxx`

---

## Where to Check in Vercel:

1. Go to: https://vercel.com/01HARSHIT1/mangawebsite/settings/environment-variables
2. Look for: `RAZORPAY_KEY_ID`
3. Check the value:
   - If it starts with `rzp_test_` → **Test Mode**
   - If it starts with `rzp_live_` → **Live Mode**

---

## Current Status:

Based on your earlier messages, you mentioned:
- `rzp_test_RSvU1ZAiteh02t` (Key ID)
- `CyMMQitnvvUDRNZyjYuKcJHz` (Key Secret)

These are **TEST MODE** keys (starts with `rzp_test_`).

---

## To Switch to Live Mode:

### **Option 1: You Already Have Live Keys**
If you added live keys to Vercel but payment still uses test mode:
- Check Vercel environment variables
- Verify keys start with `rzp_live_`
- Redeploy

### **Option 2: You Only Have Test Keys**
If you only have test keys:
1. Go to: https://dashboard.razorpay.com/app/settings/api-keys
2. Complete KYC (if not done)
3. Toggle to "Live Mode"
4. Copy live keys
5. Update Vercel environment variables
6. Redeploy

---

## Next Steps:

**Please tell me:**
1. What does your `RAZORPAY_KEY_ID` in Vercel start with? (`rzp_test_` or `rzp_live_`)
2. Do you see "Test Mode" banner on the payment modal?
3. Have you completed KYC in Razorpay dashboard?

Based on your answers, I'll help you switch to live mode!


