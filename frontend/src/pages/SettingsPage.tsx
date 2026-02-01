import { useState } from 'react'
import { useClusterStore, type ClusterRole } from '@/store/clusterStore'
import { Card, CardHeader, CardContent } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import ClusterRoleBadge from '@/components/ui/ClusterRoleBadge'
import { Trash2, Plus, Server } from 'lucide-react'
import clsx from 'clsx'

export default function SettingsPage() {
    const { clusters, activeClusterId, addCluster, removeCluster, setActiveCluster } = useClusterStore()
    const [isAdding, setIsAdding] = useState(false)
    const [newCluster, setNewCluster] = useState<{ name: string; url: string; role: ClusterRole }>({
        name: '',
        url: '',
        role: 'both'
    })

    const handleAdd = () => {
        if (newCluster.name && newCluster.url) {
            addCluster(newCluster)
            setNewCluster({ name: '', url: '', role: 'both' })
            setIsAdding(false)
        }
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-100">Settings</h1>
                <p className="text-gray-400 mt-2">Manage your cluster connections</p>
            </div>

            <Card>
                <CardHeader
                    title="Cluster Connections"
                    subtitle="Manage backend API endpoints for your clusters"
                    action={
                        <Button onClick={() => setIsAdding(true)} size="sm">
                            <Plus className="w-4 h-4 mr-2" />
                            Add Cluster
                        </Button>
                    }
                />
                <CardContent>
                    <div className="space-y-4">
                        {/* Add New Cluster Form */}
                        {isAdding && (
                            <div className="p-4 bg-dark-900/50 rounded-lg border border-primary/30 space-y-4">
                                <h4 className="font-medium text-gray-100">New Cluster Connection</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs text-gray-400 mb-1">Display Name</label>
                                        <input
                                            type="text"
                                            className="w-full bg-dark-950 border border-gray-700 rounded-lg px-3 py-2 text-gray-100 focus:border-primary focus:outline-none"
                                            placeholder="e.g. Production Cluster"
                                            value={newCluster.name}
                                            onChange={(e) => setNewCluster({ ...newCluster, name: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-400 mb-1">Backend URL</label>
                                        <input
                                            type="text"
                                            className="w-full bg-dark-950 border border-gray-700 rounded-lg px-3 py-2 text-gray-100 focus:border-primary focus:outline-none"
                                            placeholder="e.g. http://192.168.1.100:8000"
                                            value={newCluster.url}
                                            onChange={(e) => setNewCluster({ ...newCluster, url: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-400 mb-1">Cluster Role</label>
                                        <select
                                            className="w-full bg-dark-950 border border-gray-700 rounded-lg px-3 py-2 text-gray-100 focus:border-primary focus:outline-none"
                                            value={newCluster.role}
                                            onChange={(e) => setNewCluster({ ...newCluster, role: e.target.value as ClusterRole })}
                                        >
                                            <option value="source">Source (Backup)</option>
                                            <option value="destination">Destination (Restore)</option>
                                            <option value="both">Both</option>
                                        </select>
                                        <p className="text-xs text-gray-500 mt-1">Define the purpose of this cluster</p>
                                    </div>
                                </div>
                                <div className="flex justify-end space-x-2">
                                    <Button variant="ghost" size="sm" onClick={() => setIsAdding(false)}>Cancel</Button>
                                    <Button size="sm" onClick={handleAdd}>Save Connection</Button>
                                </div>
                            </div>
                        )}

                        {/* Clusters List */}
                        {clusters.map((cluster) => (
                            <div
                                key={cluster.id}
                                className={clsx(
                                    "flex items-center justify-between p-4 rounded-lg border transition-all",
                                    cluster.id === activeClusterId
                                        ? "bg-dark-900 border-primary/50 shadow-primary/10"
                                        : "bg-dark-900/30 border-gray-800 hover:border-gray-700"
                                )}
                            >
                                <div className="flex items-center space-x-4">
                                    <div className={clsx(
                                        "w-10 h-10 rounded-lg flex items-center justify-center",
                                        cluster.id === activeClusterId ? "bg-primary/20 text-primary" : "bg-dark-800 text-gray-500"
                                    )}>
                                        <Server className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h4 className="font-medium text-gray-100 flex items-center gap-2">
                                            {cluster.name}
                                            <ClusterRoleBadge role={cluster.role} size="sm" />
                                            {cluster.id === activeClusterId && (
                                                <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">Active</span>
                                            )}
                                        </h4>
                                        <p className="text-sm text-gray-500">{cluster.url}</p>
                                    </div>
                                </div>

                                <div className="flex items-center space-x-2">
                                    {cluster.id !== activeClusterId && (
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            onClick={() => setActiveCluster(cluster.id)}
                                        >
                                            Connect
                                        </Button>
                                    )}
                                    <Button
                                        variant="danger"
                                        size="sm"
                                        onClick={() => removeCluster(cluster.id)}
                                        disabled={cluster.id === activeClusterId} // Prevent deleting active cluster
                                        title={cluster.id === activeClusterId ? "Switch to another cluster to delete" : "Delete cluster"}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        ))}

                        {clusters.length === 0 && (
                            <div className="text-center py-8 text-gray-500">
                                No clusters configured. Please add a backend URL to connect.
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
