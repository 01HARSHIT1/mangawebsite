import { ObjectId } from 'mongodb';

interface CreatorPayoutInfo {
    method?: 'razorpay' | 'upi' | 'bank';
    upiId?: string | null;
    bank?:
    | {
        accountHolder: string;
        accountNumber: string;
        ifsc: string;
        bankName?: string;
    }
    | null;
    taxId?: string | null;
    razorpayAccountId?: string | null;
    razorpayFundAccountId?: string | null;
    razorpayContactId?: string | null;
    razorpayAccountStatus?: string | null;
    verificationStatus?: 'pending' | 'verified' | 'rejected';
    lastSyncMessage?: string | null;
    lastSyncedAt?: Date | null;
}

export interface CreatorDocument {
    _id: ObjectId;
    username?: string;
    displayName?: string;
    email?: string;
    phone?: string;
    payoutInfo?: CreatorPayoutInfo;
}

export interface RazorpayAccountSyncResult {
    status: 'verified' | 'pending' | 'skipped' | 'error';
    payoutInfoUpdates?: Partial<CreatorPayoutInfo> & {
        lastSyncedAt?: Date | null;
        lastSyncMessage?: string | null;
        verificationStatus?: 'pending' | 'verified' | 'rejected';
    };
    message?: string;
}

export interface CreatorPayoutExecutionResult {
    success: boolean;
    status: 'queued' | 'processing' | 'completed' | 'failed' | 'skipped';
    message?: string;
    payoutId?: string;
    mode?: 'UPI' | 'IMPS';
    error?: any;
}

const RAZORPAY_API_BASE = 'https://api.razorpay.com/v1';

function getAuthHeader() {
    const keyId =
        process.env.RAZORPAY_PAYOUT_KEY_ID ||
        process.env.RAZORPAY_KEY_ID ||
        process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    const keySecret =
        process.env.RAZORPAY_PAYOUT_KEY_SECRET ||
        process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
        throw new Error('Razorpay credentials are not configured');
    }

    const token = Buffer.from(`${keyId}:${keySecret}`).toString('base64');
    return `Basic ${token}`;
}

interface RazorpayRequestOptions extends RequestInit {
    json?: unknown;
    query?: Record<string, string | number | undefined>;
}

