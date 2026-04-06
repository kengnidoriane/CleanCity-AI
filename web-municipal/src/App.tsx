import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import KpiDashboardPage from './pages/KpiDashboardPage'
import HotspotMapPage from './pages/HotspotMapPage'
import DashboardLayout from './components/DashboardLayout'
import AuthGuard from './components/AuthGuard'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/dashboard"
          element={
            <AuthGuard>
              <DashboardLayout />
            </AuthGuard>
          }
        >
          <Route index element={<Navigate to="kpi" replace />} />
          <Route path="kpi" element={<KpiDashboardPage />} />
          <Route path="hotspots" element={<HotspotMapPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
