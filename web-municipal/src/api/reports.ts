/**
 * Downloads the monthly PDF report by fetching with auth header
 * and triggering a browser download via a temporary anchor.
 */
export function downloadMonthlyReport(cityId: string, year: number, month: number): Promise<void> {
  const token = localStorage.getItem('auth_token') ?? ''
  const baseUrl = (import.meta.env['VITE_API_URL'] as string | undefined) ?? 'http://localhost:3000'
  const params = new URLSearchParams({
    cityId,
    year: String(year),
    month: String(month),
  })
  const url = `${baseUrl}/api/analytics/monthly-report?${params.toString()}`
  const monthLabel = String(month).padStart(2, '0')

  return fetch(url, { headers: { Authorization: `Bearer ${token}` } })
    .then((res) => {
      if (!res.ok) throw new Error(`Server returned ${res.status}`)
      return res.blob()
    })
    .then((blob) => {
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = `monthly-report-${year}-${monthLabel}.pdf`
      a.click()
      URL.revokeObjectURL(a.href)
    })
}
