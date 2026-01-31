import clsx from 'clsx'

interface BadgeProps {
    variant?: 'success' | 'danger' | 'warning' | 'info' | 'default'
    children: React.ReactNode
}

export default function Badge({ variant = 'default', children }: BadgeProps) {
    return (
        <span
            className={clsx(
                'inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold border',
                {
                    'bg-success/15 text-success border-success/30': variant === 'success',
                    'bg-danger/15 text-danger border-danger/30': variant === 'danger',
                    'bg-warning/15 text-warning border-warning/30': variant === 'warning',
                    'bg-info/15 text-info border-info/30': variant === 'info',
                    'bg-gray-700/50 text-gray-300 border-gray-600/50': variant === 'default',
                }
            )}
        >
            {children}
        </span>
    )
}
