import { NavLink, Outlet } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

const NAV_ITEMS = [
  { to: '/dashboard/reports', label: 'Reports Map', icon: '🗺️' },
  { to: '/dashboard/routes', label: 'Route Optimizer', icon: '🛣️' },
  { to: '/dashboard/fleet', label: 'Fleet Tracking', icon: '🚛' },
  { to: '/dashboard/stats', label: 'Statistics', icon: '📊' },
]

function navClass(isActive: boolean) {
  const base = 'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors'
  return isActive ? base + ' bg-green-50 text-green-700' : base + ' text-gray-600 hover:bg-gray-50 hover:text-gray-900'
}

export default function DashboardLayout() {
  const { user, logout } = useAuthStore()

  return (
    <div className="flex h-screen bg-gray-50">
      <aside className="w-60 bg-white border-r border-gray-200 flex flex-col">
        <div className="px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center text-sm">
              🌿
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">Clean City AI</p>
              <p className="text-xs text-gray-400">Company Dashboard</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {NAV_ITEMS.map(({ to, label, icon }) => (
            <NavLink key={to} to={to} className={({ isActive }) => navClass(isActive)}>
              <span className="text-base">{icon}</span>
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="px-4 py-3 border-t border-gray-100">
          <p className="text-xs text-gray-500 truncate mb-2">{user?.email}</p>
          <button
            onClick={logout}
            className="w-full text-left text-xs text-gray-400 hover:text-red-500 transition-colors"
          >
            Sign out
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-hidden">
        <Outlet />
      </main>
    </div>
  )
}
