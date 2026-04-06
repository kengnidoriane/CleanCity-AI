import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import ReportsMapPage from './pages/ReportsMapPage'
import RouteOptimizerPage from './pages/RouteOptimizerPage'
import FleetTrackingPage from './pages/FleetTrackingPage'
import DriverPage from './pages/DriverPage'
import StatsPage from './pages/StatsPage'
import DashboardLayout from './components/DashboardLayout'
import AuthGuard from './components/AuthGuard'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/driver/:routeId" element={<DriverPage />} />
        <Route
          path="/dashboard"
          element={
            <AuthGuard>
              <DashboardLayout />
            </AuthGuard>
          }
        >
          <Route index element={<Navigate to="reports" replace />} />
          <Route path="reports" element={<ReportsMapPage />} />
          <Route path="routes" element={<RouteOptimizerPage />} />
          <Route path="fleet" element={<FleetTrackingPage />} />
          <Route path="stats" element={<StatsPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
