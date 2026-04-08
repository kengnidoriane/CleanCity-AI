import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { registerCompany, type RegisteredCompany } from '../api/companies-register'
import { useAuthStore } from '../store/authStore'

const schema = z.object({
  name: z.string().min(2, 'Company name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

export default function CompanyRegistrationPage() {
  const user = useAuthStore((s) => s.user)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [registered, setRegistered] = useState<RegisteredCompany | null>(null)

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormValues) => {
    if (!user?.cityId) return
    setIsSubmitting(true)
    setErrorMessage(null)
    try {
      const res = await registerCompany({
        name: data.name,
        email: data.email,
        phone: data.phone || undefined,
        cityId: user.cityId,
      })
      setRegistered(res.company)
      reset()
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Failed to register company. Please try again.'
      setErrorMessage(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRegisterAnother = () => {
    setRegistered(null)
    setErrorMessage(null)
  }

  return (
    <div className="h-full overflow-y-auto bg-gray-50" data-testid="company-registration-page">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <h1 className="text-base font-bold text-gray-900">Register Company</h1>
        <p className="text-xs text-gray-400 mt-0.5">
          Add a new waste collection company to your city
        </p>
      </div>

      <div className="px-6 py-6 max-w-lg">
        {/* Success state */}
        {registered ? (
          <div className="bg-white rounded-xl border border-green-200 p-6" data-testid="success-panel">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-xl">
                ✓
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">Company registered</p>
                <p className="text-xs text-gray-400">Credentials sent to their email</p>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 space-y-2 mb-4">
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Company name</span>
                <span className="font-semibold text-gray-900">{registered.name}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Email</span>
                <span className="font-semibold text-gray-900">{registered.email}</span>
              </div>
              {registered.phone && (
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Phone</span>
                  <span className="font-semibold text-gray-900">{registered.phone}</span>
                </div>
              )}
            </div>

            <p className="text-xs text-gray-400 mb-4">
              The company will receive an email with their login credentials and can access the
              company dashboard immediately.
            </p>

            <button
              onClick={handleRegisterAnother}
              data-testid="btn-register-another"
              className="w-full border border-blue-200 text-blue-600 hover:bg-blue-50 font-semibold py-2.5 px-4 rounded-lg transition-colors text-sm"
            >
              Register another company
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" data-testid="registration-form">
              {/* Company name */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                  Company name <span className="text-red-400">*</span>
                </label>
                <input
                  {...register('name')}
                  type="text"
                  placeholder="e.g. CleanCo Dakar"
                  data-testid="input-name"
                  className={`w-full px-3.5 py-2.5 rounded-lg border text-sm outline-none transition-colors
                    ${errors.name
                      ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100'
                      : 'border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100'
                    }`}
                />
                {errors.name && (
                  <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                  Email address <span className="text-red-400">*</span>
                </label>
                <input
                  {...register('email')}
                  type="email"
                  placeholder="contact@company.com"
                  data-testid="input-email"
                  className={`w-full px-3.5 py-2.5 rounded-lg border text-sm outline-none transition-colors
                    ${errors.email
                      ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100'
                      : 'border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100'
                    }`}
                />
                {errors.email && (
                  <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>
                )}
              </div>

              {/* Phone (optional) */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                  Phone number <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <input
                  {...register('phone')}
                  type="tel"
                  placeholder="+221 77 000 00 00"
                  data-testid="input-phone"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 text-sm outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              {/* API error */}
              {errorMessage && (
                <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3" role="alert">
                  <p className="text-sm text-red-600">{errorMessage}</p>
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={isSubmitting}
                data-testid="btn-submit"
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed
                  text-white font-semibold py-2.5 px-4 rounded-lg transition-colors text-sm mt-2"
              >
                {isSubmitting ? 'Registering...' : 'Register Company'}
              </button>
            </form>
          </div>
        )}

        {/* Info box */}
        {!registered && (
          <div className="mt-4 bg-blue-50 border border-blue-100 rounded-xl p-4">
            <p className="text-xs font-semibold text-blue-700 mb-2">What happens next?</p>
            <ul className="text-xs text-blue-600 space-y-1">
              <li>• A company account is created automatically</li>
              <li>• Login credentials are sent to the provided email</li>
              <li>• The company appears immediately in the active companies list</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}
