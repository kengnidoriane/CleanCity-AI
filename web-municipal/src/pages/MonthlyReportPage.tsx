import { useState } from 'react'
import { downloadMonthlyReport } from '../api/reports'
import { useAuthStore } from '../store/authStore'

const MONTHS = [
  { value: 1, label: 'January' },
  { value: 2, label: 'February' },
  { value: 3, label: 'March' },
  { value: 4, label: 'April' },
  { value: 5, label: 'May' },
  { value: 6, label: 'June' },
  { value: 7, label: 'July' },
  { value: 8, label: 'August' },
  { value: 9, label: 'September' },
  { value: 10, label: 'October' },
  { value: 11, label: 'November' },
  { value: 12, label: 'December' },
]

const CURRENT_YEAR = new Date().getFullYear()
// Allow selecting up to 3 years back
const YEAR_OPTIONS = [CURRENT_YEAR, CURRENT_YEAR - 1, CURRENT_YEAR - 2]

export default function MonthlyReportPage() {
  const user = useAuthStore((s) => s.user)
  const [year, setYear] = useState(CURRENT_YEAR)
  const [month, setMonth] = useState(new Date().getMonth() + 1) // current month
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastGenerated, setLastGenerated] = useState<string | null>(null)

  const selectedMonthLabel = MONTHS.find((m) => m.value === month)?.label ?? ''

  const handleGenerate = async () => {
    if (!user?.cityId) return
    setIsGenerating(true)
    setError(null)
    try {
      await downloadMonthlyReport(user.cityId, year, month)
      setLastGenerated(`${selectedMonthLabel} ${year}`)
    } catch {
      setError('Failed to generate the report. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="h-full overflow-y-auto bg-gray-50" data-testid="monthly-report-page">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <h1 className="text-base font-bold text-gray-900">Monthly Report</h1>
        <p className="text-xs text-gray-400 mt-0.5">
          Generate and download the city activity report as PDF
        </p>
      </div>

      <div className="px-6 py-6 max-w-lg">
        {/* Report config card */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
          <div>
            <p className="text-sm font-semibold text-gray-800 mb-1">Select period</p>
            <p className="text-xs text-gray-400">
              The report will include all activity for the selected month.
            </p>
          </div>

          {/* Year selector */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Year</label>
            <select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              data-testid="select-year"
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200"
            >
              {YEAR_OPTIONS.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          {/* Month selector */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Month</label>
            <select
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              data-testid="select-month"
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200"
            >
              {MONTHS.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3" role="alert">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Success feedback */}
          {lastGenerated && !error && (
            <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3">
              <p className="text-sm text-green-700">
                ✓ Report for {lastGenerated} downloaded successfully.
              </p>
            </div>
          )}

          {/* Generate button */}
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            data-testid="btn-generate-report"
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed
              text-white font-semibold py-2.5 px-4 rounded-lg transition-colors text-sm flex items-center justify-center gap-2"
          >
            {isGenerating ? (
              <>
                <span className="animate-spin text-base">⏳</span>
                Generating...
              </>
            ) : (
              <>
                <span>📄</span>
                Generate PDF — {selectedMonthLabel} {year}
              </>
            )}
          </button>
        </div>

        {/* Info box */}
        <div className="mt-4 bg-blue-50 border border-blue-100 rounded-xl p-4">
          <p className="text-xs font-semibold text-blue-700 mb-2">Report contents</p>
          <ul className="text-xs text-blue-600 space-y-1">
            <li>• Total reports submitted and collected</li>
            <li>• Overall collection rate</li>
            <li>• Top 5 problem zones</li>
            <li>• Performance breakdown by company</li>
            <li>• Comparison with previous month</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
