'use client';

import { XCircle, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function BillingCanceledPage() {
    const router = useRouter();

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center px-4">
            <div className="max-w-md w-full text-center">
                <div className="bg-white rounded-2xl shadow-xl p-8">
                    <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <XCircle className="w-12 h-12 text-orange-600" />
                    </div>

                    <h1 className="text-3xl font-bold text-gray-900 mb-4">
                        Payment Canceled
                    </h1>

                    <p className="text-gray-600 mb-8">
                        Your payment was canceled. No charges have been made to your account.
                    </p>

                    <div className="bg-blue-50 rounded-lg p-4 mb-6">
                        <p className="text-sm text-gray-700">
                            💡 Need help choosing a plan? Our support team is here to assist you.
                        </p>
                    </div>

                    <button
                        onClick={() => router.push('/pricing')}
                        className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        View Pricing Plans
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
