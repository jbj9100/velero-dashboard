import { ButtonHTMLAttributes, forwardRef } from 'react'
import clsx from 'clsx'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
    size?: 'sm' | 'md' | 'lg'
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    ({ variant = 'primary', size = 'md', className, children, ...props }, ref) => {
        return (
            <button
                ref={ref}
                className={clsx(
                    'inline-flex items-center justify-center font-medium rounded-lg transition-all',
                    'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-dark-950',
                    'disabled:opacity-50 disabled:cursor-not-allowed',
                    {
                        // Variants
                        'bg-gradient-to-r from-primary to-primary-dark text-white shadow-primary hover:shadow-primary-lg hover:-translate-y-0.5':
                            variant === 'primary',
                        'bg-primary/10 text-primary border border-primary/30 hover:bg-primary/15 hover:border-primary/50':
                            variant === 'secondary',
                        'text-gray-300 hover:bg-dark-700 hover:text-gray-100':
                            variant === 'ghost',
                        'bg-danger/10 text-danger border border-danger/30 hover:bg-danger/15':
                            variant === 'danger',

                        // Sizes
                        'px-3 py-1.5 text-sm': size === 'sm',
                        'px-4 py-2 text-sm': size === 'md',
                        'px-6 py-3 text-base': size === 'lg',
                    },
                    className
                )}
                {...props}
            >
                {children}
            </button>
        )
    }
)

Button.displayName = 'Button'

export default Button
