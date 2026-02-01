
import React, { useState } from 'react'
import { Card } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import apiClient from '@/api/client'
import { Plus, AlertCircle, Trash2 } from 'lucide-react'
import { formatDate } from '@/utils/formatters'
import type { Schedule } from '@/types/velero'

// Temporary types until strictly defined
interface CreateScheduleDto {
    name: string
    schedule: string
    ttl: string
    includedNamespaces: string[]
}

export default function SchedulesPage() {
    const queryClient = useQueryClient()
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
    const [formData, setFormData] = useState<CreateScheduleDto>({
        name: '',
        schedule: '0 1 * * *',
        ttl: '720h0m0s',
        includedNamespaces: ['*']
    })

    // Fetch Schedules
    const { data: schedules, isLoading, error } = useQuery({
        queryKey: ['schedules'],
        queryFn: async () => {
            const res = await apiClient.get<Schedule[]>('/schedules')
            return res.data
        }
    })

    // Create Schedule Mutation
    const createMutation = useMutation({
        mutationFn: async (data: CreateScheduleDto) => {
            await apiClient.post('/schedules', data)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['schedules'] })
            setIsCreateModalOpen(false)
            setFormData({ name: '', schedule: '0 1 * * *', ttl: '720h0m0s', includedNamespaces: ['*'] })
        },
        onError: (err: any) => {
            alert('Failed to create schedule: ' + err.message)
        }
    })

    // Delete Schedule Mutation
    const deleteMutation = useMutation({
        mutationFn: async (name: string) => {
            await apiClient.delete(`/schedules/${name}`)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['schedules'] })
        },
        onError: (err: any) => {
            alert('Failed to delete schedule: ' + err.message)
        }
    })

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        createMutation.mutate(formData)
    }

    if (error) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <AlertCircle className="w-12 h-12 text-danger mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-100">Failed to load schedules</h3>
                    <p className="text-gray-400 mt-2">
                        {error instanceof Error ? error.message : 'Unknown error'}
                    </p>
                </div>
            </div>
        )
    }

    const getPhaseVariant = (phase: string) => {
        switch (phase?.toLowerCase()) {
            case 'enabled': return 'success'
            case 'new': return 'info'
            default: return 'default'
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-100">Schedules</h1>
                    <p className="text-gray-400 mt-2">Automate your backups</p>
                </div>
                <div className="flex gap-3">
                    <Button onClick={() => setIsCreateModalOpen(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Create Schedule
                    </Button>
                </div>
            </div>

            <Card>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-gray-700/50">
                                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-400 uppercase">Name</th>
                                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-400 uppercase">Status</th>
                                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-400 uppercase">Cron</th>
                                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-400 uppercase">TTL</th>
                                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-400 uppercase">Last Backup</th>
                                <th className="text-right py-3 px-4 text-xs font-semibold text-gray-400 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading && (
                                <tr><td colSpan={6} className="py-8 text-center text-gray-400">Loading...</td></tr>
                            )}
                            {!isLoading && schedules?.length === 0 && (
                                <tr><td colSpan={6} className="py-8 text-center text-gray-400">No schedules found.</td></tr>
                            )}
                            {schedules?.map((schedule) => (
                                <tr key={schedule.name} className="border-b border-gray-700/30 hover:bg-dark-700/50">
                                    <td className="py-3 px-4 font-medium text-gray-100">{schedule.name}</td>
                                    <td className="py-3 px-4">
                                        <Badge variant={getPhaseVariant(schedule.phase || '')}>{schedule.phase}</Badge>
                                    </td>
                                    <td className="py-3 px-4 text-gray-300 font-mono text-sm">{schedule.schedule}</td>
                                    <td className="py-3 px-4 text-gray-300 text-sm">{schedule.ttl}</td>
                                    <td className="py-3 px-4 text-gray-300 text-sm">
                                        {schedule.lastBackup ? formatDate(schedule.lastBackup) : '-'}
                                    </td>
                                    <td className="py-3 px-4 text-right">
                                        <Button
                                            size="sm"
                                            variant="danger"
                                            onClick={() => {
                                                if (confirm('Delete schedule?')) deleteMutation.mutate(schedule.name)
                                            }}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* Create Schedule Modal */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-dark-800 rounded-xl p-6 max-w-md w-full mx-4 border border-gray-700">
                        <h2 className="text-xl font-bold text-gray-100 mb-4">Create Schedule</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Name</label>
                                <input
                                    className="w-full bg-dark-950 border border-gray-700 rounded px-3 py-2 text-white focus:border-primary focus:outline-none"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="daily-backup"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Cron Schedule</label>
                                <input
                                    className="w-full bg-dark-950 border border-gray-700 rounded px-3 py-2 text-white focus:border-primary focus:outline-none"
                                    value={formData.schedule}
                                    onChange={e => setFormData({ ...formData, schedule: e.target.value })}
                                    placeholder="0 1 * * *"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">TTL (Retention)</label>
                                <input
                                    className="w-full bg-dark-950 border border-gray-700 rounded px-3 py-2 text-white focus:border-primary focus:outline-none"
                                    value={formData.ttl}
                                    onChange={e => setFormData({ ...formData, ttl: e.target.value })}
                                    placeholder="720h0m0s"
                                    required
                                />
                                <p className="text-xs text-gray-500 mt-1">Example: 24h, 72h0m0s</p>
                            </div>
                            <div className="flex justify-end gap-2 mt-6">
                                <Button type="button" variant="secondary" onClick={() => setIsCreateModalOpen(false)}>Cancel</Button>
                                <Button type="submit" disabled={createMutation.isPending}>
                                    {createMutation.isPending ? 'Creating...' : 'Create'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
