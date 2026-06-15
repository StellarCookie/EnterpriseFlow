import { useState, useEffect } from 'react'
import { Users, Shield, User, ToggleLeft, ToggleRight } from 'lucide-react'
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
    } catch {
      toastError('Eroare la actualizarea rolului.')
    }
  }

  const handleToggleActive = async (id, currentActive) => {
    try {
      await api.patch(`/auth/users/${id}/toggle-active`)
      setUsers(prev => prev.map(u => u._id === id ? { ...u, isActive: !u.isActive } : u))
      success(currentActive ? 'Cont dezactivat.' : 'Cont activat.')
    } catch {
      toastError('Eroare la modificarea statusului.')
    }
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'transparent' }}>
      <Sidebar pendingCount={pendingCount} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar title="Utilizatori" subtitle={`${users.length} conturi înregistrate`} showSearch={false} />

        <main className="flex-1 overflow-y-auto px-7 pb-6">
          <div className="bg-white rounded-2xl border border-[#d8edf0] overflow-hidden mt-6">
            <div className="px-5 py-4 border-b border-[#edf5f7]">
              <h3 className="text-[13.5px] font-semibold text-[#0d2b32]">Gestionare conturi</h3>
            </div>

            {loading ? (
              <div className="flex justify-center py-12">
                <div className="w-8 h-8 border-4 border-[#00c9b1] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="bg-[#f5fcfc] border-b border-[#edf5f7]">
                    {['Utilizator', 'Email', 'Rol', 'Status', 'Înregistrat', 'Acțiuni'].map(h => (
                      <th key={h} className="text-[10px] font-semibold text-[#8ab0b8] uppercase tracking-wider px-5 py-3 text-left">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u._id} className="border-b border-[#edf5f7] hover:bg-[#f9fdfd] transition-colors">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0"
                            style={{ background: 'linear-gradient(135deg,#00c9b1,#0096a0)' }}>
                            {u.firstName?.[0]}{u.lastName?.[0]}
                          </div>
                          <p className="text-[13px] font-medium text-[#0d2b32]">{u.firstName} {u.lastName}</p>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-[12px] text-[#6b9aa5]">{u.email}</td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-1.5">
                          {u.role === 'Manager'
                            ? <Shield size={12} style={{ color: '#007d72' }} />
                            : <User size={12} className="text-[#8ab0b8]" />}
                          <span className={`text-[12px] font-medium ${u.role === 'Manager' ? 'text-[#007d72]' : 'text-[#6b9aa5]'}`}>
                            {u.role}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${u.isActive !== false ? 'bg-[#e0f7f5] text-[#0f6e56]' : 'bg-[#fcebeb] text-[#a32d2d]'}`}>
                          {u.isActive !== false ? 'Activ' : 'Inactiv'}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-[12px] text-[#8ab0b8]">
                        {new Date(u.createdAt).toLocaleDateString('ro-RO')}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <select
                            value={u.role}
                            onChange={e => handleRoleChange(u._id, e.target.value)}
                            className="text-[11px] border border-[#d8edf0] rounded-lg px-2 py-1 bg-white text-[#6b9aa5] outline-none focus:border-[#00c9b1]">
                            <option value="Angajat">Angajat</option>
                            <option value="Manager">Manager</option>
                          </select>
                          <button
                            onClick={() => handleToggleActive(u._id, u.isActive !== false)}
                            className="p-1 text-[#8ab0b8] hover:text-[#007d72] transition-colors"
                            title={u.isActive !== false ? 'Dezactivează' : 'Activează'}>
                            {u.isActive !== false
                              ? <ToggleRight size={18} style={{ color: '#00c9b1' }} />
                              : <ToggleLeft size={18} />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </main>
      </div>
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  )
}
