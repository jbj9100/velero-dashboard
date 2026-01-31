import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { restoresApi } from '@/api/restores'
import type {
    CreateRestoreRequest,
    CreateRestoreWithModificationsRequest,
} from '@/types/velero'

export function useRestores() {
    return useQuery({
        queryKey: ['restores'],
        queryFn: restoresApi.getAll,
    })
}

export function useRestore(name: string) {
    return useQuery({
        queryKey: ['restores', name],
        queryFn: () => restoresApi.getById(name),
        enabled: !!name,
    })
}

export function useCreateRestore() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (data: CreateRestoreRequest) => restoresApi.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['restores'] })
        },
    })
}

export function useCreateRestoreWithModifications() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (data: CreateRestoreWithModificationsRequest) =>
            restoresApi.createWithModifications(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['restores'] })
        },
    })
}
