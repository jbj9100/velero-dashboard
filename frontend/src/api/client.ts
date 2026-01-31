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
