export default function LoadingSkeleton() {
    return (
        <div className="animate-pulse">
            {/* KPI Cards Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 h-32">
                        <div className="flex justify-between mb-4">
                            <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-lg" />
                            <div className="w-16 h-6 bg-gray-200 dark:bg-gray-700 rounded" />
                        </div>
                        <div className="w-24 h-8 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
                        <div className="w-32 h-4 bg-gray-200 dark:bg-gray-700 rounded" />
                    </div>
                ))}
            </div>

            {/* Chart Skeleton */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 mb-6">
                <div className="w-48 h-6 bg-gray-200 dark:bg-gray-700 rounded mb-4" />
                <div className="w-full h-64 bg-gray-200 dark:bg-gray-700 rounded" />
            </div>

            {/* Cards Skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 h-64">
                        <div className="w-48 h-6 bg-gray-200 dark:bg-gray-700 rounded mb-4" />
                        <div className="w-full h-4 bg-gray-200 dark:bg-gray-700 rounded mb-4" />
                        <div className="space-y-2">
                            {[1, 2, 3, 4].map((j) => (
                                <div key={j} className="w-full h-4 bg-gray-200 dark:bg-gray-700 rounded" />
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
