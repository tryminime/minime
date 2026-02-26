/**
 * Stripe Client Initialization
 * Supports both test and production modes via environment variables
 */

import { loadStripe, Stripe } from '@stripe/stripe-js';

// Get publishable key from environment
const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '';

// Initialize Stripe (singleton)
let stripePromise: Promise<Stripe | null>;

export const getStripe = () => {
    if (!stripePromise) {
        stripePromise = loadStripe(publishableKey);
    }
    return stripePromise;
};

// Helper to check if we're in test mode
export const isTestMode = () => {
    return publishableKey.startsWith('pk_test_');
};

// Export for use in components
export { publishableKey };
