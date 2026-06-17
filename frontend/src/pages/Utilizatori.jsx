import { useState, useEffect } from 'react'
import { Shield, User, ToggleLeft, ToggleRight } from 'lucide-react'
import Sidebar from '../components/Sidebar'
import Navbar from '../components/Navbar'
import { ToastContainer } from '../components/Toast'
import { useTransactions } from '../hooks/useTransactions'
import { useToast } from '../hooks/useToast'
import api from '../api'

export default function Utilizatori() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const { pendingCount } = useTransactions()
  const { toasts, success, error: toastError, removeToast } = useToast()

  useEffect(() => {
    api.get('/auth/users')
      .then(r => setUsers(r.data.data))
      .catch(() => toastError('Eroare la încărcarea utilizatorilor.'))
      .finally(() => setLoading(false))
  }, [])

  const handleRoleChange = async (id, role) => {
    try {
      await api.patch(`/auth/users/${id}/role`, { role })
      setUsers(prev => prev.map(u => u._id === id ? { ...u, role } : u))
      success('Rolul a fost actualizat.')
    } catch { toastError('Eroare la actualizarea rolului.') }
  }

  const handleToggleActive = async (id, currentActive) => {
    try {
      await api.patch(`/auth/users/${id}/toggle-active`)
      setUsers(prev => prev.map(u => u._id === id ? { ...u, isActive: !u.isActive } : u))
      success(currentActive ? 'Cont dezactivat.' : 'Cont activat.')
    } catch { toastError('Eroare la modificarea statusului.') }
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'transparent' }}>
      <Sidebar pendingCount={pendingCount} />
      <div className="flex-1 flex flex-col overflow-hidden min-h-0">
        <Navbar title="Utilizatori" subtitle={`${users.length} conturi înregistrate`} showSearch={false} />

        <main className="flex-1 overflow-hidden flex flex-col px-7 pb-6 min-h-0">
          {/* Table card — fills height, body scrolls */}
          <div className="flex-1 bg-white/60 backdrop-blur-xl border border-[#b48bd0]/20 rounded-2xl overflow-hidden flex flex-col min-h-0">

            <div className="px-5 py-3 border-b border-[#b48bd0]/15 flex-shrink-0">
              <h3 className="text-[13px] font-semibold text-[#352a6e]">Gestionare conturi</h3>
            </div>

            {loading ? (
              <div className="flex justify-center py-12">
                <div className="w-7 h-7 border-4 border-[#5b4ad1] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <div className="flex-1 overflow-hidden flex flex-col min-h-0">
                {/* Fixed column headers */}
                <div className="flex-shrink-0 border-b border-[#b48bd0]/10">
                  <div className="grid px-5 py-2.5 bg-[#f7f1f8]/60" style={{ gridTemplateColumns: '2fr 2fr 1fr 1fr 1fr 1.5fr' }}>
                    {['Utilizator', 'Email', 'Rol', 'Status', 'Înregistrat', 'Acțiuni'].map(h => (
                      <span key={h} className="text-[10px] font-semibold text-[#b48bd0] uppercase tracking-wider">{h}</span>
                    ))}
                  </div>
                </div>
                {/* Scrollable rows */}
                <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
                  {users.map(u => (
                    <div key={u._id} className="grid px-5 py-2.5 border-b border-[#b48bd0]/10 hover:bg-[#f7f1f8]/40 transition-colors duration-150 items-center" style={{ gridTemplateColumns: '2fr 2fr 1fr 1fr 1fr 1.5fr' }}>
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-semibold flex-shrink-0 bg-gradient-to-br from-[#5b4ad1] to-[#b48bd0]">
                          {u.firstName?.[0]}{u.lastName?.[0]}
                        </div>
                        <p className="text-[12px] font-medium text-[#352a6e] truncate">{u.firstName} {u.lastName}</p>
                      </div>
                      <p className="text-[11.5px] text-[#b48bd0] truncate pr-2">{u.email}</p>
                      <div className="flex items-center gap-1">
                        {u.role === 'Manager' ? <Shield size={11} className="text-[#5b4ad1]" /> : <User size={11} className="text-[#b48bd0]" />}
                        <span className={`text-[11.5px] font-medium ${u.role === 'Manager' ? 'text-[#5b4ad1]' : 'text-[#b48bd0]'}`}>{u.role}</span>
                      </div>
                      <div>
                        <span className={`text-[10.5px] font-semibold px-2 py-0.5 rounded-full border ${u.isActive !== false ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-600 border-red-200'}`}>
                          {u.isActive !== false ? 'Activ' : 'Inactiv'}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#b48bd0]">{new Date(u.createdAt).toLocaleDateString('ro-RO')}</p>
                      <div className="flex items-center gap-2">
                        <select
                          value={u.role}
                          onChange={e => handleRoleChange(u._id, e.target.value)}
                          className="text-[11px] border border-[#b48bd0]/30 rounded-lg px-2 py-1 bg-white/60 text-[#352a6e] outline-none focus:border-[#5b4ad1]/60 transition-all duration-150">
                          <option value="Angajat">Angajat</option>
                          <option value="Manager">Manager</option>
                        </select>
                        <button
                          onClick={() => handleToggleActive(u._id, u.isActive !== false)}
                          className="text-[#b48bd0] hover:text-[#5b4ad1] transition-colors duration-150 flex-shrink-0"
                          title={u.isActive !== false ? 'Dezactivează' : 'Activează'}>
                          {u.isActive !== false
                            ? <ToggleRight size={18} className="text-[#5b4ad1]" />
                            : <ToggleLeft size={18} />}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  )
}
