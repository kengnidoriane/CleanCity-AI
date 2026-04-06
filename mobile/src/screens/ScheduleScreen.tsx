import React, { useEffect, useState } from 'react'
import {
  View, Text, ScrollView, StyleSheet, ActivityIndicator,
} from 'react-native'
import { getSchedules, type Schedule } from '../api/schedules'
import { useAuthStore } from '../store/authStore'

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const DAY_COLORS = [
  '#f3f4f6', '#dbeafe', '#dcfce7', '#fef9c3',
  '#fce7f3', '#ede9fe', '#ffedd5',
]

/** Group schedules by zone name */
function groupByZone(schedules: Schedule[]): Record<string, Schedule[]> {
  return schedules.reduce<Record<string, Schedule[]>>((acc, s) => {
    if (!acc[s.zone]) acc[s.zone] = []
    acc[s.zone]!.push(s)
    return acc
  }, {})
}

export default function ScheduleScreen() {
  const user = useAuthStore((s) => s.user)
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    if (!user?.cityId) return
    getSchedules(user.cityId)
      .then(data => setSchedules(data))
      .catch(() => setHasError(true))
      .finally(() => setIsLoading(false))
  }, [user?.cityId])

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#16a34a" testID="loading-indicator" />
      </View>
    )
  }

  if (hasError) {
    return (
      <View style={styles.centered} testID="error-state">
        <Text style={styles.errorText}>Failed to load schedules. Please try again.</Text>
      </View>
    )
  }

  if (schedules.length === 0) {
    return (
      <View style={styles.centered} testID="empty-state">
        <Text style={styles.emptyIcon}>📅</Text>
        <Text style={styles.emptyTitle}>No schedules published</Text>
        <Text style={styles.emptySubtitle}>Collection schedules for your area will appear here</Text>
      </View>
    )
  }

  const grouped = groupByZone(schedules)

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Collection Schedule</Text>
      <Text style={styles.subtitle}>Upcoming collections in your city</Text>

      {Object.entries(grouped).map(([zone, items]) => (
        <View key={zone} style={styles.zoneCard} testID={`zone-${zone}`}>
          {/* Zone header */}
          <View style={styles.zoneHeader}>
            <Text style={styles.zoneIcon}>📍</Text>
            <Text style={styles.zoneName}>{zone}</Text>
          </View>

          {/* Schedule rows sorted by day */}
          {items
            .slice()
            .sort((a, b) => a.dayOfWeek - b.dayOfWeek)
            .map(item => (
              <View
                key={item.id}
                style={[styles.scheduleRow, { backgroundColor: DAY_COLORS[item.dayOfWeek] ?? '#f3f4f6' }]}
                testID={`schedule-item-${item.id}`}
              >
                <View style={styles.dayBadge}>
                  <Text style={styles.dayText}>{DAY_NAMES[item.dayOfWeek]}</Text>
                </View>
                <View style={styles.timeBlock}>
                  <Text style={styles.timeText}>
                    {item.timeWindowStart} – {item.timeWindowEnd}
                  </Text>
                </View>
                <Text style={styles.truckIcon}>🚛</Text>
              </View>
            ))}
        </View>
      ))}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  content: { padding: 20, paddingBottom: 40 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, backgroundColor: '#f9fafb' },
  title: { fontSize: 24, fontWeight: '700', color: '#111827', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#6b7280', marginBottom: 24 },
  zoneCard: {
    backgroundColor: '#fff', borderRadius: 14,
    borderWidth: 1, borderColor: '#e5e7eb',
    marginBottom: 16, overflow: 'hidden',
  },
  zoneHeader: {
    flexDirection: 'row', alignItems: 'center',
    padding: 14, borderBottomWidth: 1, borderBottomColor: '#f3f4f6',
  },
  zoneIcon: { fontSize: 16, marginRight: 8 },
  zoneName: { fontSize: 16, fontWeight: '700', color: '#111827' },
  scheduleRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: '#f3f4f6',
  },
  dayBadge: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: '#e5e7eb', marginRight: 12,
  },
  dayText: { fontSize: 13, fontWeight: '700', color: '#374151' },
  timeBlock: { flex: 1 },
  timeText: { fontSize: 15, fontWeight: '600', color: '#111827' },
  truckIcon: { fontSize: 20 },
  errorText: { fontSize: 15, color: '#dc2626', textAlign: 'center' },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 6 },
  emptySubtitle: { fontSize: 14, color: '#6b7280', textAlign: 'center' },
})
