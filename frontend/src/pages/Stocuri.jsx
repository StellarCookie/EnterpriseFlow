import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Plus, X, Edit2, Trash2, Package, AlertTriangle, Eye, Search } from 'lucide-react'
import Sidebar from '../components/Sidebar'
import Navbar from '../components/Navbar'
import { ToastContainer } from '../components/Toast'
import { useStocks } from '../hooks/useStocks'
import { useTransactions } from '../hooks/useTransactions'
import { useAuth } from '../hooks/useAuth'
import { useToast } from '../hooks/useToast'

const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString('ro-RO', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'

export default function Stocuri() {
  const { stocks, loading, create, update, remove, lowStockCount } = useStocks()
  const { pendingCount } = useTransactions()
  const { isManager } = useAuth()
  const { toasts, success, error: toastError, removeToast } = useToast()
  const [showForm, setShowForm] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [form, setForm] = useState({ name: '', sku: '', quantity: '', minQuantity: '2', unit: 'buc.', unitPrice: '', category: '' })
  const [searchParams, setSearchParams] = useSearchParams()
  const [search, setSearch] = useState('')
  
  // Stare locală pentru avertizarea de SKU duplicat
  const [skuError, setSkuError] = useState('')

  useEffect(() => {
    const q = searchParams.get('q')
    if (q) { setSearch(q); setSearchParams({}, { replace: true }) }
  }, [searchParams, setSearchParams])

  // Verificare duplicat în timp real bazată pe textul introdus
  useEffect(() => {
    if (!form.sku.trim()) {
      setSkuError('')
      return
    }
    const cleanFormSku = form.sku.toUpperCase().replace(/\s/g, '')
    
    const isDuplicated = stocks.some(s => 
      s.sku?.toUpperCase().replace(/\s/g, '') === cleanFormSku && 
      s._id !== editItem?._id
    )

    if (isDuplicated) {
      const match = stocks.find(s => s.sku?.toUpperCase().replace(/\s/g, '') === cleanFormSku)
      setSkuError(`Acest SKU este deja alocat produsului „${match?.name}”.`)
    } else {
      setSkuError('')
    }
  }, [form.sku, stocks, editItem])

  const filteredStocks = search.trim()
    ? stocks.filter(s => [s.name, s.sku, s.category].some(f => f?.toLowerCase().includes(search.trim().toLowerCase())))
    : stocks

  const openCreate = () => {
    setEditItem(null)
    setSkuError('')
    setForm({ name: '', sku: '', quantity: '', minQuantity: '2', unit: 'buc.', unitPrice: '', category: '' })
    setShowForm(true)
  }

  const openEdit = (item) => {
    setEditItem(item)
    setSkuError('')
    setForm({ name: item.name, sku: item.sku || '', quantity: item.quantity, minQuantity: item.minQuantity, unit: item.unit, unitPrice: item.unitPrice || '', category: item.category || '' })
    setShowForm(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (skuError) return // Protecție suplimentară la trimitere
    try {
      if (editItem) { await update(editItem._id, form); success('Produs actualizat cu succes.') }
      else { await create(form); success('Produs adăugat în nomenclator.') }
      setShowForm(false)
    } catch (err) { toastError(err.response?.data?.message || 'Eroare.') }
  }

  const handleDelete = async (id, name) => {
    if (!confirm(`Ștergi produsul "${name}"?`)) return
    try { await remove(id); success('Produs șters.') }
    catch (err) { toastError(err.response?.data?.message || 'Eroare la ștergere.') }
  }

  const inputCls = "w-full px-3 py-2 text-sm bg-white/50 border border-[#b48bd0]/30 rounded-xl outline-none focus:border-[#5b4ad1]/60 focus:bg-white/80 text-[#352a6e] placeholder-[#b48bd0]/60 transition-all duration-150"

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'transparent' }}>
      <Sidebar pendingCount={pendingCount} />
      <div className="flex-1 flex flex-col overflow-hidden min-h-0">
        <Navbar
          title="Evidență stocuri"
        />

        <main className="flex-1 overflow-hidden flex flex-col px-7 pb-6 min-h-0">
          {/* Alerts + actions row */}
          <div className="flex items-center gap-3 mb-3 flex-shrink-0 flex-wrap">
            {lowStockCount > 0 && (
              <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 text-xs text-amber-700">
                <AlertTriangle size={13} />
                <span><strong>{lowStockCount} produse</strong> cu stoc redus sau critic.</span>
              </div>
            )}
            {isManager && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs bg-[#f7f1f8] border border-[#b48bd0]/25 text-[#5b4ad1]">
                <Eye size={13} />
                Vizualizare read-only
              </div>
            )}
            <div className="ml-auto flex items-center gap-2">
              {search && (
                <div className="flex items-center gap-1.5 text-xs text-[#5b4ad1] bg-[#f7f1f8] border border-[#b48bd0]/25 rounded-lg px-2.5 py-1.5">
                  <Search size={11} />
                  „{search}"
                  <button onClick={() => setSearch('')} className="text-[#b48bd0] hover:text-[#352a6e] ml-1 transition-colors"><X size={11} /></button>
                </div>
              )}
              {!isManager && (
                <button onClick={openCreate}
                  className="flex items-center gap-1.5 px-3 py-2 bg-[#5b4ad1] hover:bg-[#6a63d4] text-white text-xs font-medium rounded-xl shadow-md shadow-[#5b4ad1]/25 transition-all duration-200">
                  <Plus size={13} /> Adaugă produs
                </button>
              )}
            </div>
          </div>

          {/* Table card */}
          <div className="flex-1 bg-white/60 backdrop-blur-xl border border-[#b48bd0]/20 rounded-2xl overflow-hidden flex flex-col min-h-0">
            <div className="px-5 py-3 border-b border-[#b48bd0]/15 flex items-center justify-between flex-shrink-0">
              <h3 className="text-[13px] font-semibold text-[#352a6e]">Nomenclator produse</h3>
              <span className="text-[11px] text-[#b48bd0]">
                {search ? `${filteredStocks.length} din ${stocks.length}` : `${stocks.length} produse`}
              </span>
            </div>

            {loading ? (
              <div className="flex justify-center py-12 flex-shrink-0">
                <div className="w-7 h-7 border-3 border-[#5b4ad1] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : stocks.length === 0 ? (
              <div className="flex flex-col items-center py-10 text-[#b48bd0] flex-shrink-0">
                <Package size={28} className="mb-2 opacity-40" />
                <p className="text-sm">Niciun produs adăugat</p>
                {!isManager && <button onClick={openCreate} className="mt-2 text-xs text-[#5b4ad1] font-medium hover:underline">+ Adaugă primul produs</button>}
              </div>
            ) : filteredStocks.length === 0 ? (
              <div className="flex flex-col items-center py-10 text-[#b48bd0] flex-shrink-0">
                <Search size={28} className="mb-2 opacity-40" />
                <p className="text-sm">Niciun produs pentru „{search}"</p>
              </div>
            ) : (
              <div className="flex-1 overflow-hidden flex flex-col min-h-0">
                <div className="flex-shrink-0 border-b border-[#b48bd0]/10">
                  <div className="grid px-5 py-2.5 bg-[#f7f1f8]/60" style={{ gridTemplateColumns: '2fr 1fr 1.2fr 1fr 1fr auto' }}>
                    {['Produs', 'SKU', 'Cantitate', 'Preț unitar', 'Actualizat la', isManager ? '' : 'Acțiuni'].map((h, i) => (
                      <span key={h} className={`text-[10px] font-semibold text-[#b48bd0] uppercase tracking-wider ${i > 0 ? 'text-center' : ''}`}>{h}</span>
                    ))}
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
                  {filteredStocks.map(s => (
                    <div key={s._id} className="grid px-5 py-2.5 border-b border-[#b48bd0]/10 hover:bg-[#f7f1f8]/40 transition-colors duration-150 items-center" style={{ gridTemplateColumns: '2fr 1fr 1.2fr 1fr 1fr auto' }}>
                      <div>
                        <p className="text-[12.5px] font-medium text-[#352a6e]">{s.name}</p>
                        {s.category && <p className="text-[10.5px] text-[#b48bd0]">{s.category}</p>}
                      </div>
                      <div className="text-center"><span className="text-[11.5px] font-mono text-[#6a63d4]">{s.sku || '—'}</span></div>
                      <div className="text-center"><span className="text-[12px] font-medium text-[#352a6e]">{s.quantity} {s.unit}</span></div>
                      <div className="text-center text-[11.5px] text-[#b48bd0]">
                        {s.unitPrice ? `${Number(s.unitPrice).toLocaleString('ro-RO')} RON` : '—'}
                      </div>
                      <div className="text-center text-[11.5px] text-[#b48bd0]">{formatDate(s.updatedAt)}</div>
                      {!isManager && (
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => openEdit(s)} className="p-1.5 text-[#b48bd0] hover:text-[#5b4ad1] hover:bg-[#f7f1f8] rounded-lg transition-all duration-150"><Edit2 size={12} /></button>
                          <button onClick={() => handleDelete(s._id, s.name)} className="p-1.5 text-[#b48bd0] hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-150"><Trash2 size={12} /></button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {showForm && !isManager && (
        <div className="fixed inset-0 bg-[#352a6e]/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white/90 backdrop-blur-xl border border-[#b48bd0]/30 rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-5 border-b border-[#b48bd0]/20 flex items-center justify-between">
              <h3 className="text-[15px] font-semibold text-[#352a6e]">{editItem ? 'Editează produs' : 'Produs nou'}</h3>
              <button onClick={() => setShowForm(false)} className="text-[#b48bd0] hover:text-[#352a6e] transition-colors"><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-3">
              <div>
                <label className="block text-[10px] font-semibold text-[#b48bd0] uppercase tracking-wider mb-1.5">Denumire produs</label>
                <input required className={inputCls} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Ex: Laptop Dell XPS 15" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                {/* Câmpul SKU cu transformare în timp real și alertă roșie sub el */}
                <div>
                  <label className="block text-[10px] font-semibold text-[#b48bd0] uppercase tracking-wider mb-1.5">SKU</label>
                  <input 
                    className={`${inputCls} ${skuError ? 'border-red-500 focus:border-red-500 bg-red-50/30' : ''}`} 
                    value={form.sku} 
                    onChange={e => setForm(f => ({ ...f, sku: e.target.value.toUpperCase().replace(/\s/g, '') }))} 
                    placeholder="Ex: DLX15" 
                  />
                  {skuError && <p className="text-red-500 text-[10.5px] mt-1 font-medium leading-tight">{skuError}</p>}
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-[#b48bd0] uppercase tracking-wider mb-1.5">Categorie</label>
                  <input className={inputCls} value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} placeholder="IT, Birou..." />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-semibold text-[#b48bd0] uppercase tracking-wider mb-1.5">Cantitate inițială</label>
                  <input required type="number" min="0" className={inputCls} value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-[#b48bd0] uppercase tracking-wider mb-1.5">Unitate</label>
                  <input className={inputCls} value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))} />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-[#b48bd0] uppercase tracking-wider mb-1.5">Preț unitar (RON)</label>
                <input type="number" step="0.01" min="0" className={inputCls} value={form.unitPrice} onChange={e => setForm(f => ({ ...f, unitPrice: e.target.value }))} placeholder="0.00" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-2.5 rounded-xl text-[13px] font-medium bg-white/60 border border-[#b48bd0]/30 text-[#b48bd0] hover:text-[#352a6e] transition-all duration-200">Anulează</button>
                {/* Butonul devine blocat (disabled) dacă există o eroare pe SKU */}
                <button 
                  type="submit" 
                  disabled={!!skuError}
                  className="flex-1 py-2.5 rounded-xl text-[13px] font-medium text-white bg-[#5b4ad1] hover:bg-[#6a63d4] shadow-md shadow-[#5b4ad1]/25 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {editItem ? 'Salvează' : 'Adaugă produs'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  )
}