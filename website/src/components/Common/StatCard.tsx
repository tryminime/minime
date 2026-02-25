import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface StatCardProps {
    title: string;
    value: string | number;
    change?: string;
    changeType?: 'positive' | 'negative' | 'neutral';
    icon?: ReactNode;
    className?: string;
}

export function StatCard({
    title,
    value,
    change,
    changeType = 'neutral',
    icon,
    className,
}: StatCardProps) {
    const changeColors = {
        positive: 'text-green-600',
        negative: 'text-red-600',
        neutral: 'text-gray-600',
    };

    return (
        <div className={cn('bg-white rounded-lg p-6 shadow-sm border border-gray-200', className)}>
            <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-600">{title}</p>
                {icon && <div className="text-gray-400">{icon}</div>}
            </div>
            <div className="mt-2">
                <p className="text-3xl font-bold text-gray-900">{value}</p>
                {change && (
                    <p className={cn('text-sm mt-1', changeColors[changeType])}>
                        {change}
                    </p>
                )}
            </div>
        </div>
    );
}
