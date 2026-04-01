import React, { useEffect, useState } from 'react'
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator, Image,
} from 'react-native'
import { getMyReports, type Report } from '../api/reports'

const STATUS_CONFIG = {
  PENDING:   { label: 'Pending',   color: '#6b7280', bg: '#f3f4f6' },
  ASSIGNED:  { label: 'Assigned',  color: '#d97706', bg: '#fffbeb' },
  COLLECTED: { label: 'Collected', color: '#16a34a', bg: '#f0fdf4' },
}

const WASTE_LABELS: Record<string, string> = {
  PLASTIC: 'Plastic', ORGANIC: 'Organic', BULKY: 'Bulky',
  ELECTRONIC: 'Electronic', HAZARDOUS: 'Hazardous', OTHER: 'Other',
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
}

interface Props {
  onReportPress?: (report: Report) => void
}

export default function ReportHistoryScreen({ onReportPress }: Props) {
  const [reports, setReports] = useState<Report[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    getMyReports()
      .then(data => setReports(data))
      .catch(() => setHasError(true))
      .finally(() => setIsLoading(false))
  }, [])

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
        <Text style={styles.errorText}>Failed to load reports. Please try again.</Text>
      </View>
    )
  }

  if (reports.length === 0) {
    return (
      <View style={styles.centered} testID="empty-state">
        <Text style={styles.emptyIcon}>📋</Text>
        <Text style={styles.emptyTitle}>No reports yet</Text>
        <Text style={styles.emptySubtitle}>Your submitted reports will appear here</Text>
      </View>
    )
  }

  return (
    <FlatList
      style={styles.list}
      data={reports}
      keyExtractor={item => item.id}
      renderItem={({ item }) => {
        const status = STATUS_CONFIG[item.status]
        return (
          <TouchableOpacity
            style={styles.card}
            onPress={() => onReportPress?.(item)}
            testID={`report-item-${item.id}`}
          >
            <Image source={{ uri: item.photoUrl }} style={styles.thumbnail} />
            <View style={styles.info}>
              <Text style={styles.category}>{WASTE_LABELS[item.wasteType]}</Text>
              <Text style={styles.date}>{formatDate(item.createdAt)}</Text>
              <View style={[styles.badge, { backgroundColor: status.bg }]} testID={`status-badge-${item.id}`}>
                <Text style={[styles.badgeText, { color: status.color }]}>{status.label}</Text>
              </View>
            </View>
          </TouchableOpacity>
        )
      }}
      contentContainerStyle={styles.content}
    />
  )
}

const styles = StyleSheet.create({
  list: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 16, gap: 12 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, backgroundColor: '#fff' },
  card: {
    flexDirection: 'row', backgroundColor: '#fff',
    borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb',
    overflow: 'hidden',
  },
  thumbnail: { width: 80, height: 80 },
  info: { flex: 1, padding: 12, justifyContent: 'space-between' },
  category: { fontSize: 15, fontWeight: '600', color: '#111827' },
  date: { fontSize: 13, color: '#6b7280' },
  badge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 },
  badgeText: { fontSize: 12, fontWeight: '600' },
  errorText: { fontSize: 15, color: '#dc2626', textAlign: 'center' },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 6 },
  emptySubtitle: { fontSize: 14, color: '#6b7280', textAlign: 'center' },
})
