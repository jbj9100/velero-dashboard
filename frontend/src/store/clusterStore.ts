import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type ClusterRole = 'source' | 'destination' | 'both'

export interface Cluster {
    id: string
    name: string
    url: string
    role: ClusterRole
}

// Simple UUID v4 generator (fallback for crypto.randomUUID)
function generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0
        const v = c === 'x' ? r : (r & 0x3) | 0x8
        return v.toString(16)
    })
}

interface ClusterState {
    clusters: Cluster[]
    activeClusterId: string | null
    addCluster: (cluster: Omit<Cluster, 'id'>) => void
    removeCluster: (id: string) => void
    updateCluster: (id: string, data: Partial<Cluster>) => void
    setActiveCluster: (id: string) => void
    getActiveCluster: () => Cluster | undefined
}

export const useClusterStore = create<ClusterState>()(
    persist(
        (set, get) => ({
            clusters: [
                { id: 'default', name: 'Default Cluster', url: 'http://localhost:8000', role: 'both' }
            ],
            activeClusterId: 'default',

            addCluster: (cluster) => {
                const id = generateUUID()
                set((state) => ({
                    clusters: [...state.clusters, { ...cluster, id }],
                    // If it's the first cluster, make it active
                    activeClusterId: state.clusters.length === 0 ? id : state.activeClusterId,
                }))
            },

            removeCluster: (id) => {
                set((state) => {
                    const newClusters = state.clusters.filter((c) => c.id !== id)
                    // If active cluster is removed, switch to the first available or null
                    const newActiveId =
                        state.activeClusterId === id
                            ? newClusters[0]?.id || null
                            : state.activeClusterId
                    return {
                        clusters: newClusters,
                        activeClusterId: newActiveId,
                    }
                })
            },

            updateCluster: (id, data) => {
                set((state) => ({
                    clusters: state.clusters.map((c) =>
                        c.id === id ? { ...c, ...data } : c
                    ),
                }))
            },

            setActiveCluster: (id) => {
                set({ activeClusterId: id })
            },

            getActiveCluster: () => {
                const state = get()
                return state.clusters.find((c) => c.id === state.activeClusterId)
            },
        }),
        {
            name: 'velero-cluster-storage',
        }
    )
)
