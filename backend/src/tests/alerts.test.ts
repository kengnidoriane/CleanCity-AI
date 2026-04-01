import { describe, it, expect } from 'vitest'
import { haversineKm, isDeviated, isIdle } from '../lib/alerts'

describe('haversineKm', () => {
  it('should return 0 for identical points', () => {
    expect(haversineKm(14.6928, -17.4467, 14.6928, -17.4467)).toBe(0)
  })

  it('should return approximately correct distance between two points', () => {
    // Dakar to a point ~1km away
    const dist = haversineKm(14.6928, -17.4467, 14.7018, -17.4467)
    expect(dist).toBeGreaterThan(0.9)
    expect(dist).toBeLessThan(1.1)
  })
})

describe('isDeviated', () => {
  const routeStops = [
    { lat: 14.6928, lng: -17.4467 },
    { lat: 14.7100, lng: -17.4600 },
  ]

  it('should return false when truck is on route (within 500m)', () => {
    // Truck is very close to first stop
    expect(isDeviated(14.6930, -17.4470, routeStops)).toBe(false)
  })

  it('should return true when truck is more than 500m from all stops', () => {
    // Truck is far from all stops
    expect(isDeviated(14.8000, -17.5000, routeStops)).toBe(true)
  })

  it('should return false when route has no stops', () => {
    expect(isDeviated(14.6928, -17.4467, [])).toBe(false)
  })
})

describe('isIdle', () => {
  it('should return false when truck was updated recently', () => {
    const recentUpdate = new Date(Date.now() - 5 * 60 * 1000) // 5 minutes ago
    expect(isIdle(recentUpdate)).toBe(false)
  })

  it('should return true when truck has not moved for more than 15 minutes', () => {
    const oldUpdate = new Date(Date.now() - 20 * 60 * 1000) // 20 minutes ago
    expect(isIdle(oldUpdate)).toBe(true)
  })

  it('should return false when lastUpdated is null', () => {
    expect(isIdle(null)).toBe(false)
  })
})
