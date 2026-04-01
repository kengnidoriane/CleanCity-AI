import React, { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native'
import { useForm, Controller } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { loginCitizen } from '../api/auth'
import { useAuthStore } from '../store/authStore'

const loginSchema = z.object({
  phone: z.string().min(8, 'Phone number is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

type LoginForm = z.infer<typeof loginSchema>

interface Props {
  onSuccess?: () => void
  onRegisterPress?: () => void
}

export default function LoginScreen({ onSuccess, onRegisterPress }: Props) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const setAuth = useAuthStore((s) => s.setAuth)

  const { control, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { phone: '', password: '' },
  })

  const onSubmit = async (data: LoginForm) => {
    setIsSubmitting(true)
    setErrorMessage(null)
    try {
      const res = await loginCitizen(data.phone, data.password)
      await setAuth(res.token, res.user)
      onSuccess?.()
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Login failed. Please try again.'
      setErrorMessage(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Welcome back</Text>
        <Text style={styles.subtitle}>Sign in to Clean City AI</Text>

        {/* Phone */}
        <View style={styles.field}>
          <Text style={styles.label}>Phone Number</Text>
          <Controller
            control={control}
            name="phone"
            render={({ field: { onChange, value } }) => (
              <TextInput
                style={[styles.input, errors.phone && styles.inputError]}
                placeholder="+221 77 000 00 00"
                value={value}
                onChangeText={onChange}
                keyboardType="phone-pad"
                autoCapitalize="none"
                testID="input-phone"
              />
            )}
          />
          {errors.phone && <Text style={styles.error}>{errors.phone.message}</Text>}
        </View>

        {/* Password */}
        <View style={styles.field}>
          <Text style={styles.label}>Password</Text>
          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, value } }) => (
              <TextInput
                style={[styles.input, errors.password && styles.inputError]}
                placeholder="Your password"
                value={value}
                onChangeText={onChange}
                secureTextEntry
                testID="input-password"
              />
            )}
          />
          {errors.password && <Text style={styles.error}>{errors.password.message}</Text>}
        </View>

        {/* API error message — shown inline instead of Alert for better UX */}
        {errorMessage && (
          <Text style={styles.apiError} testID="error-message">{errorMessage}</Text>
        )}

        {/* Submit */}
        <TouchableOpacity
          style={[styles.button, isSubmitting && styles.buttonDisabled]}
          onPress={handleSubmit(onSubmit)}
          disabled={isSubmitting}
          testID="btn-login"
        >
          {isSubmitting
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.buttonText}>Sign In</Text>
          }
        </TouchableOpacity>

        {/* Register link */}
        <TouchableOpacity onPress={onRegisterPress} style={styles.registerLink} testID="btn-go-register">
          <Text style={styles.registerText}>
            No account yet? <Text style={styles.registerTextBold}>Create one</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#fff' },
  container: { flexGrow: 1, padding: 24, justifyContent: 'center' },
  title: { fontSize: 28, fontWeight: '700', color: '#1a1a1a', marginBottom: 4 },
  subtitle: { fontSize: 16, color: '#666', marginBottom: 32 },
  field: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    backgroundColor: '#fafafa',
  },
  inputError: { borderColor: '#e53e3e' },
  error: { color: '#e53e3e', fontSize: 12, marginTop: 4 },
  apiError: {
    color: '#e53e3e',
    fontSize: 14,
    marginBottom: 12,
    textAlign: 'center',
    backgroundColor: '#fff5f5',
    padding: 10,
    borderRadius: 8,
  },
  button: {
    backgroundColor: '#16a34a',
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  registerLink: { marginTop: 20, alignItems: 'center' },
  registerText: { color: '#666', fontSize: 14 },
  registerTextBold: { color: '#16a34a', fontWeight: '700' },
})
