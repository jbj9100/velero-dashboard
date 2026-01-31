import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardHeader, CardContent } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import ResourceModifierBuilder from '@/components/features/restores/ResourceModifierBuilder'
import { useBackups } from '@/hooks/useBackups'
import { useCreateRestoreWithModifications } from '@/hooks/useRestores'
import { ArrowLeft, AlertCircle } from 'lucide-react'
import type { ResourceModifierRule } from '@/types/velero'

export default function CreateRestoreWithModificationsPage() {
    const navigate = useNavigate()
    const { data: backups } = useBackups()
    const createRestore = useCreateRestoreWithModifications()

    const [name, setName] = useState('')
    const [backupName, setBackupName] = useState('')
    const [rules, setRules] = useState<ResourceModifierRule[]>([])
    const [error, setError] = useState<string | null>(null)

    const handleSubmit = async () => {
        if (!name || !backupName) {
            setError('Please provide a restore name and select a backup.')
            return
        }
        if (rules.length === 0) {
            setError('Please add at least one modification rule.')
            return
        }

        try {
            await createRestore.mutateAsync({
                name,
                backupName,
                resourceModifierRules: rules,
            })
            navigate('/restores')
        } catch (err) {
            setError('Failed to create restore. check console for details.')
            console.error(err)
        }
    }

    return (
        <div className="space-y-6 max-w-4xl mx-auto pb-10">
            <div className="flex items-center space-x-4">
                <Button variant="ghost" onClick={() => navigate('/restores')}>
                    <ArrowLeft className="w-5 h-5" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold text-gray-100">Restore with Modifications</h1>
                    <p className="text-gray-400">Change resource fields (like storage class, replicas) during restore.</p>
                </div>
            </div>

            {error && (
                <div className="bg-danger/10 border border-danger/30 p-4 rounded-lg flex items-center text-danger">
                    <AlertCircle className="w-5 h-5 mr-2" />
                    {error}
                </div>
            )}

            <Card>
                <CardHeader title="Basic Configuration" />
                <CardContent className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Restore Name</label>
                        <input
                            className="w-full bg-dark-950 border border-gray-700 rounded-lg px-4 py-2 text-gray-100 focus:border-primary focus:outline-none"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. restore-prod-debug-01"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Select Backup</label>
                        <select
                            className="w-full bg-dark-950 border border-gray-700 rounded-lg px-4 py-2 text-gray-100 focus:border-primary focus:outline-none"
                            value={backupName}
                            onChange={(e) => setBackupName(e.target.value)}
                        >
                            <option value="">-- Select a backup source --</option>
                            {backups?.map((backup) => (
                                <option key={backup.name} value={backup.name}>
                                    {backup.name} ({backup.phase})
                                </option>
                            ))}
                        </select>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader title="Resource Modification Rules" subtitle="Define JSON patches to apply to resources" />
                <CardContent>
                    <ResourceModifierBuilder rules={rules} onChange={setRules} />
                </CardContent>
            </Card>

            <div className="flex justify-end space-x-4">
                <Button variant="ghost" onClick={() => navigate('/restores')}>
                    Cancel
                </Button>
                <Button variant="primary" size="lg" onClick={handleSubmit} disabled={createRestore.isPending}>
                    {createRestore.isPending ? 'Creating...' : 'Create Restore Process'}
                </Button>
            </div>
        </div>
    )
}
