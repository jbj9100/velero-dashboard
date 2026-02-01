import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import AppLayout from './components/layout/AppLayout'
import DashboardPage from './pages/DashboardPage'
import BackupsPage from './pages/BackupsPage'
import RestoresPage from './pages/RestoresPage'
import CreateRestoreWithModificationsPage from './pages/CreateRestoreWithModificationsPage'
import SettingsPage from './pages/SettingsPage'
import SchedulesPage from './pages/SchedulesPage'
import SystemStatusPage from './pages/SystemStatusPage'

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            refetchOnWindowFocus: false,
            retry: 1,
        },
    },
})

function App() {
    return (
        <QueryClientProvider client={queryClient}>
            <BrowserRouter>
                <Routes>
                    <Route path="/" element={<AppLayout />}>
                        <Route index element={<DashboardPage />} />
                        <Route path="backups" element={<BackupsPage />} />
                        <Route path="restores" element={<RestoresPage />} />
                        <Route path="restores/create-with-mods" element={<CreateRestoreWithModificationsPage />} />
                        <Route path="schedules" element={<SchedulesPage />} />
                        <Route path="system" element={<SystemStatusPage />} />
                        <Route path="settings" element={<SettingsPage />} />
                    </Route>
                </Routes>
            </BrowserRouter>
        </QueryClientProvider>
    )
}

export default App
