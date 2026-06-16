import { useState, useEffect, useCallback } from 'react'
import api from '../api'

const EMPTY_STATS = {
  balance: 0,
  monthlyIncome: 0,
  monthlyExpenses: 0,
  netProfit: 0,
  pendingCount: 0,
  categoryBreakdown: [],
  monthlyBreakdown: [],
  quarterlyBreakdown: [],
  yearlyBreakdown: [],
}

export function useDashboard() {
  const [stats, setStats] = useState(EMPTY_STATS)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.get('/transactions/stats/dashboard')
      setStats(res.data.data || EMPTY_STATS)
    } catch (err) {
      setError(err.response?.data?.message || 'Eroare la încărcarea statisticilor.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetch() }, [fetch])

  const downloadReport = useCallback(async (month, year) => {
    const m = month ?? new Date().getMonth() + 1
    const y = year ?? new Date().getFullYear()
    const res = await api.get(
      `/transactions/report/monthly?month=${m}&year=${y}`,
      { responseType: 'blob' }
    )
    const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }))
    const a = document.createElement('a')
    a.href = url
    a.download = `raport_${m}_${y}.pdf`
    a.click()
    URL.revokeObjectURL(url)
  }, [])

  return { stats, loading, error, refetch: fetch, downloadReport }
}
