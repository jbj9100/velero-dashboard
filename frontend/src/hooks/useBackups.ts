import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { backupsApi } from '@/api/backups'
import type { CreateBackupRequest } from '@/types/velero'

export function useBackups() {
    return useQuery({
        queryKey: ['backups'],
        queryFn: backupsApi.getAll,
    })
}

export function useBackup(name: string) {
    return useQuery({
        queryKey: ['backups', name],
        queryFn: () => backupsApi.getById(name),
        enabled: !!name,
    })
}

export function useCreateBackup() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (data: CreateBackupRequest) => backupsApi.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['backups'] })
        },
    })
}

export function useDeleteBackup() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (name: string) => backupsApi.delete(name),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['backups'] })
        },
    })
}
