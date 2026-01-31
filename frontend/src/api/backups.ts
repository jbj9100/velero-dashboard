import apiClient from './client'
import type { Backup, CreateBackupRequest } from '@/types/velero'

export const backupsApi = {
    // Get all backups
    getAll: async (): Promise<Backup[]> => {
        const response = await apiClient.get<Backup[]>('/backups')
        return response.data
    },

    // Get single backup
    getById: async (name: string): Promise<Backup> => {
        const response = await apiClient.get<Backup>(`/backups/${name}`)
        return response.data
    },

    // Create backup
    create: async (data: CreateBackupRequest): Promise<Backup> => {
        const response = await apiClient.post<Backup>('/backups', data)
        return response.data
    },

    // Delete backup
    delete: async (name: string): Promise<void> => {
        await apiClient.delete(`/backups/${name}`)
    },
}
