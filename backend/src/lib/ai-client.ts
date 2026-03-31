/**
 * HTTP client for the Python AI service.
 * Keeps the AI service call isolated so it can be easily mocked in tests.
 */

const AI_SERVICE_URL = process.env['AI_SERVICE_URL'] ?? 'http://localhost:8000'

export interface StopInput {
  reportId: string
  lat: number
  lng: number
  severity: string
}

export interface OptimizeResult {
  orderedStops: Array<{
    reportId: string
    reportIds: string[]
    lat: number
    lng: number
    severity: string
  }>
  totalDistanceKm: number
  estimatedDurationMin: number
}

export async function callOptimizeRoute(stops: StopInput[]): Promise<OptimizeResult> {
  const response = await fetch(`${AI_SERVICE_URL}/api/routes/optimize`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ stops }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: response.statusText })) as { detail?: string }
    throw { status: 502, message: `AI service error: ${error.detail ?? response.statusText}` }
  }

  return response.json() as Promise<OptimizeResult>
}
