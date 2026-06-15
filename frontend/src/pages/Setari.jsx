import { useState, useEffect } from 'react'
import { User, Shield, Laptop, Smartphone, AlertTriangle, Key, LogOut, RefreshCw, Save } from 'lucide-react'
import Sidebar from '../components/Sidebar'
import Navbar from '../components/Navbar'
import { ToastContainer } from '../components/Toast'
import { useToast } from '../hooks/useToast'
import { useAuth } from '../hooks/useAuth'
import api from '../api' 

export default function Setari() {
  const { user } = useAuth() 
  const { toasts, success, error: toastError, removeToast } = useToast()

  const [userTitle, setUserTitle] = useState('')
  const [loadingTitle, setLoadingTitle] = useState(false)

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [loadingPassword, setLoadingPassword] = useState(false)
  const [twoFactor, setTwoFactor] = useState(false)

  useEffect(() => {
    if (user && user.title) {
      setUserTitle(user.title)
    } else if (user) {
      setUserTitle(user.role === 'manager' ? 'Director Executiv' : 'Operator Date')
    }
  }, [user])

  const handleTitleUpdate = async (e) => {
    if (e) e.preventDefault()
    if (!userTitle.trim()) {
      toastError('Te rugăm să introduci o funcție validă.')
      return
    }

    setLoadingTitle(true)
    try {
      // Trimitem cererea parțială prin PATCH către endpoint-ul corect definit acum pe backend
      const response = await api.patch('/auth/update-title', { title: userTitle })
      if (response.data.success) {
        success('Funcția profesională a fost salvată în baza de date!')
      }
    } catch (err) {
      console.error(err)
      toastError(err.response?.data?.message || 'Eroare la salvarea funcției.')
    } finally {
      setLoadingTitle(false)
    }
  }

  const handlePasswordUpdate = async (e) => {
    e.preventDefault()
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      toastError('Te rugăm să completezi toate câmpurile pentru parolă.')
      return
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toastError('Noua parolă și confirmarea nu se potrivesc.')
      return
    }
    if (passwordForm.newPassword.length < 6) {
      toastError('Noua parolă trebuie să aibă cel puțin 6 caractere.')
      return
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
      }
    } catch (err) {
      console.error(err)
      toastError(err.response?.data?.message || 'Eroare la actualizarea parolei.')
    } finally {
      setLoadingPassword(false)
    }
  }

  const handleResetData = () => {
    if (window.confirm('Ești sigur că vrei să resetezi datele demo? Toate tranzacțiile și stocurile personalizate vor reveni la starea inițială.')) {
      success('Datele demo au fost resetate la starea inițială.')
    }
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'transparent', position: 'relative' }}>
      <div style={{ position: 'relative', zIndex: 1, flexShrink: 0 }}>
        <Sidebar />
      </div>

      <div className="flex-1 flex flex-col overflow-hidden" style={{ position: 'relative', zIndex: 1 }}>
        <Navbar title="Setări cont" showSearch={false} />
        
        <main className="flex-1 overflow-y-auto px-7 pb-6 space-y-5 bg-[#f8fcfd]">
          
          <section className="bg-white rounded-2xl border border-[#d8edf0] p-6 mt-4 shadow-sm">
            <div className="flex items-center justify-between mb-4 border-b border-[#edf5f7] pb-3">
              <div className="flex items-center gap-2">
                <User size={16} className="text-[#00a090]" />
                <h2 className="text-[14px] font-semibold text-[#0d2b32]">Profil Utilizator</h2>
              </div>
              <button
                onClick={handleTitleUpdate}
                disabled={loadingTitle}
                className="px-3 py-1.5 bg-[#00b8a4] hover:bg-[#0096a0] text-white text-[11px] font-medium rounded-xl transition-all flex items-center gap-1.5 shadow-sm disabled:opacity-50"
              >
                <Save size={12} />
                {loadingTitle ? 'Se salvează...' : 'Salvează Funcția'}
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-semibold text-[#8ab0b8] uppercase tracking-wider mb-1.5">Nume complet</label>
                <input 
                  type="text" 
                  disabled
                  value={user ? `${user.firstName} ${user.lastName}` : 'Se încarcă...'} 
                  className="w-full px-3 py-2 text-sm border border-[#d8edf0] bg-[#f5fcfc] rounded-xl text-[#5a7a85] outline-none cursor-not-allowed font-medium"
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-[#8ab0b8] uppercase tracking-wider mb-1.5">Adresă de Email</label>
                <input 
                  type="email" 
                  disabled
                  value={user?.email || 'Se încarcă...'} 
                  className="w-full px-3 py-2 text-sm border border-[#d8edf0] bg-[#f5fcfc] rounded-xl text-[#5a7a85] outline-none cursor-not-allowed font-medium"
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-[#8ab0b8] uppercase tracking-wider mb-1.5">Rol în sistem</label>
                <input 
                  type="text" 
                  disabled
                  value={user?.role ? (user.role === 'manager' ? 'Manager / Administrator' : `Angajat (${user.role})`) : 'Se încarcă...'} 
                  className="w-full px-3 py-2 text-sm border border-[#d8edf0] bg-[#f5fcfc] rounded-xl text-[#5a7a85] outline-none cursor-not-allowed font-medium"
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-[#8ab0b8] uppercase tracking-wider mb-1.5">Funcție (Title) - <span className="text-teal-500 lowercase font-normal">câmp editabil</span></label>
                <input 
                  type="text" 
                  value={userTitle}
                  onChange={e => setUserTitle(e.target.value)}
                  placeholder="Ex: Field Engineer / Contabil"
                  className="w-full px-3 py-2 text-sm border border-[#d8edf0] rounded-xl outline-none focus:border-[#00c9b1] text-[#0d2b32] font-medium"
                />
              </div>
            </div>
          </section>

          <section className="bg-white rounded-2xl border border-[#d8edf0] p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4 border-b border-[#edf5f7] pb-3">
              <Shield size={16} className="text-[#00a090]" />
              <h2 className="text-[14px] font-semibold text-[#0d2b32]">Securitate cont</h2>
            </div>
            
            <form onSubmit={handlePasswordUpdate} className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] font-semibold text-[#8ab0b8] uppercase tracking-wider mb-1.5">Parola curentă</label>
                  <input 
                    type="password" 
                    placeholder="••••••••"
                    value={passwordForm.currentPassword}
                    onChange={e => setPasswordForm(f => ({ ...f, currentPassword: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-[#d8edf0] rounded-xl outline-none focus:border-[#00c9b1] text-[#0d2b32]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-[#8ab0b8] uppercase tracking-wider mb-1.5">Noua parolă</label>
                  <input 
                    type="password" 
                    placeholder="••••••••"
                    value={passwordForm.newPassword}
                    onChange={e => setPasswordForm(f => ({ ...f, newPassword: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-[#d8edf0] rounded-xl outline-none focus:border-[#00c9b1] text-[#0d2b32]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-[#8ab0b8] uppercase tracking-wider mb-1.5">Confirmă noua parolă</label>
                  <input 
                    type="password" 
                    placeholder="••••••••"
                    value={passwordForm.confirmPassword}
                    onChange={e => setPasswordForm(f => ({ ...f, confirmPassword: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-[#d8edf0] rounded-xl outline-none focus:border-[#00c9b1] text-[#0d2b32]"
                  />
                </div>
              </div>
              
              <div className="flex justify-end pt-1">
                <button 
                  type="submit" 
                  disabled={loadingPassword}
                  className="px-4 py-2 text-white text-xs font-medium rounded-xl transition-all shadow-sm flex items-center gap-1.5 disabled:opacity-50"
                  style={{ background: 'linear-gradient(135deg,#0d2b32,#1a434d)' }}
                >
                  <Key size={13} />
                  {loadingPassword ? 'Se actualizează...' : 'Actualizează parola'}
                </button>
              </div>
            </form>

            <div className="mt-5 pt-4 border-t border-[#edf5f7] flex items-center justify-between">
              <div>
                <h4 className="text-[12.5px] font-semibold text-[#0d2b32]">Autentificare în doi pași (2FA)</h4>
                <p className="text-[11px] text-[#6b9aa5]">Solicită un cod securizat din aplicația ta de autentificare la fiecare conectare.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={twoFactor}
                  onChange={() => {
                    setTwoFactor(!twoFactor)
                    success(`Autentificarea 2FA a fost ${!twoFactor ? 'activată' : 'dezactivată'}.`)
                  }}
                  className="sr-only peer" 
                />
                <div className="w-9 h-5 bg-[#d8edf0] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#00c9b1]"></div>
              </label>
            </div>
          </section>

          <section className="bg-white rounded-2xl border border-[#d8edf0] p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4 border-b border-[#edf5f7] pb-3">
              <Laptop size={16} className="text-[#00a090]" />
              <h2 className="text-[14px] font-semibold text-[#0d2b32]">Sesiuni active</h2>
            </div>

            <div className="space-y-3.5">
              <div className="flex items-center justify-between bg-[#f5fcfc] border border-[#cce8ec] p-3 rounded-xl">
                <div className="flex items-center gap-3">
                  <Laptop className="text-[#00a090]" size={18} />
                  <div>
                    <p className="text-[12.5px] font-semibold text-[#0d2b32]">Acest dispozitiv • Chrome pe Windows / macOS</p>
                    <p className="text-[10.5px] text-[#6b9aa5]">Conectat chiar acum • Sesiunea curentă</p>
                  </div>
                </div>
                <span className="text-[10px] font-semibold bg-[#e0f7f5] text-[#0f6e56] border border-[#9fe1cb] px-2 py-0.5 rounded-full">
                  Activă
                </span>
              </div>

              <div className="flex items-center justify-between bg-white border border-[#edf5f7] p-3 rounded-xl">
                <div className="flex items-center gap-3">
                  <Smartphone className="text-[#8ab0b8]" size={18} />
                  <div>
                    <p className="text-[12.5px] font-medium text-[#0d2b32]">iPhone • Aplicația Safari</p>
                    <p className="text-[10.5px] text-[#8ab0b8]">Ultima activitate: acum 2 ore • Iași, RO</p>
                  </div>
                </div>
                <button 
                  onClick={() => success('Sesiunea de pe dispozitivul mobil a fost revocată.')}
                  className="text-[11.5px] font-medium text-[#a32d2d] hover:underline"
                >
                  Revocă accesul
                </button>
              </div>
            </div>
          </section>

          <section className="bg-[#fffafa] rounded-2xl border border-[#f7c1c1] p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4 border-b border-[#fcdede] pb-3">
              <AlertTriangle size={16} className="text-[#a32d2d]" />
              <h2 className="text-[14px] font-semibold text-[#a32d2d]">Zonă de siguranță (Danger Zone)</h2>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between bg-white border border-[#fcdede] p-4 rounded-xl">
                <div className="max-w-[75%]">
                  <h4 className="text-[12.5px] font-semibold text-[#0d2b32]">Resetează datele demo</h4>
                  <p className="text-[11px] text-[#6b9aa5]">Șterge toate tranzacțiile noi înregistrate, editările din inventar și readuce baza de date la starea inițială de seed.</p>
                </div>
                <button 
                  onClick={handleResetData}
                  className="px-3 py-2 border border-[#f7c1c1] text-[#a32d2d] hover:bg-[#fffafa] text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5"
                >
                  <RefreshCw size={13} />
                  Resetează datele
                </button>
              </div>

              <div className="flex items-center justify-between bg-white border border-[#fcdede] p-4 rounded-xl">
                <div>
                  <h4 className="text-[12.5px] font-semibold text-[#0d2b32]">Deconectare completă</h4>
                  <p className="text-[11px] text-[#6b9aa5]">Încheie sesiunea curentă în siguranță și șterge token-urile de acces de pe acest dispozitiv.</p>
                </div>
                <button 
                  className="px-3 py-2 text-white text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5 bg-[#a32d2d] hover:bg-[#b83232]"
                >
                  <LogOut size={13} />
                  Deconectare
                </button>
              </div>
            </div>
          </section>

        </main>
      </div>

      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  )
}