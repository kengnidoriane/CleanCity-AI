import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { getRoute, completeStop, type OptimizedRoute, type RouteStop } from '../api/routes'
import { SEVERITY_COLOR } from '../api/reports'

export default function DriverPage() {
  const { routeId } = useParams<{ routeId: string }>()
  const [route, setRoute] = useState<OptimizedRoute | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [completingIndex, setCompletingIndex] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!routeId) return
    getRoute(routeId)
      .then(setRoute)
      .catch(() => setError('Failed to load route. Please check your connection.'))
      .finally(() => setIsLoading(false))
  }, [routeId])

  const handleComplete = async (stopIndex: number) => {
    if (!routeId || completingIndex !== null) return
    setCompletingIndex(stopIndex)
    setError(null)
    try {
      const updated = await completeStop(routeId, stopIndex)
      setRoute(updated)
    } catch {
      setError('Failed to mark stop as collected. Please try again.')
    } finally {
      setCompletingIndex(null)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500 text-sm">Loading route...</p>
      </div>
    )
  }

  if (error && !route) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center max-w-sm">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      </div>
    )
  }

  if (!route) return null

  const stops = route.stopSequence as RouteStop[]
  const collectedCount = stops.filter((s) => s.collected).length
  const completionPercent = stops.length > 0 ? Math.round((collectedCount / stops.length) * 100) : 0
  const isCompleted = route.status === 'COMPLETED'

  return (
    <div className="min-h-screen bg-gray-50" data-testid="driver-page">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4 sticky top-0 z-10">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-base font-bold text-gray-900">Collection Route</h1>
            <p className="text-xs text-gray-400 mt-0.5">
              {collectedCount}/{stops.length} stops completed
            </p>
          </div>
          {isCompleted && (
            <span className="bg-green-100 text-green-700 text-xs font-bold px-3 py-1 rounded-full">
              ✓ COMPLETED
            </span>
          )}
        </div>

        {/* Progress bar */}
        <div className="bg-gray-200 rounded-full h-2" data-testid="progress-bar">
          <div
            className="bg-green-500 h-2 rounded-full transition-all duration-500"
            style={{ width: `${completionPercent}%` }}
          />
        </div>
        <p className="text-xs text-gray-400 mt-1 text-right">{completionPercent}%</p>
      </div>

      {/* Route info */}
      <div className="px-4 py-3 bg-white border-b border-gray-100">
        <div className="flex gap-6 text-xs text-gray-500">
          {route.totalDistanceKm && (
            <span>📍 {route.totalDistanceKm.toFixed(1)} km total</span>
          )}
          {route.estimatedDurationMin && (
            <span>⏱ ~{route.estimatedDurationMin} min</span>
          )}
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="mx-4 mt-3 bg-red-50 border border-red-200 rounded-lg px-4 py-2.5">
          <p className="text-xs text-red-600">{error}</p>
        </div>
      )}

      {/* Stop list */}
      <div className="px-4 py-4 space-y-3">
        {stops.map((stop, i) => (
          <div
            key={stop.reportId}
            className={`bg-white rounded-xl border p-4 transition-all ${
              stop.collected
                ? 'border-green-200 opacity-60'
                : 'border-gray-200 shadow-sm'
            }`}
            data-testid={`stop-item-${i}`}
          >
            <div className="flex items-start gap-3">
              {/* Stop number */}
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                stop.collected ? 'bg-green-100 text-green-600' : 'bg-blue-600 text-white'
              }`}>
                {stop.collected ? '✓' : i + 1}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: SEVERITY_COLOR[stop.severity as keyof typeof SEVERITY_COLOR] ?? '#6b7280' }}
                  />
                  <span className="text-xs font-semibold text-gray-700 capitalize">
                    {stop.severity.toLowerCase()} priority
                  </span>
                  {stop.reportIds.length > 1 && (
                    <span className="text-[10px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full font-medium">
                      {stop.reportIds.length} reports
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-400">
                  {stop.lat.toFixed(5)}, {stop.lng.toFixed(5)}
                </p>
              </div>

              {/* Action button */}
              {!stop.collected && !isCompleted && (
                <button
                  onClick={() => handleComplete(i)}
                  disabled={completingIndex !== null}
                  className="shrink-0 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed
                    text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors"
                  data-testid={`btn-complete-${i}`}
                >
                  {completingIndex === i ? '...' : 'Collected ✓'}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Completion message */}
      {isCompleted && (
        <div className="mx-4 mb-6 bg-green-50 border border-green-200 rounded-xl p-5 text-center" data-testid="completion-message">
          <p className="text-2xl mb-2">🎉</p>
          <p className="text-sm font-semibold text-green-800">Route completed!</p>
          <p className="text-xs text-green-600 mt-1">All stops have been collected.</p>
        </div>
      )}
    </div>
  )
}
