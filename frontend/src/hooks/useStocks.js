import { useState, useEffect, useCallback } from 'react'
import api from '../api'

export function useStocks() {
  const [stocks, setStocks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.get('/stocks')
      setStocks(res.data.data || [])
    } catch (err) {
      setError(err.response?.data?.message || 'Eroare la încărcarea stocurilor.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetch() }, [fetch])

  const create = useCallback(async (payload) => {
    const res = await api.post('/stocks', payload)
    setStocks(prev => [...prev, res.data.data])
    return res.data.data
  }, [])

  const update = useCallback(async (id, payload) => {
    const res = await api.patch(`/stocks/${id}`, payload)
    setStocks(prev => prev.map(s => s._id === id ? res.data.data : s))
    return res.data.data
  }, [])

  const remove = useCallback(async (id) => {
    await api.delete(`/stocks/${id}`)
    setStocks(prev => prev.filter(s => s._id !== id))
  }, [])

  const lowStockCount = stocks.filter(s => s.status !== 'OK').length

  return { stocks, loading, error, refetch: fetch, create, update, remove, lowStockCount }
}
