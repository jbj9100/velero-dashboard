import { HTMLAttributes, ReactNode } from 'react'
import clsx from 'clsx'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
    children: ReactNode
}

export function Card({ className, children, ...props }: CardProps) {
    return (
        <div
            className={clsx(
                'bg-dark-800 border border-gray-700/50 rounded-xl p-6',
                'shadow-elevation-2 hover:border-primary/30 hover:shadow-primary/10',
                'transition-all duration-200',
                className
            )}
            {...props}
        >
            {children}
        </div>
    )
}

interface CardHeaderProps {
    title: string
    subtitle?: string
    action?: ReactNode
}

export function CardHeader({ title, subtitle, action }: CardHeaderProps) {
    return (
        <div className="flex items-start justify-between mb-4">
            <div>
                <h3 className="text-lg font-semibold text-gray-100">{title}</h3>
                {subtitle && <p className="text-sm text-gray-400 mt-1">{subtitle}</p>}
            </div>
            {action && <div>{action}</div>}
        </div>
    )
}

export function CardContent({ className, children, ...props }: CardProps) {
    return (
        <div className={clsx('', className)} {...props}>
            {children}
        </div>
    )
}
