import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import ReportsMapPage from './pages/ReportsMapPage'
import DashboardLayout from './components/DashboardLayout'
import AuthGuard from './components/AuthGuard'

function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="h-full flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <p className="text-2xl mb-2">🚧</p>
        <p className="text-gray-500 text-sm">{title} — coming soon</p>
      </div>
    </div>
  )
}

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
          <Route index element={<Navigate to="reports" replace />} />
          <Route path="reports" element={<ReportsMapPage />} />
          <Route path="routes" element={<PlaceholderPage title="Route Optimizer" />} />
          <Route path="fleet" element={<PlaceholderPage title="Fleet Tracking" />} />
          <Route path="stats" element={<PlaceholderPage title="Statistics" />} />
        </Route>
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
