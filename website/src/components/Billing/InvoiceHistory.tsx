'use client';

import { FileText, Download, CheckCircle, Clock, XCircle } from 'lucide-react';
import { useInvoices } from '@/lib/hooks/useBilling';
import { formatDate } from '@/lib/utils';

export function InvoiceHistory() {
    const { data, isLoading, error } = useInvoices();

    if (isLoading) {
        return (
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold mb-4">Invoice History</h3>
                <div className="space-y-3">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="bg-gray-100 animate-pulse rounded h-16" />
                    ))}
                </div>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold mb-4">Invoice History</h3>
                <p className="text-gray-500">No invoices to display</p>
            </div>
        );
    }

    const formatAmount = (amountCents: number, currency: string) => {
        const amount = amountCents / 100;
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency.toUpperCase(),
        }).format(amount);
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'paid':
                return <CheckCircle className="w-5 h-5 text-green-600" />;
            case 'open':
                return <Clock className="w-5 h-5 text-yellow-600" />;
            default:
                return <XCircle className="w-5 h-5 text-red-600" />;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'paid':
                return 'bg-green-100 text-green-700';
            case 'open':
                return 'bg-yellow-100 text-yellow-700';
            default:
                return 'bg-red-100 text-red-700';
        }
    };

    return (
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Invoice History</h3>

            {data.invoices.length === 0 ? (
                <div className="text-center py-8">
                    <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No invoices yet</p>
                    <p className="text-sm text-gray-400 mt-1">
                        Invoices will appear here after your first payment
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {data.invoices.map((invoice) => (
                        <div
                            key={invoice.id}
                            className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                {getStatusIcon(invoice.status)}
                                <div>
                                    <p className="font-medium text-gray-900">
                                        {formatAmount(invoice.amount_paid, invoice.currency)}
                                    </p>
                                    <p className="text-sm text-gray-500">
                                        {formatDate(invoice.created)}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <span className={`text-xs font-medium px-2 py-1 rounded-full capitalize ${getStatusColor(invoice.status)}`}>
                                    {invoice.status}
                                </span>

                                {invoice.invoice_pdf && (
                                    <a
                                        href={invoice.invoice_pdf}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                        title="Download PDF"
                                    >
                                        <Download className="w-4 h-4 text-gray-600" />
                                    </a>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {data.invoices.length > 0 && data.invoices.length >= 10 && (
                <button className="w-full mt-4 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                    Load more invoices →
                </button>
            )}
        </div>
    );
}
