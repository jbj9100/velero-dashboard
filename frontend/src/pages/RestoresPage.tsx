import { useState } from 'react'
import { Card } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import { useRestores } from '@/hooks/useRestores'
import { formatDate, formatDuration } from '@/utils/formatters'
import { getPhaseVariant, getPhaseLabel } from '@/utils/phase'
import { Plus, RefreshCw, AlertCircle } from 'lucide-react'
import type { Restore } from '@/types/velero'

import { useNavigate } from 'react-router-dom'

export default function RestoresPage() {
    const navigate = useNavigate()
    const { data: restores, isLoading, error, refetch } = useRestores()
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

    if (error) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <AlertCircle className="w-12 h-12 text-danger mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-100">Failed to load restores</h3>
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
                    <h1 className="text-3xl font-bold text-gray-100">Restores</h1>
                    <p className="text-gray-400 mt-2">
                        {restores ? `${restores.length} total restores` : 'Loading...'}
                    </p>
                </div>
                <div className="flex gap-3">
                    <Button variant="secondary" onClick={() => refetch()} disabled={isLoading}>
                        <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                    <Button onClick={() => navigate('/restores/create-with-mods')} variant="secondary" className='border-primary/50 text-primary'>
                        <Plus className="w-4 h-4 mr-2" />
                        Create with Mods
                    </Button>
                    <Button onClick={() => setIsCreateModalOpen(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Create Restore
                    </Button>
                </div>
            </div>

            {/* Restores List */}
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
                                    Backup
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
                                    <td colSpan={7} className="py-12 text-center">
                                        <RefreshCw className="w-8 h-8 text-gray-400 animate-spin mx-auto mb-3" />
                                        <p className="text-gray-400">Loading restores...</p>
                                    </td>
                                </tr>
                            )}

                            {!isLoading && restores && restores.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="py-12 text-center">
                                        <p className="text-gray-400">No restores found</p>
                                        <Button
                                            variant="secondary"
                                            className="mt-4"
                                            onClick={() => setIsCreateModalOpen(true)}
                                        >
                                            Create your first restore
                                        </Button>
                                    </td>
                                </tr>
                            )}

                            {!isLoading &&
                                restores?.map((restore: Restore) => (
                                    <tr
                                        key={restore.name}
                                        className="border-b border-gray-700/30 hover:bg-dark-700/50 transition-colors cursor-pointer"
                                    >
                                        <td className="py-3 px-4">
                                            <span className="text-gray-100 font-medium">{restore.name}</span>
                                        </td>
                                        <td className="py-3 px-4">
                                            <Badge variant={getPhaseVariant(restore.phase)}>
                                                {getPhaseLabel(restore.phase)}
                                            </Badge>
                                        </td>
                                        <td className="py-3 px-4 text-gray-300 text-sm">
                                            {restore.backupName}
                                        </td>
                                        <td className="py-3 px-4 text-gray-300 text-sm">
                                            {formatDate(restore.startTimestamp)}
                                        </td>
                                        <td className="py-3 px-4 text-gray-300 text-sm">
                                            {formatDuration(restore.startTimestamp, restore.completionTimestamp)}
                                        </td>
                                        <td className="py-3 px-4">
                                            {restore.warnings > 0 ? (
                                                <span className="text-warning font-medium">{restore.warnings}</span>
                                            ) : (
                                                <span className="text-gray-500">0</span>
                                            )}
                                        </td>
                                        <td className="py-3 px-4">
                                            {restore.errors > 0 ? (
                                                <span className="text-danger font-medium">{restore.errors}</span>
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
                        <h2 className="text-xl font-bold text-gray-100 mb-4">Create Restore</h2>
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
