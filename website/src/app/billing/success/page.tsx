'use client';

import { Suspense, useEffect } from 'react';
import { CheckCircle, ArrowRight } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';

function SuccessContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const sessionId = searchParams.get('session_id');

    useEffect(() => {
        // Optional: Call backend to verify session and update subscription
        if (sessionId) {
            console.log('Payment successful, session:', sessionId);
        }
    }, [sessionId]);

    return (
        <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex items-center justify-center px-4">
            <div className="max-w-md w-full text-center">
                <div className="bg-white rounded-2xl shadow-2xl p-8">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle className="w-12 h-12 text-green-600" />
                    </div>

                    <h1 className="text-3xl font-bold text-gray-900 mb-4">
                        Payment Successful!
                    </h1>

                    <p className="text-gray-600 mb-8">
                        Your subscription has been activated. You now have access to all premium features.
                    </p>

                    <div className="bg-gray-50 rounded-lg p-4 mb-6">
                        <p className="text-sm text-gray-600 mb-2">What's next?</p>
                        <ul className="text-left space-y-2 text-sm text-gray-700">
                            <li className="flex items-start gap-2">
                                <span className="text-green-600">✓</span>
                                <span>Check your email for the receipt</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-green-600">✓</span>
                                <span>Access your subscription in the billing dashboard</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-green-600">✓</span>
                                <span>Start using all premium features</span>
                            </li>
                        </ul>
                    </div>

                    <button
                        onClick={() => router.push('/dashboard/billing')}
                        className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                    >
                        Go to Billing Dashboard
                        <ArrowRight className="w-4 h-4" />
                    </button>

                    <button
                        onClick={() => router.push('/dashboard')}
                        className="w-full mt-3 text-gray-600 hover:text-gray-900 py-2"
                    >
                        Return to Dashboard
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function BillingSuccessPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
            <SuccessContent />
        </Suspense>
    );
}
