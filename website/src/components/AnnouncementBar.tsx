'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { X, ArrowRight } from 'lucide-react';

export function AnnouncementBar() {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const isDismissed = localStorage.getItem('announcement-dismissed');
        if (!isDismissed) {
            setIsVisible(true);
        }
    }, []);

    const dismiss = () => {
        setIsVisible(false);
        localStorage.setItem('announcement-dismissed', 'true');
    };

    if (!isVisible) return null;

    return (
        <div className="bg-indigo-600 w-full z-[60] relative">
            <div className="max-w-7xl mx-auto px-4 py-2 sm:px-6 lg:px-8 flex items-center justify-center relative">
                <Link
                    href="/blog/encrypted-sync"
                    className="flex items-center gap-2 text-sm font-medium text-white hover:text-indigo-100 transition-colors"
                >
                    <span className="text-base">✦</span>
                    <span>AI chat with your full activity history is now live</span>
                    <ArrowRight className="w-4 h-4 ml-1" />
                </Link>
                <button
                    onClick={dismiss}
                    className="absolute right-4 p-1 rounded-full text-indigo-200 hover:text-white hover:bg-indigo-700 transition-colors"
                    aria-label="Dismiss announcement"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}
