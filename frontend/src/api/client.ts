import axios from 'axios'
import { useClusterStore } from '@/store/clusterStore'

const apiClient = axios.create({
    headers: {
        'Content-Type': 'application/json',
    },
})

// Request interceptor to set dynamic baseURL
apiClient.interceptors.request.use(
    (config) => {
        // Get the active cluster URL from the store
        const store = useClusterStore.getState()
        const activeCluster = store.getActiveCluster()

        if (activeCluster) {
            config.baseURL = activeCluster.url + '/api'
        }

        return config
    },
    (error) => {
        return Promise.reject(error)
    }
)

// Response interceptor
apiClient.interceptors.response.use(
    (response) => {
        return response
    },
    (error) => {
        console.error('API Error:', error.response?.data || error.message)
        return Promise.reject(error)
    }
)

export default apiClient

// ==================== Type Definitions ====================
export interface PodVolumeBackup {
    name: string
    pvcName: string
    volumeName: string
    phase: string
    message?: string
    progress?: {
        bytesDone?: number
        totalBytes?: number
    }
}

export interface BackupRepository {
    name: string
    phase: string
    maintenanceFrequency?: string
    lastMaintenanceTime?: string
    message?: string
}

export interface NodeAgent {
    name: string
    nodeName: string
    status: string
    restartCount: number
}

// ==================== Backup APIs ====================
export async function deleteBackup(name: string): Promise<void> {
    await apiClient.delete(`/backups/${name}`)
}

export async function getBackupLogs(name: string): Promise<{ downloadUrl?: string }> {
    const response = await apiClient.get(`/backups/${name}/logs`)
    return response.data
}

export async function getBackupVolumeBackups(name: string): Promise<PodVolumeBackup[]> {
    const response = await apiClient.get(`/backups/${name}/volume-backups`)
    return response.data
}

// ==================== Restore APIs ====================
export async function getRestoreLogs(name: string): Promise<{ downloadUrl?: string }> {
    const response = await apiClient.get(`/restores/${name}/logs`)
    return response.data
}

// ==================== System Status APIs ====================
export async function getRepositories(): Promise<BackupRepository[]> {
    const response = await apiClient.get('/repositories')
    return response.data
}

export async function getNodeAgents(): Promise<NodeAgent[]> {
    const response = await apiClient.get('/node-agents')
    return response.data
}
