import { Card, CardHeader, CardContent } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import { useBackups } from '@/hooks/useBackups'
import { useRestores } from '@/hooks/useRestores'
import { formatDate } from '@/utils/formatters'
import { getPhaseVariant } from '@/utils/phase'
import { Database, Upload, Calendar, CheckCircle, XCircle, RefreshCw } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function DashboardPage() {
    const navigate = useNavigate()
    const { data: backups, isLoading: backupsLoading } = useBackups()
    const { data: restores, isLoading: restoresLoading } = useRestores()

    const recentBackups = backups?.slice(0, 3) || []
    const recentRestores = restores?.slice(0, 2) || []

    const completedBackups = backups?.filter((b) => b.phase === 'Completed').length || 0
    const inProgressRestores = restores?.filter((r) => r.phase === 'InProgress').length || 0
    const failedOps = (backups?.filter((b) => b.phase === 'Failed').length || 0) +
        (restores?.filter((r) => r.phase === 'Failed').length || 0)

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div>
                <h1 className="text-3xl font-bold text-gray-100">Dashboard</h1>
                <p className="text-gray-400 mt-2">Overview of your Velero backup and restore operations</p>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-400">Total Backups</p>
                            {backupsLoading ? (
                                <RefreshCw className="w-6 h-6 text-gray-400 animate-spin mt-2" />
                            ) : (
                                <>
                                    <p className="text-3xl font-bold text-gray-100 mt-2">{backups?.length || 0}</p>
                                    <p className="text-xs text-success mt-1 flex items-center">
                                        <span className="mr-1">✓</span> {completedBackups} completed
                                    </p>
                                </>
                            )}
                        </div>
                        <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Database className="w-6 h-6 text-primary" />
                        </div>
                    </div>
                </Card>

                <Card>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-400">Total Restores</p>
                            {restoresLoading ? (
                                <RefreshCw className="w-6 h-6 text-gray-400 animate-spin mt-2" />
                            ) : (
                                <>
                                    <p className="text-3xl font-bold text-gray-100 mt-2">{restores?.length || 0}</p>
                                    <p className="text-xs text-info mt-1 flex items-center">
                                        <span className="mr-1">→</span> {inProgressRestores} in progress
                                    </p>
                                </>
                            )}
                        </div>
                        <div className="w-12 h-12 rounded-lg bg-info/10 flex items-center justify-center">
                            <Upload className="w-6 h-6 text-info" />
                        </div>
                    </div>
                </Card>

                <Card>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-400">Active Schedules</p>
                            <p className="text-3xl font-bold text-gray-100 mt-2">-</p>
                            <p className="text-xs text-gray-500 mt-1 flex items-center">
                                <Calendar className="w-3 h-3 mr-1" /> Coming soon
                            </p>
                        </div>
                        <div className="w-12 h-12 rounded-lg bg-success/10 flex items-center justify-center">
                            <Calendar className="w-6 h-6 text-success" />
                        </div>
                    </div>
                </Card>

                <Card>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-400">Failed Operations</p>
                            <p className="text-3xl font-bold text-gray-100 mt-2">{failedOps}</p>
                            <p className="text-xs text-gray-500 mt-1 flex items-center">
                                <CheckCircle className="w-3 h-3 mr-1" /> Last 7 days
                            </p>
                        </div>
                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${failedOps > 0 ? 'bg-danger/10' : 'bg-dark-700'
                            }`}>
                            <XCircle className={`w-6 h-6 ${failedOps > 0 ? 'text-danger' : 'text-gray-500'}`} />
                        </div>
                    </div>
                </Card>
            </div>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader title="Recent Backups" />
                    <CardContent>
                        {backupsLoading ? (
                            <div className="py-8 text-center">
                                <RefreshCw className="w-8 h-8 text-gray-400 animate-spin mx-auto mb-3" />
                                <p className="text-gray-400">Loading...</p>
                            </div>
                        ) : recentBackups.length === 0 ? (
                            <div className="py-8 text-center text-gray-400">No backups yet</div>
                        ) : (
                            <div className="space-y-3">
                                {recentBackups.map((backup) => (
                                    <div key={backup.name} className="flex items-center justify-between p-3 bg-dark-900/50 rounded-lg">
                                        <div>
                                            <p className="text-sm font-medium text-gray-100">{backup.name}</p>
                                            <p className="text-xs text-gray-400 mt-1">{formatDate(backup.startTimestamp)}</p>
                                        </div>
                                        <Badge variant={getPhaseVariant(backup.phase)}>{backup.phase}</Badge>
                                    </div>
                                ))}
                            </div>
                        )}
                        <Button variant="ghost" className="w-full mt-4" size="sm" onClick={() => navigate('/backups')}>
                            View All Backups
                        </Button>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader title="Recent Restores" />
                    <CardContent>
                        {restoresLoading ? (
                            <div className="py-8 text-center">
                                <RefreshCw className="w-8 h-8 text-gray-400 animate-spin mx-auto mb-3" />
                                <p className="text-gray-400">Loading...</p>
                            </div>
                        ) : recentRestores.length === 0 ? (
                            <div className="py-8 text-center text-gray-400">No restores yet</div>
                        ) : (
                            <div className="space-y-3">
                                {recentRestores.map((restore) => (
                                    <div key={restore.name} className="flex items-center justify-between p-3 bg-dark-900/50 rounded-lg">
                                        <div>
                                            <p className="text-sm font-medium text-gray-100">{restore.name}</p>
                                            <p className="text-xs text-gray-400 mt-1">{formatDate(restore.startTimestamp)}</p>
                                        </div>
                                        <Badge variant={getPhaseVariant(restore.phase)}>{restore.phase}</Badge>
                                    </div>
                                ))}
                            </div>
                        )}
                        <Button variant="ghost" className="w-full mt-4" size="sm" onClick={() => navigate('/restores')}>
                            View All Restores
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
