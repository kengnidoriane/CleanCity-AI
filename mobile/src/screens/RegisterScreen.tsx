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
import { registerCitizen } from '../api/auth'
import { useAuthStore } from '../store/authStore'

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().min(8, 'Phone number is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  cityId: z.string().uuid('Invalid city'),
})

type RegisterForm = z.infer<typeof registerSchema>

interface Props {
  onSuccess?: () => void
  onLoginPress?: () => void
  // cityId injected from city selection — hardcoded for MVP demo
  defaultCityId?: string
}

export default function RegisterScreen({ onSuccess, onLoginPress, defaultCityId = '' }: Props) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const setAuth = useAuthStore((s) => s.setAuth)

  const { control, handleSubmit, formState: { errors } } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: '', phone: '', password: '', cityId: defaultCityId },
  })

  const onSubmit = async (data: RegisterForm) => {
    setIsSubmitting(true)
    setErrorMessage(null)
    try {
      const res = await registerCitizen(data)
      await setAuth(res.token, res.user)
      onSuccess?.()
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Registration failed. Please try again.'
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
        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>Join Clean City AI</Text>

        {/* Name */}
        <View style={styles.field}>
          <Text style={styles.label}>Full Name</Text>
          <Controller
            control={control}
            name="name"
            render={({ field: { onChange, value } }) => (
              <TextInput
                style={[styles.input, errors.name && styles.inputError]}
                placeholder="Your full name"
                value={value}
                onChangeText={onChange}
                autoCapitalize="words"
                testID="input-name"
              />
            )}
          />
          {errors.name && <Text style={styles.error}>{errors.name.message}</Text>}
        </View>

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
                placeholder="At least 6 characters"
                value={value}
                onChangeText={onChange}
                secureTextEntry
                testID="input-password"
              />
            )}
          />
          {errors.password && <Text style={styles.error}>{errors.password.message}</Text>}
        </View>

        {/* API error message */}
        {errorMessage && (
          <Text style={styles.apiError} testID="error-message">{errorMessage}</Text>
        )}

        {/* Submit */}
        <TouchableOpacity
          style={[styles.button, isSubmitting && styles.buttonDisabled]}
          onPress={handleSubmit(onSubmit)}
          disabled={isSubmitting}
          testID="btn-register"
        >
          {isSubmitting
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.buttonText}>Create Account</Text>
          }
        </TouchableOpacity>

        {/* Login link */}
        <TouchableOpacity onPress={onLoginPress} style={styles.loginLink} testID="btn-go-login">
          <Text style={styles.loginText}>
            Already have an account? <Text style={styles.loginTextBold}>Sign in</Text>
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
  loginLink: { marginTop: 20, alignItems: 'center' },
  loginText: { color: '#666', fontSize: 14 },
  loginTextBold: { color: '#16a34a', fontWeight: '700' },
})
