// Lightweight placeholder helpers for Razorpay payouts.
// We keep the shape here so we can plug in live automation when finance is ready.

import type { WithId, Document } from 'mongodb';

type CreatorDocument = WithId<Document> & {
    payoutInfo?: {
        razorpayAccountId?: string;
        verificationStatus?: 'pending' | 'verified' | 'rejected';
    };
};

export interface RazorpayAccountSyncResult {
    accountId?: string;
    status: 'skipped' | 'created' | 'updated' | 'failed';
    message?: string;
}

/**
 * Stub that records the desired Razorpay account id. Once we enable
 * automatic payouts we can swap the internals here to call the Razorpay
 * Contact/Fund Account APIs.
 */
export async function ensureCreatorRazorpayAccount(
    creator: CreatorDocument
): Promise<RazorpayAccountSyncResult> {
    const accountId = creator.payoutInfo?.razorpayAccountId;

    if (!accountId) {
        return {
            status: 'skipped',
            message: 'No Razorpay account id provided yet'
        };
    }

    // Future implementation:
    // 1. Create Contact (if needed)
    // 2. Create/Update Fund Account with provided bank/upi details
    // 3. Persist Razorpay identifiers back to the database
    // For now, we simply acknowledge the stored id so finance can
    // wire payouts manually or via dashboard exports.

    return {
        status: 'skipped',
        accountId,
        message: 'Automatic Razorpay sync not enabled'
    };
}

