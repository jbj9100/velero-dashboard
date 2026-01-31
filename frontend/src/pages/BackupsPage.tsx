import { useState } from 'react'
import { Card } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import { useBackups } from '@/hooks/useBackups'
import { formatDate, formatDuration } from '@/utils/formatters'
import { getPhaseVariant, getPhaseLabel } from '@/utils/phase'
import { Plus, RefreshCw, AlertCircle } from 'lucide-react'
import type { Backup } from '@/types/velero'

export default function BackupsPage() {
    const { data: backups, isLoading, error, refetch } = useBackups()
    // const createBackup = useCreateBackup()
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

    if (error) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <AlertCircle className="w-12 h-12 text-danger mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-100">Failed to load backups</h3>
                    <p className="text-gray-400 mt-2">
                        {error instanceof Error ? error.message : 'Unknown error'}
                    </p>
                    <Button className="mt-4" onClick={() => refetch()}>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Retry
                    </Button>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-100">Backups</h1>
                    <p className="text-gray-400 mt-2">
                        {backups ? `${backups.length} total backups` : 'Loading...'}
                    </p>
                </div>
                <div className="flex gap-3">
                    <Button variant="secondary" onClick={() => refetch()} disabled={isLoading}>
                        <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                    <Button onClick={() => setIsCreateModalOpen(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Create Backup
                    </Button>
                </div>
            </div>

            {/* Backups List */}
            <Card>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-gray-700/50">
                                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-400 uppercase">
                                    Name
                                </th>
                                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-400 uppercase">
                                    Status
                                </th>
                                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-400 uppercase">
                                    Started
                                </th>
                                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-400 uppercase">
                                    Duration
                                </th>
                                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-400 uppercase">
                                    Warnings
                                </th>
                                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-400 uppercase">
                                    Errors
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading && (
                                <tr>
                                    <td colSpan={6} className="py-12 text-center">
                                        <RefreshCw className="w-8 h-8 text-gray-400 animate-spin mx-auto mb-3" />
                                        <p className="text-gray-400">Loading backups...</p>
                                    </td>
                                </tr>
                            )}

                            {!isLoading && backups && backups.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="py-12 text-center">
                                        <p className="text-gray-400">No backups found</p>
                                        <Button
                                            variant="secondary"
                                            className="mt-4"
                                            onClick={() => setIsCreateModalOpen(true)}
                                        >
                                            Create your first backup
                                        </Button>
                                    </td>
                                </tr>
                            )}

                            {!isLoading &&
                                backups?.map((backup: Backup) => (
                                    <tr
                                        key={backup.name}
                                        className="border-b border-gray-700/30 hover:bg-dark-700/50 transition-colors cursor-pointer"
                                    >
                                        <td className="py-3 px-4">
                                            <span className="text-gray-100 font-medium">{backup.name}</span>
                                        </td>
                                        <td className="py-3 px-4">
                                            <Badge variant={getPhaseVariant(backup.phase)}>
                                                {getPhaseLabel(backup.phase)}
                                            </Badge>
                                        </td>
                                        <td className="py-3 px-4 text-gray-300 text-sm">
                                            {formatDate(backup.startTimestamp)}
                                        </td>
                                        <td className="py-3 px-4 text-gray-300 text-sm">
                                            {formatDuration(backup.startTimestamp, backup.completionTimestamp)}
                                        </td>
                                        <td className="py-3 px-4">
                                            {backup.warnings > 0 ? (
                                                <span className="text-warning font-medium">{backup.warnings}</span>
                                            ) : (
                                                <span className="text-gray-500">0</span>
                                            )}
                                        </td>
                                        <td className="py-3 px-4">
                                            {backup.errors > 0 ? (
                                                <span className="text-danger font-medium">{backup.errors}</span>
                                            ) : (
                                                <span className="text-gray-500">0</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* Create Modal - Placeholder for now */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-dark-800 rounded-xl p-6 max-w-md w-full mx-4">
                        <h2 className="text-xl font-bold text-gray-100 mb-4">Create Backup</h2>
                        <p className="text-gray-400 mb-6">Modal implementation coming soon...</p>
                        <Button variant="secondary" onClick={() => setIsCreateModalOpen(false)} className="w-full">
                            Close
                        </Button>
                    </div>
                </div>
            )}
        </div>
    )
}
