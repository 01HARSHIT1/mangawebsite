# Razorpay Build Error Fix

## Problem
During Next.js build, the Razorpay SDK was being evaluated at build time, causing an error:
```
Error: `key_id` or `oauthToken` is mandatory
```

This happened because:
1. Next.js analyzes all route files during build
2. Static imports of Razorpay were being evaluated
3. Environment variables aren't available during build
4. Razorpay SDK requires credentials to initialize

## Solution
Changed all Razorpay imports from **static imports** to **dynamic imports** so they only load at runtime, not during build.

### Before (Static Import - Causes Build Error):
```typescript
import Razorpay from 'razorpay';

export async function POST(request: NextRequest) {
    const razorpay = new Razorpay({
        key_id: keyId,
        key_secret: keySecret,
    });
}
```

### After (Dynamic Import - Works at Build Time):
```typescript
// No top-level import

export async function POST(request: NextRequest) {
    // Dynamic import - only loads at runtime
    const Razorpay = (await import('razorpay')).default;
    const razorpay = new Razorpay({
        key_id: keyId,
        key_secret: keySecret,
    });
}
```

## Files Fixed
1. ✅ `src/app/api/razorpay/verify-payment/route.ts`
2. ✅ `src/app/api/razorpay/create-order/route.ts`
3. ✅ `src/app/api/razorpay/create-qr/route.ts`
4. ✅ `src/app/api/razorpay/check-payment-status/route.ts`
5. ✅ `src/app/api/razorpay/qr-status/route.ts`

## Why This Works
- **Build Time**: Next.js can analyze the route structure without executing Razorpay initialization
- **Runtime**: When a request comes in, Razorpay is dynamically imported and initialized with credentials
- **No Breaking Changes**: Payment functionality remains exactly the same

## Testing
After this fix:
1. ✅ Build should complete without errors
2. ✅ Payment creation should work normally
3. ✅ Payment verification should work normally
4. ✅ All Razorpay features should function as before

## Note
The `src/app/api/razorpay/webhook/route.ts` file doesn't need changes because it doesn't import Razorpay (it only verifies webhook signatures using crypto).

