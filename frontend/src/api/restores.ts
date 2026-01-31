import apiClient from './client'
import type {
    Restore,
    CreateRestoreRequest,
    CreateRestoreWithModificationsRequest,
} from '@/types/velero'

export const restoresApi = {
    // Get all restores
    getAll: async (): Promise<Restore[]> => {
        const response = await apiClient.get<Restore[]>('/restores')
        return response.data
    },

    // Get single restore
    getById: async (name: string): Promise<Restore> => {
        const response = await apiClient.get<Restore>(`/restores/${name}`)
        return response.data
    },

    // Create restore
    create: async (data: CreateRestoreRequest): Promise<Restore> => {
        const response = await apiClient.post<Restore>('/restores', data)
        return response.data
    },

    // Create restore with modifications
    createWithModifications: async (
        data: CreateRestoreWithModificationsRequest
    ): Promise<Restore> => {
        const response = await apiClient.post<Restore>(
            '/restores/with-modifications',
            data
        )
        return response.data
    },
}