async function razorpayRequest<T = any>(
    path: string,
    options: RazorpayRequestOptions = {}
): Promise<T> {
    const headers: Record<string, string> = {
        Authorization: getAuthHeader(),
        'Content-Type': 'application/json',
    };

    const url = new URL(`${RAZORPAY_API_BASE}${path}`);
    if (options.query) {
        for (const [key, value] of Object.entries(options.query)) {
            if (value !== undefined && value !== null) {
                url.searchParams.append(key, String(value));
            }
        }
    }

    const response = await fetch(url.toString(), {
        ...options,
        headers,
        body: options.json ? JSON.stringify(options.json) : options.body,
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        const errorDescription =
            data?.error?.description || data?.description || response.statusText || 'Unknown error';
        const error = new Error(`Razorpay API error: ${errorDescription}`);
        (error as any).data = data;
        (error as any).status = response.status;
        throw error;
    }

    return data;
}

interface EnsureAccountParams {
    creator: CreatorDocument;
}

export async function ensureCreatorRazorpayAccount({
    creator,
}: EnsureAccountParams): Promise<RazorpayAccountSyncResult> {
    const payoutInfo = creator.payoutInfo || {};

    try {
        const keyId =
            process.env.RAZORPAY_PAYOUT_KEY_ID ||
            process.env.RAZORPAY_KEY_ID ||
            process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
        const keySecret =
            process.env.RAZORPAY_PAYOUT_KEY_SECRET ||
            process.env.RAZORPAY_KEY_SECRET;

        if (!keyId || !keySecret) {
            return {
                status: 'pending',
                message: 'Razorpay keys are not configured on the server',
            };
        }

        // If creator provided an existing Razorpay fund account id, verify it.
        if (payoutInfo.razorpayAccountId) {
            try {
                const fund = await razorpayRequest<{
                    id: string;
                    active: boolean;
                    contact_id: string;
                    vpa?: any;
                    bank_account?: any;
                    status?: string;
                }>(`/fund_accounts/${payoutInfo.razorpayAccountId}`);

                return {
                    status: fund.active ? 'verified' : 'pending',
                    message: fund.active
                        ? 'Razorpay fund account verified'
                        : 'Razorpay fund account found but not active yet',
                    payoutInfoUpdates: {
                        razorpayFundAccountId: fund.id,
                        razorpayAccountId: fund.id,
                        razorpayContactId: fund.contact_id,
                        razorpayAccountStatus: fund.status || (fund.active ? 'active' : 'pending'),
                        verificationStatus: fund.active ? 'verified' : 'pending',
                        lastSyncedAt: new Date(),
                        lastSyncMessage: fund.active
                            ? 'Fund account is active and ready for payouts.'
                            : 'Fund account is pending activation. Razorpay will update status soon.',
                    },
                };
            } catch (error) {
                return {
                    status: 'pending',
                    message:
                        'Could not verify existing Razorpay account ID. We will attempt to re-create it.',
                    payoutInfoUpdates: {
                        razorpayAccountStatus: 'error',
                        verificationStatus: 'pending',
                        lastSyncedAt: new Date(),
                        lastSyncMessage:
                            error instanceof Error ? error.message : 'Fund account lookup failed.',
                    },
                };
            }
        }

        const method =
            payoutInfo.method ||
            (payoutInfo.razorpayAccountId
                ? 'razorpay'
                : payoutInfo.upiId
                    ? 'upi'
                    : 'bank');

        if (method === 'razorpay') {
            const accountId = payoutInfo.razorpayAccountId?.trim();
            if (!accountId) {
                return {
                    status: 'pending',
                    message:
                        'Razorpay beneficiary ID is required. Please paste the fund account id starting with fa_.',
                };
            }

            try {
                const fund = await razorpayRequest<{
                    id: string;
                    active: boolean;
                    status?: string;
                    contact_id: string;
                }>(`/fund_accounts/${accountId}`);

                return {
                    status: fund.active ? 'verified' : 'pending',
                    message: fund.active
                        ? 'Razorpay beneficiary verified.'
                        : 'Razorpay beneficiary found but not active yet.',
                    payoutInfoUpdates: {
                        razorpayAccountId: fund.id,
                        razorpayFundAccountId: fund.id,
                        razorpayContactId: fund.contact_id,
                        razorpayAccountStatus: fund.status || (fund.active ? 'active' : 'pending'),
                        verificationStatus: fund.active ? 'verified' : 'pending',
                        lastSyncedAt: new Date(),
                        lastSyncMessage: fund.active
                            ? 'Fund account is active and ready for payouts.'
                            : 'Razorpay is still verifying the beneficiary.',
                    },
                };
            } catch (error) {
                const message =
                    error instanceof Error
                        ? error.message
                        : 'Unable to verify Razorpay beneficiary ID. Please double-check the ID.';
                return {
                    status: 'error',
                    message,
                    payoutInfoUpdates: {
                        verificationStatus: 'pending',
                        razorpayAccountStatus: 'error',
                        lastSyncedAt: new Date(),
                        lastSyncMessage: message,
                    },
                };
            }
        }

        if (method === 'upi' && !payoutInfo.upiId) {
            return {
                status: 'pending',
                message: 'UPI ID is required for UPI payouts. Please update payout settings.',
            };
        }

        if (method === 'bank') {
            const bank = payoutInfo.bank;
            if (!bank?.accountHolder || !bank.accountNumber || !bank.ifsc) {
                return {
                    status: 'pending',
                    message: 'Complete bank account details are required for bank payouts.',
                };
            }
        }

        const contactId =
            payoutInfo.razorpayContactId ||
            (await createOrUpdateContact({
                creator,
            }));

        const fundAccount = await createFundAccount({
            contactId,
            method,
            payoutInfo,
        });

        const active = fundAccount.active !== false;
        const accountStatus = fundAccount.status || (active ? 'active' : 'pending');

        return {
            status: active ? 'verified' : 'pending',
            message: active
                ? 'Razorpay fund account created and active.'
                : 'Fund account created. Razorpay is verifying it.',
            payoutInfoUpdates: {
                razorpayAccountId: fundAccount.id,
                razorpayFundAccountId: fundAccount.id,
                razorpayContactId: fundAccount.contact_id,
                razorpayAccountStatus: accountStatus,
                verificationStatus: active ? 'verified' : 'pending',
                lastSyncedAt: new Date(),
                lastSyncMessage: active
                    ? 'Fund account active and ready for payouts.'
                    : 'Awaiting Razorpay verification for the new fund account.',
            },
        };
    } catch (error) {
        const message =
            error instanceof Error ? error.message : 'Failed to sync Razorpay payout account';

        return {
            status: 'error',
            message,
            payoutInfoUpdates: {
                verificationStatus: 'pending',
                lastSyncedAt: new Date(),
                lastSyncMessage: message,
            },
        };
    }
}

interface ContactParams {
    creator: CreatorDocument;
}

async function createOrUpdateContact({
    creator,
}: ContactParams): Promise<string> {
    const payoutInfo = creator.payoutInfo || {};

    if (payoutInfo.razorpayContactId) {
        try {
            const contact = await razorpayRequest<{ id: string }>(
                `/contacts/${payoutInfo.razorpayContactId}`
            );
            return contact.id;
        } catch (error) {
            // If lookup fails, fall through to create new.
        }
    }

    const referenceId = `creator_${creator._id.toString()}`;
    const payload = {
        name: creator.displayName || creator.username || 'Creator',
        email: creator.email || undefined,
        contact: creator.phone || undefined,
        type: 'vendor',
        reference_id: referenceId,
        notes: {
            creator_id: creator._id.toString(),
        },
    };

    try {
        const contact = await razorpayRequest<{ id: string }>('/contacts', {
            method: 'POST',
            json: payload,
        });
        return contact.id;
    } catch (error: any) {
        const data = error?.data;
        const code = data?.error?.code;
        const description = data?.error?.description || '';

        const alreadyExists =
            code === 'BAD_REQUEST_ERROR' && description.includes('reference_id has already been taken');

        if (alreadyExists) {
            const contacts = await razorpayRequest<{ items: Array<{ id: string }> }>('/contacts', {
                query: { reference_id: referenceId, count: 1 },
            });
            const existing = contacts?.items?.[0];
            if (existing) {
                return existing.id;
            }
        }

        throw error;
    }
}

interface CreateFundAccountParams {
    contactId: string;
    method: 'upi' | 'bank';
    payoutInfo: CreatorPayoutInfo;
}

async function createFundAccount({
    contactId,
    method,
    payoutInfo,
}: CreateFundAccountParams) {
    if (method === 'upi' && payoutInfo.upiId) {
        return razorpayRequest<any>('/fund_accounts', {
            method: 'POST',
            json: {
                contact_id: contactId,
                account_type: 'vpa',
                vpa: {
                    address: payoutInfo.upiId.trim(),
                },
            },
        });
    }

    if (method === 'bank' && payoutInfo.bank) {
        return razorpayRequest<any>('/fund_accounts', {
            method: 'POST',
            json: {
                contact_id: contactId,
                account_type: 'bank_account',
                bank_account: {
                    name: payoutInfo.bank.accountHolder,
                    ifsc: payoutInfo.bank.ifsc,
                    account_number: payoutInfo.bank.accountNumber,
                },
            },
        });
    }

    throw new Error('Insufficient payout details to create a Razorpay fund account');
}

interface ExecutePayoutParams {
    creator: CreatorDocument;
    amount: number;
    referenceId: string;
    notes?: Record<string, string>;
    narration?: string;
}

export async function executeCreatorPayout({
    creator,
    amount,
    referenceId,
    notes,
    narration,
}: ExecutePayoutParams): Promise<CreatorPayoutExecutionResult> {
    if (!creator.payoutInfo) {
        return {
            success: false,
            status: 'skipped',
            message: 'Creator has not configured payout information yet.',
        };
    }

    const syncResult = await ensureCreatorRazorpayAccount({ creator });

    const payoutInfo = {
        ...creator.payoutInfo,
        ...syncResult.payoutInfoUpdates,
    };

    if (syncResult.status === 'error') {
        return {
            success: false,
            status: 'failed',
            message: syncResult.message || 'Unable to sync Razorpay fund account.',
        };
    }

    if (!payoutInfo.razorpayFundAccountId) {
        return {
            success: false,
            status: 'failed',
            message: syncResult.message || 'No Razorpay fund account available for payouts.',
        };
    }

    const accountNumber =
        process.env.RAZORPAY_PAYOUT_ACCOUNT_NUMBER ||
        process.env.RAZORPAY_ACCOUNT_NUMBER;
    if (!accountNumber) {
        return {
            success: false,
            status: 'failed',
            message:
                'RAZORPAY_ACCOUNT_NUMBER is not configured. Please add the settlement account number in environment variables.',
        };
    }

    const payoutMode = payoutInfo.method === 'upi' ? 'upi' : 'imps';
    const paiseAmount = Math.round(amount * 100);

    if (Number.isNaN(paiseAmount) || paiseAmount <= 0) {
        return {
            success: false,
            status: 'failed',
            message: 'Invalid payout amount supplied.',
        };
    }

    try {
        const payout = await razorpayRequest<{
            id: string;
            status: string;
        }>('/payouts', {
            method: 'POST',
            json: {
                account_number: accountNumber,
                fund_account_id: payoutInfo.razorpayFundAccountId,
                amount: paiseAmount,
                currency: 'INR',
                mode: payoutMode,
                purpose: 'payout',
                queue_if_low_balance: true,
                reference_id: referenceId,
                narration: narration?.slice(0, 30),
                notes,
            },
        });

        const payoutStatus = (payout.status || 'processing') as CreatorPayoutExecutionResult['status'];

        return {
            success: true,
            status: payoutStatus,
            payoutId: payout.id,
            message: `Payout ${payoutStatus}`,
            mode: payoutMode === 'upi' ? 'UPI' : 'IMPS',
        };
    } catch (error) {
        const message =
            error instanceof Error ? error.message : 'Failed to trigger Razorpay payout';

        return {
            success: false,
            status: 'failed',
            message,
            error,
            mode: payoutMode === 'upi' ? 'UPI' : 'IMPS',
        };
    }
}
