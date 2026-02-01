import { Bell, Settings } from 'lucide-react'
import { useClusterStore } from '@/store/clusterStore'
import { useNavigate } from 'react-router-dom'
import ClusterRoleBadge from '@/components/ui/ClusterRoleBadge'

export default function TopNav() {
    const { clusters, activeClusterId, setActiveCluster, getActiveCluster } = useClusterStore()
    const activeCluster = getActiveCluster()
    const navigate = useNavigate()

    return (
        <header className="h-16 bg-dark-800 border-b border-gray-800/50 px-6 flex items-center justify-between">
            <div className="flex items-center space-x-4">
                <h1 className="text-xl font-semibold text-gray-100">Velero Dashboard</h1>
                {activeCluster ? (
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-success/10 rounded-lg border border-success/30">
                        <div className="w-2 h-2 rounded-full bg-success animate-pulse"></div>
                        <span className="text-sm text-success font-medium">Connected: {activeCluster.name}</span>
                        <ClusterRoleBadge role={activeCluster.role} size="sm" />
                    </div>
                ) : (
                    <div className="flex items-center space-x-2 px-3 py-1.5 bg-danger/10 rounded-lg border border-danger/30">
                        <div className="w-2 h-2 rounded-full bg-danger"></div>
                        <span className="text-sm text-danger font-medium">Disconnected</span>
                    </div>
                )}
            </div>

            <div className="flex items-center space-x-4">
                {/* Cluster Selector */}
                <select
                    className="bg-dark-900 border border-gray-700 rounded-lg px-4 py-2 text-sm text-gray-100
                   focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer"
                    value={activeClusterId || ''}
                    onChange={(e) => setActiveCluster(e.target.value)}
                >
                    <option value="" disabled>Select Cluster</option>
                    {clusters.map(cluster =>
                        <option key={cluster.id} value={cluster.id}>
                            {cluster.name} [{cluster.role.toUpperCase()}]
                        </option>
                    )}
                </select>

                <button
                    onClick={() => navigate('/settings')}
                    className="p-2 rounded-lg text-gray-400 hover:bg-dark-700 hover:text-primary transition-all"
                    title="Cluster Settings"
                >
                    <Settings className="w-5 h-5" />
                </button>

                {/* Notifications */}
                <button className="w-10 h-10 rounded-lg flex items-center justify-center text-gray-400
                         hover:bg-dark-700 hover:text-primary transition-all relative">
                    <Bell className="w-5 h-5" />
                    <span className="absolute top-2 right-2 w-2 h-2 bg-danger rounded-full"></span>
                </button>
            </div>
        </header>
    )
}
