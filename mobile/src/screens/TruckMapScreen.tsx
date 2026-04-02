import React, { useEffect, useState, useCallback } from 'react'
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native'
import MapView, { Marker, Callout } from 'react-native-maps'
import { getActiveTrucks, type ActiveTruck, type TruckPositionUpdate } from '../api/trucks'
import { connectToCity, onTruckPosition, disconnectSocket } from '../services/socket'
import { useAuthStore } from '../store/authStore'

// Default map center — Dakar, Senegal
const DEFAULT_REGION = {
  latitude: 14.6928,
  longitude: -17.4467,
  latitudeDelta: 0.1,
  longitudeDelta: 0.1,
}

export default function TruckMapScreen() {
  const user = useAuthStore((s) => s.user)
  const [trucks, setTrucks] = useState<ActiveTruck[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Update a single truck's position from WebSocket event
  const handlePositionUpdate = useCallback((update: TruckPositionUpdate) => {
    setTrucks(prev =>
      prev.map(t =>
        t.id === update.truckId
          ? { ...t, currentLat: update.lat, currentLng: update.lng, completionPercent: update.completionPercent }
          : t
      )
    )
  }, [])

  useEffect(() => {
    if (!user?.cityId) return

    // 1. Load initial truck positions via REST
    getActiveTrucks(user.cityId)
      .then(data => setTrucks(data))
      .finally(() => setIsLoading(false))

    // 2. Subscribe to real-time position updates via WebSocket
    const socket = connectToCity(user.cityId)
    const unsubscribe = onTruckPosition(socket, handlePositionUpdate)

    return () => {
      unsubscribe()
      disconnectSocket(user.cityId)
    }
  }, [user?.cityId, handlePositionUpdate])

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#16a34a" testID="loading-indicator" />
      </View>
    )
  }

  const activeTrucksWithCoords = trucks.filter(t => t.currentLat !== null && t.currentLng !== null)

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={DEFAULT_REGION}
        testID="map-view"
      >
        {activeTrucksWithCoords.map(truck => (
          <Marker
            key={truck.id}
            coordinate={{ latitude: truck.currentLat!, longitude: truck.currentLng! }}
            testID={`truck-marker-${truck.id}`}
          >
            {/* Custom truck marker */}
            <View style={styles.markerContainer}>
              <Text style={styles.markerEmoji}>🚛</Text>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${truck.completionPercent}%` as any }]} />
              </View>
            </View>

            {/* Callout shown on tap — US-C11 */}
            <Callout>
              <View style={styles.callout}>
                <Text style={styles.calloutName}>{truck.name}</Text>
                {truck.driver && (
                  <Text style={styles.calloutDriver}>👤 {truck.driver.user.name}</Text>
                )}
                <Text style={styles.calloutProgress}>
                  {truck.completionPercent}% complete
                </Text>
                {truck.etaMinutes !== null && (
                  <Text style={styles.calloutEta}>⏱ ETA: {truck.etaMinutes} min</Text>
                )}
              </View>
            </Callout>
          </Marker>
        ))}
      </MapView>

      {/* Banner when no trucks are active */}
      {activeTrucksWithCoords.length === 0 && (
        <View style={styles.noBanner} testID="no-trucks-banner">
          <Text style={styles.noBannerText}>No active trucks in your area right now</Text>
        </View>
      )}

      {/* Live indicator */}
      <View style={styles.liveBadge}>
        <View style={styles.liveDot} />
        <Text style={styles.liveText}>LIVE</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f9fafb' },
  markerContainer: { alignItems: 'center' },
  markerEmoji: { fontSize: 28 },
  progressBar: {
    width: 36, height: 4, backgroundColor: '#e5e7eb',
    borderRadius: 2, marginTop: 2, overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: '#16a34a', borderRadius: 2 },
  callout: { padding: 10, minWidth: 140 },
  calloutName: { fontSize: 15, fontWeight: '700', color: '#111827', marginBottom: 4 },
  calloutDriver: { fontSize: 13, color: '#6b7280', marginBottom: 2 },
  calloutProgress: { fontSize: 13, color: '#374151', marginBottom: 2 },
  calloutEta: { fontSize: 13, color: '#16a34a', fontWeight: '600' },
  noBanner: {
    position: 'absolute', bottom: 24, left: 20, right: 20,
    backgroundColor: '#fff', borderRadius: 12, padding: 14,
    borderWidth: 1, borderColor: '#e5e7eb',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 8, elevation: 3,
    alignItems: 'center',
  },
  noBannerText: { fontSize: 14, color: '#6b7280' },
  liveBadge: {
    position: 'absolute', top: 16, right: 16,
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 5,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1, shadowRadius: 4, elevation: 2,
  },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#16a34a', marginRight: 5 },
  liveText: { fontSize: 12, fontWeight: '700', color: '#16a34a', letterSpacing: 1 },
})
