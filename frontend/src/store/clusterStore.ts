import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface Cluster {
    id: string
    name: string
    url: string
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
                { id: 'default', name: 'Default Cluster', url: 'http://localhost:8000' }
            ],
            activeClusterId: 'default',

            addCluster: (cluster) => {
                const id = crypto.randomUUID()
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
