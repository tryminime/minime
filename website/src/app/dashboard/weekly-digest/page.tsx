'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { DigestViewer } from '@/components/Dashboard/DigestViewer';
import { DigestSidebar } from '@/components/Dashboard/DigestSidebar';
import { FileText } from 'lucide-react';

export default function WeeklyDigestPage() {
    const searchParams = useSearchParams();
    const initialDate = searchParams.get('date') || undefined;
    const [selectedDate, setSelectedDate] = useState<string | undefined>(initialDate);

    return (
        <div className="fixed inset-0 flex flex-col bg-gray-50">
            {/* Header */}
            <div className="flex-none bg-white border-b border-gray-200 px-6 py-4">
                <div className="flex items-center gap-3">
                    <FileText className="w-6 h-6 text-blue-600" />
                    <div>
                        <h1 className="text-xl font-bold text-gray-900">Weekly Digest</h1>
                        <p className="text-sm text-gray-600">Your personalized weekly summary</p>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex overflow-hidden">
                {/* Historical Sidebar */}
                <div className="flex-none w-64">
                    <DigestSidebar
                        currentDate={selectedDate}
                        onSelectDigest={setSelectedDate}
                    />
                </div>

                {/* Digest Content */}
                <div className="flex-1 overflow-y-auto py-8 px-6">
                    <DigestViewer date={selectedDate} />
                </div>
            </div>
        </div>
    );
}
