import { useState, useEffect } from 'react'
import api from '../api'

export function useWorkLogs() {
  const [workLogs, setWorkLogs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/auth/worklogs/weekly')
      .then(res => setWorkLogs(res.data.data || []))
      .catch(() => setWorkLogs([]))
      .finally(() => setLoading(false))
  }, [])

  return { workLogs, loading }
}
