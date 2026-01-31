export function formatDate(dateString: string | null): string {
    if (!dateString) return 'N/A'

    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`

    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    })
}

export function formatDateTime(dateString: string | null): string {
    if (!dateString) return 'N/A'

    const date = new Date(dateString)
    return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    })
}

export function formatDuration(start: string, end: string | null): string {
    if (!end) return 'In progress...'

    const startDate = new Date(start)
    const endDate = new Date(end)
    const diffMs = endDate.getTime() - startDate.getTime()
    const diffSecs = Math.floor(diffMs / 1000)
    const diffMins = Math.floor(diffSecs / 60)
    const diffHours = Math.floor(diffMins / 60)

    if (diffHours > 0) {
        const mins = diffMins % 60
        return `${diffHours}h ${mins}m`
    }
    if (diffMins > 0) {
        const secs = diffSecs % 60
        return `${diffMins}m ${secs}s`
    }
    return `${diffSecs}s`
}
