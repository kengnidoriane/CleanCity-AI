import React, { useState, useEffect } from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet,
  Image, ScrollView, ActivityIndicator,
} from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import * as Location from 'expo-location'
import { submitReport, type WasteType, type Severity } from '../api/reports'
import { useAuthStore } from '../store/authStore'

const WASTE_TYPES: { key: WasteType; label: string }[] = [
  { key: 'PLASTIC', label: 'Plastic' },
  { key: 'ORGANIC', label: 'Organic' },
  { key: 'BULKY', label: 'Bulky' },
  { key: 'ELECTRONIC', label: 'Electronic' },
  { key: 'HAZARDOUS', label: 'Hazardous' },
  { key: 'OTHER', label: 'Other' },
]

const SEVERITIES: { key: Severity; label: string; color: string }[] = [
  { key: 'LOW', label: 'Small', color: '#16a34a' },
  { key: 'MEDIUM', label: 'Medium', color: '#d97706' },
  { key: 'HIGH', label: 'Large', color: '#dc2626' },
]

interface Props {
  onSuccess?: () => void
}

export default function ReportScreen({ onSuccess }: Props) {
  const user = useAuthStore((s) => s.user)
  const [photoUri, setPhotoUri] = useState<string | null>(null)
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null)
  const [wasteType, setWasteType] = useState<WasteType | null>(null)
  const [severity, setSeverity] = useState<Severity | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Capture GPS on mount
  useEffect(() => {
    Location.requestForegroundPermissionsAsync().then(({ status }) => {
      if (status === 'granted') {
        Location.getCurrentPositionAsync({}).then((pos) => {
          setLocation({ latitude: pos.coords.latitude, longitude: pos.coords.longitude })
        })
      }
    })
  }, [])

  const handleTakePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync()
    if (status !== 'granted') {
      setErrorMessage('Camera permission is required to take a photo')
      return
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.7,
      allowsEditing: false,
    })
    if (!result.canceled && result.assets[0]) {
      setPhotoUri(result.assets[0].uri)
      setErrorMessage(null)
    }
  }

  const handleSubmit = async () => {
    if (!photoUri) { setErrorMessage('Please take a photo first'); return }
    if (!wasteType) { setErrorMessage('Please select a waste category'); return }
    if (!severity) { setErrorMessage('Please select the waste size'); return }
    if (!location) { setErrorMessage('GPS location not available. Please enable location.'); return }
    if (!user?.cityId) return

    setIsSubmitting(true)
    setErrorMessage(null)
    try {
      await submitReport({
        latitude: location.latitude,
        longitude: location.longitude,
        wasteType,
        severity,
        cityId: user.cityId,
        photo: { uri: photoUri, name: 'photo.jpg', type: 'image/jpeg' },
      })
      setSuccessMessage('Report submitted successfully!')
      onSuccess?.()
    } catch {
      setErrorMessage('Failed to submit report. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Report Waste</Text>

      {/* Photo capture — US-C03 */}
      <TouchableOpacity style={styles.photoBox} onPress={handleTakePhoto} testID="btn-take-photo">
        {photoUri
          ? <Image source={{ uri: photoUri }} style={styles.photoPreview} testID="photo-preview" />
          : <Text style={styles.photoPlaceholder}>📷  Tap to take a photo</Text>
        }
      </TouchableOpacity>

      {/* GPS status — US-C04 */}
      <Text style={styles.gpsStatus}>
        {location
          ? `📍 GPS: ${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`
          : '📍 Acquiring GPS location...'}
      </Text>

      {/* Waste category — US-C05 */}
      <Text style={styles.sectionLabel}>Waste Category</Text>
      <View style={styles.grid}>
        {WASTE_TYPES.map(({ key, label }) => (
          <TouchableOpacity
            key={key}
            style={[styles.chip, wasteType === key && styles.chipSelected]}
            onPress={() => setWasteType(key)}
            testID={`category-${key}`}
          >
            <Text style={[styles.chipText, wasteType === key && styles.chipTextSelected]}>
              {label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Severity — US-C05 */}
      <Text style={styles.sectionLabel}>Waste Size</Text>
      <View style={styles.row}>
        {SEVERITIES.map(({ key, label, color }) => (
          <TouchableOpacity
            key={key}
            style={[styles.severityChip, severity === key && { backgroundColor: color, borderColor: color }]}
            onPress={() => setSeverity(key)}
            testID={`severity-${key}`}
          >
            <Text style={[styles.severityText, severity === key && styles.severityTextSelected]}>
              {label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Error / success */}
      {errorMessage && <Text style={styles.error} testID="error-message">{errorMessage}</Text>}
      {successMessage && <Text style={styles.success}>{successMessage}</Text>}

      {/* Submit — US-C06 */}
      <TouchableOpacity
        style={[styles.button, isSubmitting && styles.buttonDisabled]}
        onPress={handleSubmit}
        disabled={isSubmitting}
        testID="btn-submit"
      >
        {isSubmitting
          ? <ActivityIndicator color="#fff" />
          : <Text style={styles.buttonText}>Submit Report</Text>
        }
      </TouchableOpacity>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 20, paddingBottom: 40 },
  title: { fontSize: 24, fontWeight: '700', color: '#1a1a1a', marginBottom: 20 },
  photoBox: {
    height: 200, borderRadius: 12, borderWidth: 2, borderColor: '#ddd',
    borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center',
    backgroundColor: '#f9fafb', marginBottom: 12, overflow: 'hidden',
  },
  photoPreview: { width: '100%', height: '100%', resizeMode: 'cover' },
  photoPlaceholder: { fontSize: 16, color: '#9ca3af' },
  gpsStatus: { fontSize: 13, color: '#6b7280', marginBottom: 20 },
  sectionLabel: { fontSize: 15, fontWeight: '600', color: '#374151', marginBottom: 10 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    borderWidth: 1, borderColor: '#d1d5db', backgroundColor: '#f9fafb',
  },
  chipSelected: { backgroundColor: '#16a34a', borderColor: '#16a34a' },
  chipText: { fontSize: 14, color: '#374151' },
  chipTextSelected: { color: '#fff', fontWeight: '600' },
  row: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  severityChip: {
    flex: 1, paddingVertical: 10, borderRadius: 10,
    borderWidth: 1, borderColor: '#d1d5db', alignItems: 'center',
  },
  severityText: { fontSize: 14, color: '#374151', fontWeight: '500' },
  severityTextSelected: { color: '#fff', fontWeight: '700' },
  error: { color: '#dc2626', fontSize: 14, marginBottom: 12, textAlign: 'center' },
  success: { color: '#16a34a', fontSize: 14, marginBottom: 12, textAlign: 'center' },
  button: {
    backgroundColor: '#16a34a', borderRadius: 10,
    padding: 16, alignItems: 'center',
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
})
