import { NavLink } from 'react-router-dom'
import { Home, Database, Upload, Calendar, Settings, Activity } from 'lucide-react'
import clsx from 'clsx'


const navItems = [
    { to: '/', icon: Home, label: 'Dashboard' },
    { to: '/backups', icon: Database, label: 'Backups' },
    { to: '/restores', icon: Upload, label: 'Restores' },
    { to: '/schedules', icon: Calendar, label: 'Schedules' },
    { to: '/system', icon: Activity, label: 'System Status' },
    // { to: '/storage', icon: FolderOpen, label: 'Storage' },
]


export default function Sidebar() {
    return (
        <aside className="w-16 bg-dark-900 border-r border-gray-800/50 flex flex-col items-center py-6 space-y-4">
            {/* Logo */}
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center mb-4">
                <span className="text-white font-bold text-xl">V</span>
            </div>

            {/* Nav Items */}
            <nav className="flex-1 flex flex-col space-y-2">
                {navItems.map((item) => (
                    <NavLink
                        key={item.to}
                        to={item.to}
                        className={({ isActive }) =>
                            clsx(
                                'w-10 h-10 rounded-lg flex items-center justify-center transition-all relative group',
                                isActive
                                    ? 'bg-primary/15 text-primary border-l-2 border-primary'
                                    : 'text-gray-400 hover:bg-gray-800/50 hover:text-primary'
                            )
                        }
                    >
                        <item.icon className="w-5 h-5" />

                        {/* Tooltip */}
                        <span className="absolute left-full ml-4 px-3 py-2 bg-dark-800 text-sm text-gray-100 
                           rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none
                           transition-opacity whitespace-nowrap shadow-lg z-50">
                            {item.label}
                        </span>
                    </NavLink>
                ))}
            </nav>


            {/* Settings */}
            <NavLink
                to="/settings"
                className={({ isActive }) =>
                    clsx(
                        'w-10 h-10 rounded-lg flex items-center justify-center transition-all',
                        isActive
                            ? 'bg-primary/15 text-primary'
                            : 'text-gray-400 hover:bg-gray-800/50 hover:text-primary'
                    )
                }
            >
                <Settings className="w-5 h-5" />
            </NavLink>
        </aside>
    )
}
