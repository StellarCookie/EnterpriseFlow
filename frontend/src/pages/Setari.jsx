import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { User, Shield, Laptop, Smartphone, AlertTriangle, Key, Trash2, RefreshCw, Save } from 'lucide-react'
import Sidebar from '../components/Sidebar'
import Navbar from '../components/Navbar'
import { ToastContainer } from '../components/Toast'
import { useToast } from '../hooks/useToast'
import { useAuth } from '../hooks/useAuth'
import api from '../api'

export default function Setari() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const { toasts, success, error: toastError, removeToast } = useToast()
  const [userTitle, setUserTitle] = useState('')
  const [loadingTitle, setLoadingTitle] = useState(false)
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [loadingPassword, setLoadingPassword] = useState(false)
  const [twoFactor, setTwoFactor] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState('')
  const [loadingDelete, setLoadingDelete] = useState(false)
  const [resetPending, setResetPending] = useState(false)

  useEffect(() => {
    if (user && user.title) setUserTitle(user.title)
    else if (user) setUserTitle(user.role === 'manager' ? 'Director executiv' : 'Operator date')
  }, [user])

  const handleTitleUpdate = async (e) => {
    if (e) e.preventDefault()
    if (!userTitle.trim()) { toastError('Te rugăm să introduci o funcție validă.'); return }
    setLoadingTitle(true)
    try {
      const response = await api.patch('/auth/update-title', { title: userTitle })
      if (response.data.success) success('Funcția profesională a fost salvată în baza de date.')
    } catch (err) {
      toastError(err.response?.data?.message || 'Eroare la salvarea funcției.')
    } finally {
      setLoadingTitle(false)
    }
  }

  const handlePasswordUpdate = async (e) => {
    e.preventDefault()
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      toastError('Te rugăm să completezi toate câmpurile pentru parolă.'); return
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toastError('Noua parolă și confirmarea nu se potrivesc.'); return
    }
    if (passwordForm.newPassword.length < 6) {
      toastError('Noua parolă trebuie să aibă cel puțin 6 caractere.'); return
    }
    setLoadingPassword(true)
    try {
      const response = await api.put('/auth/update-password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      })
      if (response.data.success) {
        success('Parola a fost schimbată cu succes în baza de date!')
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
         const stored = sessionStorage.getItem('ef_user')
  if (stored) {
    const parsed = JSON.parse(stored)
    parsed.mustChangePassword = false
    sessionStorage.setItem('ef_user', JSON.stringify(parsed))
    window.location.reload()
  }
      }
    } catch (err) {
      toastError(err.response?.data?.message || 'Eroare la actualizarea parolei.')
    } finally {
      setLoadingPassword(false)
    }
  }

  const handleDeleteAccount = async () => {
    setLoadingDelete(true)
    try {
      await api.delete('/auth/me')
      logout()
      navigate('/login')
    } catch (err) {
      toastError(err.response?.data?.message || 'Eroare la ștergerea contului.')
    } finally {
      setLoadingDelete(false)
    }
  }

  const handleResetData = () => {
    success('Datele demo au fost resetate la starea inițială.')
    setResetPending(false)
  }

  const inputCls = "w-full px-3 py-2 text-sm bg-white/50 border border-[#b48bd0]/30 rounded-xl outline-none focus:border-[#5b4ad1]/60 focus:bg-white/80 text-[#352a6e] placeholder-[#b48bd0]/60 transition-all duration-150"
  const inputDisabledCls = "w-full px-3 py-2 text-sm border border-[#b48bd0]/20 bg-[#f7f1f8]/60 rounded-xl text-[#b48bd0] outline-none cursor-not-allowed font-medium"

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'transparent', position: 'relative' }}>
      <div style={{ position: 'relative', zIndex: 1, flexShrink: 0 }}>
        <Sidebar />
      </div>

      <div className="flex-1 flex flex-col overflow-hidden" style={{ position: 'relative', zIndex: 1 }}>
        
        {/* MODIFICARE: Am mutat Navbar în interiorul main-ului de mai jos pentru aliniere la stânga și la dreapta cu cardurile */}
        <main className="flex-1 overflow-y-auto px-7 pb-6 space-y-5 max-w-7xl w-full mx-auto">
          
          {/* Navbar se va redimensiona acum perfect după max-w-7xl */}
          <Navbar title="Setări cont" showSearch={false} />

          {/* Profil — Eliminat mt-4 pentru că spațiul vine natural din space-y-5 */}
          <section className="bg-white/60 backdrop-blur-xl border border-[#b48bd0]/20 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4 border-b border-[#b48bd0]/15 pb-3">
              <div className="flex items-center gap-2">
                <User size={16} className="text-[#5b4ad1]" />
                <h2 className="text-[14px] font-semibold text-[#352a6e]">Profil utilizator</h2>
              </div>
              <button onClick={handleTitleUpdate} disabled={loadingTitle}
                className="px-3 py-1.5 bg-[#5b4ad1] hover:bg-[#6a63d4] text-white text-[11px] font-medium rounded-xl transition-all duration-200 flex items-center gap-1.5 shadow-sm shadow-[#5b4ad1]/25 disabled:opacity-50">
                <Save size={12} />
                {loadingTitle ? 'Se salvează...' : 'Salvează Funcția'}
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-semibold text-[#b48bd0] uppercase tracking-wider mb-1.5">Nume complet</label>
                <input type="text" disabled value={user ? `${user.firstName} ${user.lastName}` : 'Se încarcă...'} className={inputDisabledCls} />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-[#b48bd0] uppercase tracking-wider mb-1.5">Adresă de Email</label>
                <input type="email" disabled value={user?.email || 'Se încarcă...'} className={inputDisabledCls} />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-[#b48bd0] uppercase tracking-wider mb-1.5">Rol în sistem</label>
                <input type="text" disabled value={user?.role ? (user.role === 'manager' ? 'Manager / Administrator' : `${user.role}`) : 'Se încarcă...'} className={inputDisabledCls} />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-[#b48bd0] uppercase tracking-wider mb-1.5">
                  Funcție <span className="text-[#5b4ad1] lowercase font-normal">(câmp editabil)</span>
                </label>
                <input type="text" value={userTitle} onChange={e => setUserTitle(e.target.value)} placeholder="Ex: Field Engineer / Contabil" className={inputCls} />
              </div>
            </div>
          </section>

          {/* Securitate */}
          <section className="bg-white/60 backdrop-blur-xl border border-[#b48bd0]/20 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4 border-b border-[#b48bd0]/15 pb-3">
              <Shield size={16} className="text-[#5b4ad1]" />
              <h2 className="text-[14px] font-semibold text-[#352a6e]">Securitate cont</h2>
            </div>
            <form onSubmit={handlePasswordUpdate} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] font-semibold text-[#b48bd0] uppercase tracking-wider mb-1.5">Parola curentă</label>
                  <input type="password" placeholder="••••••••" value={passwordForm.currentPassword}
                    onChange={e => setPasswordForm(f => ({ ...f, currentPassword: e.target.value }))} className={inputCls} />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-[#b48bd0] uppercase tracking-wider mb-1.5">Noua parolă</label>
                  <input type="password" placeholder="••••••••" value={passwordForm.newPassword}
                    onChange={e => setPasswordForm(f => ({ ...f, newPassword: e.target.value }))} className={inputCls} />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-[#b48bd0] uppercase tracking-wider mb-1.5">Confirmă noua parolă</label>
                  <input type="password" placeholder="••••••••" value={passwordForm.confirmPassword}
                    onChange={e => setPasswordForm(f => ({ ...f, confirmPassword: e.target.value }))} className={inputCls} />
                </div>
              </div>
              <div className="flex justify-end pt-1">
                <button type="submit" disabled={loadingPassword}
                  className="px-4 py-2 text-white text-xs font-medium rounded-xl transition-all shadow-sm flex items-center gap-1.5 disabled:opacity-50 bg-[#5b4ad1] hover:bg-[#6a63d4] shadow-[#5b4ad1]/25">
                  <Key size={13} />
                  {loadingPassword ? 'Se actualizează...' : 'Actualizează parola'}
                </button>
              </div>
            </form>

            <div className="mt-5 pt-4 border-t border-[#b48bd0]/15 flex items-center justify-between">
              <div>
                <h4 className="text-[12.5px] font-semibold text-[#352a6e]">Autentificare în doi pași (2FA)</h4>
                <p className="text-[11px] text-[#b48bd0]">Solicită un cod securizat din aplicația ta de autentificare la fiecare conectare.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={twoFactor}
                  onChange={() => { setTwoFactor(!twoFactor); success(`Autentificarea 2FA a fost ${!twoFactor ? 'activată' : 'dezactivată'}.`) }}
                  className="sr-only peer" />
                <div className="w-9 h-5 bg-[#b48bd0]/30 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#5b4ad1]"></div>
              </label>
            </div>
          </section>

          {/* Sesiuni */}
          <section className="bg-white/60 backdrop-blur-xl border border-[#b48bd0]/20 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4 border-b border-[#b48bd0]/15 pb-3">
              <Laptop size={16} className="text-[#5b4ad1]" />
              <h2 className="text-[14px] font-semibold text-[#352a6e]">Sesiuni active</h2>
            </div>
            <div className="space-y-3.5">
              <div className="flex items-center justify-between bg-[#f7f1f8]/60 border border-[#b48bd0]/20 p-3 rounded-xl">
                <div className="flex items-center gap-3">
                  <Laptop className="text-[#5b4ad1]" size={18} />
                  <div>
                    <p className="text-[12.5px] font-semibold text-[#352a6e]">Acest dispozitiv • Chrome pe Windows / macOS</p>
                    <p className="text-[10.5px] text-[#b48bd0]">Conectat chiar acum • Sesiunea curentă</p>
                  </div>
                </div>
                <span className="text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full">Activă</span>
              </div>
              <div className="flex items-center justify-between bg-white/40 border border-[#b48bd0]/15 p-3 rounded-xl">
                <div className="flex items-center gap-3">
                  <Smartphone className="text-[#b48bd0]" size={18} />
                  <div>
                    <p className="text-[12.5px] font-medium text-[#352a6e]">iPhone • Aplicația Safari</p>
                    <p className="text-[10.5px] text-[#b48bd0]">Ultima activitate: acum 2 ore • Iași, RO</p>
                  </div>
                </div>
                <button onClick={() => success('Sesiunea de pe dispozitivul mobil a fost revocată.')}
                  className="text-[11.5px] font-medium text-red-500 hover:underline transition-colors">
                  Revocă accesul
                </button>
              </div>
            </div>
          </section>

          {/* Danger zone */}
          <section className="bg-red-50/60 backdrop-blur-xl rounded-2xl border border-red-200/60 p-6">
            <div className="flex items-center gap-2 mb-4 border-b border-red-200/40 pb-3">
              <AlertTriangle size={16} className="text-red-500" />
              <h2 className="text-[14px] font-semibold text-red-600">Zona de siguranță</h2>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between bg-white/60 border border-red-200/50 p-4 rounded-xl">
                <div className="max-w-[60%]">
                  <h4 className="text-[12.5px] font-semibold text-[#352a6e]">Resetează datele demo</h4>
                  <p className="text-[11px] text-[#b48bd0]">Șterge toate tranzacțiile noi înregistrate, editările din inventar și readuce baza de date la starea inițială.</p>
                </div>
                {!resetPending ? (
                  <button onClick={() => setResetPending(true)}
                    className="px-3 py-2 border border-red-200 text-red-500 hover:bg-red-50 text-xs font-semibold rounded-xl transition-all duration-200 flex items-center gap-1.5">
                    <RefreshCw size={13} /> Resetează datele
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-[11.5px] font-semibold text-red-500">Ești sigur?</span>
                    <button onClick={handleResetData} className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-xs font-semibold rounded-xl transition-all duration-200">Da, resetează</button>
                    <button onClick={() => setResetPending(false)} className="px-3 py-1.5 border border-[#b48bd0]/30 text-[#b48bd0] hover:bg-white text-xs font-semibold rounded-xl transition-all duration-200">Anulează</button>
                  </div>
                )}
              </div>

              <div className="bg-white/60 border border-red-200/50 p-4 rounded-xl space-y-3">
                <div>
                  <h4 className="text-[12.5px] font-semibold text-red-600">Ștergere cont</h4>
                  <p className="text-[11px] text-[#b48bd0]">Această acțiune este permanentă și ireversibilă. Contul tău va fi șters definitiv din sistem.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                  <div className="md:col-span-2">
                    <label className="block text-[10px] font-semibold text-[#b48bd0] uppercase tracking-wider mb-1.5">
                      Scrie <span className="text-red-500 font-bold">{user ? `${user.firstName} ${user.lastName}` : '—'}</span> pentru a confirma
                    </label>
                    <input type="text" value={deleteConfirm} onChange={e => setDeleteConfirm(e.target.value)}
                      placeholder="Numele tău complet..."
                      className="w-full px-3 py-2 text-sm border border-red-200/60 rounded-xl outline-none focus:border-red-400 text-[#352a6e] bg-white/60 transition-all duration-150" />
                  </div>
                  <div className="flex justify-end">
                    <button onClick={handleDeleteAccount}
                      disabled={loadingDelete || deleteConfirm !== `${user?.firstName} ${user?.lastName}`}
                      className="w-full px-3 py-2 text-white text-xs font-semibold rounded-xl transition-all duration-200 flex items-center justify-center gap-1.5 bg-red-500 hover:bg-red-600 disabled:opacity-40 disabled:cursor-not-allowed h-[38px]">
                      <Trash2 size={13} />
                      {loadingDelete ? 'Se șterge...' : 'Șterge contul'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </main>
      </div>

      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  )
}