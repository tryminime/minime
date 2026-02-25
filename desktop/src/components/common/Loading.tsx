import React from 'react';
import { Loader } from 'lucide-react';

interface LoadingProps {
    size?: 'sm' | 'md' | 'lg';
    text?: string;
    fullScreen?: boolean;
    className?: string;
}

export const Loading: React.FC<LoadingProps> = ({
    size = 'md',
    text,
    fullScreen = false,
    className = '',
}) => {
    const sizeClasses = {
        sm: 'w-4 h-4',
        md: 'w-8 h-8',
        lg: 'w-12 h-12',
    };

    const content = (
        <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
            <Loader className={`${sizeClasses[size]} animate-spin text-blue-500`} />
            {text && (
                <p className="text-sm text-gray-600 dark:text-gray-400">{text}</p>
            )}
        </div>
    );

    if (fullScreen) {
        return (
            <div className="fixed inset-0 flex items-center justify-center bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm z-50">
                {content}
            </div>
        );
    }

    return content;
};

interface SkeletonProps {
    className?: string;
    count?: number;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = '', count = 1 }) => {
    return (
        <>
            {Array.from({ length: count }).map((_, i) => (
                <div
                    key={i}
                    className={`animate-pulse bg-gray-200 dark:bg-gray-700 rounded ${className}`}
                />
            ))}
        </>
    );
};

export const LoadingSpinner: React.FC<{ className?: string }> = ({ className = '' }) => {
    return <Loader className={`animate-spin text-blue-500 ${className}`} />;
};

export default Loading;
