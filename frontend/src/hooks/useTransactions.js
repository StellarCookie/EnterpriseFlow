import { useState, useEffect, useCallback } from 'react'
import api from '../api'

export function useTransactions(statusFilter = 'Toate') {
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (statusFilter && statusFilter !== 'Toate') {
        params.append('status', statusFilter)
      }
      params.append('limit', '100')
      const queryString = params.toString() ? `?${params.toString()}` : ''
      const res = await api.get(`/transactions${queryString}`)
      setTransactions(res.data.data || [])
    } catch (err) {
      setError(err.response?.data?.message || 'Eroare la încărcarea tranzacțiilor.')
    } finally {
      setLoading(false)
    }
  }, [statusFilter])

  useEffect(() => { fetch() }, [fetch])

  const approve = useCallback(async (id, managerNote = '') => {
    const res = await api.patch(`/transactions/${id}/approve`, { managerNote })
    setTransactions(prev =>
      prev.map(t => t._id === id ? { ...t, ...res.data.data } : t)
    )
    return res.data.data
  }, [])

  const reject = useCallback(async (id, managerNote = '') => {
    const res = await api.patch(`/transactions/${id}/reject`, { managerNote })
    setTransactions(prev =>
      prev.map(t => t._id === id ? { ...t, ...res.data.data } : t)
    )
    return res.data.data
  }, [])

  const create = useCallback(async (payload) => {
    const res = await api.post('/transactions', payload)
    setTransactions(prev => [res.data.data, ...prev])
    return res.data.data
  }, [])

  const update = useCallback(async (id, payload) => {
    const res = await api.patch(`/transactions/${id}`, payload)
    setTransactions(prev => prev.map(t => t._id === id ? { ...t, ...res.data.data } : t))
    return res.data.data
  }, [])

  const remove = useCallback(async (id) => {
    await api.delete(`/transactions/${id}`)
    setTransactions(prev => prev.filter(t => t._id !== id))
  }, [])

  const pendingCount = transactions.filter(t => t.status === 'În așteptare').length

  return { transactions, loading, error, refetch: fetch, approve, reject, create, update, remove, pendingCount }
}
