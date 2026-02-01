
import React, { useEffect, useState } from 'react'
import { Card } from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import { AlertCircle, Activity } from 'lucide-react'
import { getRepositories, getNodeAgents, BackupRepository, NodeAgent } from '@/api/client'

const SystemStatusPage: React.FC = () => {
    const [repositories, setRepositories] = useState<BackupRepository[]>([])
    const [nodeAgents, setNodeAgents] = useState<NodeAgent[]>([])
    const [loading, setLoading] = useState<boolean>(true)
    const [error, setError] = useState<string | null>(null)

    const fetchData = async () => {
        setLoading(true)
        setError(null)
        try {
            const [repos, nodes] = await Promise.all([
                getRepositories(),
                getNodeAgents()
            ])
            setRepositories(repos)
            setNodeAgents(nodes)
        } catch (err: any) {
            setError(err.message || 'Failed to fetch system status')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchData()
        const interval = setInterval(fetchData, 10000)
        return () => clearInterval(interval)
    }, [])

    const getStatusVariant = (status: string) => {
        const lowerStatus = status.toLowerCase()
        if (lowerStatus === 'ready' || lowerStatus === 'running') return 'success'
        if (lowerStatus === 'failed' || lowerStatus === 'error') return 'danger'
        return 'warning'
    }

    if (loading && repositories.length === 0) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-100 flex items-center gap-2">
                        <Activity className="w-8 h-8 text-primary" />
                        System Status
                    </h1>
                    <p className="text-gray-400 mt-2">Monitor Velero infrastructure health</p>
                </div>
            </div>

            {error && (
                <div className="bg-danger/10 border border-danger/20 text-danger p-4 rounded-lg flex items-center gap-2">
                    <AlertCircle className="w-5 h-5" />
                    {error}
                </div>
            )}

            {/* Backup Repositories Section */}
            <Card>
                <div className="p-4 border-b border-gray-700/50">
                    <h2 className="text-lg font-semibold text-gray-100">Backup Repositories</h2>
                    <p className="text-sm text-gray-400">Restic/Kopia repository status per namespace</p>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-dark-800 text-gray-400 uppercase font-medium">
                            <tr>
                                <th className="px-4 py-3">Name</th>
                                <th className="px-4 py-3">Phase</th>
                                <th className="px-4 py-3">Maintenance</th>
                                <th className="px-4 py-3">Last Maintenance</th>
                                <th className="px-4 py-3">Message</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700/30">
                            {repositories.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                                        No repositories found.
                                    </td>
                                </tr>
                            ) : (
                                repositories.map((repo) => (
                                    <tr key={repo.name} className="hover:bg-dark-700/30">
                                        <td className="px-4 py-3 text-gray-200 font-medium">{repo.name}</td>
                                        <td className="px-4 py-3">
                                            <Badge variant={getStatusVariant(repo.phase)}>
                                                {repo.phase}
                                            </Badge>
                                        </td>
                                        <td className="px-4 py-3 text-gray-300">{repo.maintenanceFrequency || '-'}</td>
                                        <td className="px-4 py-3 text-gray-300">
                                            {repo.lastMaintenanceTime ? new Date(repo.lastMaintenanceTime).toLocaleString() : '-'}
                                        </td>
                                        <td className="px-4 py-3 text-gray-400 max-w-xs truncate" title={repo.message}>
                                            {repo.message || '-'}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* Node Agents Section */}
            <Card>
                <div className="p-4 border-b border-gray-700/50">
                    <h2 className="text-lg font-semibold text-gray-100">Node Agents</h2>
                    <p className="text-sm text-gray-400">Velero Node Agent (DaemonSet) pod status</p>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-dark-800 text-gray-400 uppercase font-medium">
                            <tr>
                                <th className="px-4 py-3">Pod Name</th>
                                <th className="px-4 py-3">Node</th>
                                <th className="px-4 py-3">Status</th>
                                <th className="px-4 py-3">Restarts</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700/30">
                            {nodeAgents.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                                        No node agents found.
                                    </td>
                                </tr>
                            ) : (
                                nodeAgents.map((agent) => (
                                    <tr key={agent.name} className="hover:bg-dark-700/30">
                                        <td className="px-4 py-3 text-gray-200 font-medium">{agent.name}</td>
                                        <td className="px-4 py-3 text-gray-300">{agent.nodeName}</td>
                                        <td className="px-4 py-3">
                                            <Badge variant={getStatusVariant(agent.status)}>
                                                {agent.status}
                                            </Badge>
                                        </td>
                                        <td className="px-4 py-3 text-gray-300">{agent.restartCount}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    )
}

export default SystemStatusPage
