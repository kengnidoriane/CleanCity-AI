import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import AuthGuard from './components/AuthGuard'

// Placeholder for dashboard — will be replaced in US-E02+
function DashboardPlaceholder() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="text-4xl mb-4">🚛</div>
        <h1 className="text-2xl font-bold text-gray-900">Company Dashboard</h1>
        <p className="text-gray-500 mt-2">Reports map and fleet management coming next.</p>
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
              <DashboardPlaceholder />
            </AuthGuard>
          }
        />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
