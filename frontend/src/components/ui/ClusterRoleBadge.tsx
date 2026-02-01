import { Shield, ArrowDownToLine, ArrowUpFromLine } from 'lucide-react'
import type { ClusterRole } from '@/store/clusterStore'

interface ClusterRoleBadgeProps {
    role: ClusterRole
    size?: 'sm' | 'md'
}

export default function ClusterRoleBadge({ role, size = 'md' }: ClusterRoleBadgeProps) {
    const configs = {
        source: {
            label: 'Source',
            icon: ArrowUpFromLine,
            colorClass: 'bg-info/15 text-info border-info/30'
        },
        destination: {
            label: 'Destination',
            icon: ArrowDownToLine,
            colorClass: 'bg-warning/15 text-warning border-warning/30'
        },
        both: {
            label: 'Both',
            icon: Shield,
            colorClass: 'bg-primary/15 text-primary border-primary/30'
        }
    }

    const config = configs[role]
    const Icon = config.icon
    const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm'

    return (
        <span className={`inline-flex items-center gap-1 rounded-md font-semibold border ${config.colorClass} ${sizeClasses}`}>
            <Icon className={size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'} />
            {config.label}
        </span>
    )
}
