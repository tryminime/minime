export function formatTime(seconds: number): string {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)

    if (hours > 0) {
        return `${hours}h ${minutes}m`
    } else if (minutes > 0) {
        return `${minutes}m`
    } else {
        return `${seconds}s`
    }
}

export function formatDuration(start: Date, end: Date): string {
    const seconds = Math.floor((end.getTime() - start.getTime()) / 1000)
    return formatTime(seconds)
}

export function getRelativeTime(date: Date | string): string {
    const now = new Date()
    const then = typeof date === 'string' ? new Date(date) : date
    const seconds = Math.floor((now.getTime() - then.getTime()) / 1000)

    if (seconds < 60) return 'just now'
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`
    return `${Math.floor(seconds / 604800)}w ago`
}

export function formatNumber(num: number): string {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
}

export function calculatePercentage(current: number, total: number): number {
    if (total === 0) return 0
    return Math.round((current / total) * 100)
}

export function truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text
    return text.slice(0, maxLength - 3) + '...'
}

export function classNames(...classes: (string | boolean | undefined)[]): string {
    return classes.filter(Boolean).join(' ')
}
