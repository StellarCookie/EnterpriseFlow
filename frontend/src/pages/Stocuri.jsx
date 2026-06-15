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

  useEffect(() => {
    const q = searchParams.get('q')
    if (q) {
      setSearch(q)
      setSearchParams({}, { replace: true })
    }
  }, [searchParams, setSearchParams])

  const filteredStocks = search.trim()
    ? stocks.filter(s => [s.name, s.sku, s.category].some(f => f?.toLowerCase().includes(search.trim().toLowerCase())))
    : stocks

  const openCreate = () => { setEditItem(null); setForm({ name: '', sku: '', quantity: '', minQuantity: '2', unit: 'buc.', unitPrice: '', category: '' }); setShowForm(true) }
  const openEdit = (item) => {
    setEditItem(item)
    setForm({ name: item.name, sku: item.sku || '', quantity: item.quantity, minQuantity: item.minQuantity, unit: item.unit, unitPrice: item.unitPrice || '', category: item.category || '' })
    setShowForm(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editItem) {
        await update(editItem._id, form)
        success('Produs actualizat cu succes.')
      } else {
        await create(form)
        success('Produs adăugat în nomenclator.')
      }
      setShowForm(false)
    } catch (err) {
      toastError(err.response?.data?.message || 'Eroare.')
    }
  }

  const handleDelete = async (id, name) => {
    if (!confirm(`Ștergi produsul "${name}"?`)) return
    try {
      await remove(id)
      success('Produs șters.')
    } catch (err) {
      toastError(err.response?.data?.message || 'Eroare la ștergere.')
    }
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'transparent' }}>
      <Sidebar pendingCount={pendingCount} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar
          title="Evidență stocuri"
          subtitle={`${stocks.length} produse înregistrate${isManager ? ' — vizualizare' : ' — gestiune completă'}`}
        />

        <main className="flex-1 overflow-y-auto px-7 pb-6">
          {/* Low stock alert */}
          {lowStockCount > 0 && (
            <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-5 text-sm text-amber-700 mt-4">
              <AlertTriangle size={15} />
              <span><strong>{lowStockCount} produse</strong> cu stoc redus sau critic necesită reaprovizionare.</span>
            </div>
          )}

          {/* Role info banner */}
          {isManager && (
            <div className="flex items-center gap-3 mb-5 px-4 py-3 rounded-xl text-sm mt-4"
              style={{ background: 'rgba(0,201,177,.06)', border: '1px solid rgba(0,201,177,.2)', color: '#007d72' }}>
              <Eye size={15} />
              Vizualizare în mod citire. Angajații gestionează direct inventarul — dvs. monitorizați situația.
            </div>
          )}

          {/* Add button - ANGAJAT only */}
          {!isManager && (
            <div className="flex justify-end mb-4 mt-4">
              <button onClick={openCreate}
                className="flex items-center gap-2 px-4 py-2 text-white text-[12.5px] font-medium rounded-lg"
                style={{ background: 'linear-gradient(135deg,#00b8a4,#0096a0)' }}>
                <Plus size={14} /> Adaugă produs
              </button>
            </div>
          )}

          <div className="bg-white rounded-2xl border border-[#d8edf0] overflow-hidden mt-4">
            <div className="px-5 py-4 border-b border-[#edf5f7] flex items-center justify-between gap-4">
              <h3 className="text-[13.5px] font-semibold text-[#0d2b32] flex-shrink-0">Nomenclator produse</h3>
              <span className="text-[11px] text-[#8ab0b8] flex-shrink-0">
                {search ? `${filteredStocks.length} din ${stocks.length} produse` : `${stocks.length} produse total`}
              </span>
            </div>

            {search && (
              <div className="flex items-center gap-2 px-5 py-2.5 border-b border-[#edf5f7] text-[12px] text-[#6b9aa5]" style={{ background: '#f5fcfc' }}>
                <Search size={12} />
                Filtrat după „{search}”
                <button onClick={() => setSearch('')} className="ml-auto text-[#8ab0b8] hover:text-[#0d2b32] flex items-center gap-1">
                  <X size={12} /> Șterge filtrul
                </button>
              </div>
            )}

            {loading ? (
              <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-[#00c9b1] border-t-transparent rounded-full animate-spin" /></div>
            ) : stocks.length === 0 ? (
              <div className="flex flex-col items-center py-12 text-[#8ab0b8]">
                <Package size={32} className="mb-3 opacity-40" />
                <p className="text-sm">Niciun produs adăugat</p>
                {!isManager && <button onClick={openCreate} className="mt-3 text-[12px] text-[#00a090] font-medium">+ Adaugă primul produs</button>}
              </div>
            ) : filteredStocks.length === 0 ? (
              <div className="flex flex-col items-center py-12 text-[#8ab0b8]">
                <Search size={32} className="mb-3 opacity-40" />
                <p className="text-sm">Niciun produs nu corespunde căutării „{search}”</p>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="bg-[#f5fcfc] border-b border-[#edf5f7]">
                    {['Produs', 'SKU', 'Cantitate curentă', 'Preț unitar', 'Actualizat la', isManager ? '' : 'Acțiuni'].map((h, i) => (
                      <th key={h} className={`text-[10px] font-semibold text-[#8ab0b8] uppercase tracking-wider px-5 py-3 ${i === 0 ? 'text-left' : 'text-center'}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredStocks.map(s => (
                    <tr key={s._id} className="border-b border-[#edf5f7] hover:bg-[#f9fdfd] transition-colors">
                      <td className="px-5 py-3">
                        <p className="text-[13px] font-medium text-[#0d2b32]">{s.name}</p>
                        {s.category && <p className="text-[11px] text-[#8ab0b8]">{s.category}</p>}
                      </td>
                      <td className="px-5 py-3 text-center"><span className="text-[12px] font-mono text-[#6b9aa5]">{s.sku || '—'}</span></td>
                      <td className="px-5 py-3 text-center">
                        <span className="text-[13px] font-medium text-[#0d2b32]">{s.quantity} {s.unit}</span>
                      </td>
                      <td className="px-5 py-3 text-center text-[12px] text-[#6b9aa5]">
                        {s.unitPrice ? `${Number(s.unitPrice).toLocaleString('ro-RO')} RON` : '—'}
                      </td>
                      <td className="px-5 py-3 text-center text-[12px] text-[#6b9aa5]">{formatDate(s.createdAt)}</td>
                      {!isManager && (
                        <td className="px-5 py-3">
                          <div className="flex items-center justify-center gap-1">
                            <button onClick={() => openEdit(s)} className="p-1.5 text-[#8ab0b8] hover:text-[#00a090] hover:bg-[#e0f7f5] rounded-lg transition-colors"><Edit2 size={13} /></button>
                            <button onClick={() => handleDelete(s._id, s.name)} className="p-1.5 text-[#8ab0b8] hover:text-[#a32d2d] hover:bg-[#fcebeb] rounded-lg transition-colors"><Trash2 size={13} /></button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </main>
      </div>

      {/* Modal - ANGAJAT only */}
      {showForm && !isManager && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-5 border-b border-[#d8edf0] flex items-center justify-between">
              <h3 className="text-[15px] font-semibold text-[#0d2b32]">{editItem ? 'Editează produs' : 'Produs nou'}</h3>
              <button onClick={() => setShowForm(false)} className="text-[#8ab0b8] hover:text-[#0d2b32]"><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-3">
              <div>
                <label className="block text-[10px] font-semibold text-[#8ab0b8] uppercase tracking-wider mb-1.5">Denumire produs</label>
                <input required className="w-full px-3 py-2 text-sm border border-[#d8edf0] rounded-xl outline-none focus:border-[#00c9b1] text-[#0d2b32]"
                  value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Ex: Laptop Dell XPS 15" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-semibold text-[#8ab0b8] uppercase tracking-wider mb-1.5">SKU</label>
                  <input className="w-full px-3 py-2 text-sm border border-[#d8edf0] rounded-xl outline-none focus:border-[#00c9b1] text-[#0d2b32]"
                    value={form.sku} onChange={e => setForm(f => ({ ...f, sku: e.target.value }))} placeholder="Ex: DLX15" />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-[#8ab0b8] uppercase tracking-wider mb-1.5">Categorie</label>
                  <input className="w-full px-3 py-2 text-sm border border-[#d8edf0] rounded-xl outline-none focus:border-[#00c9b1] text-[#0d2b32]"
                    value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} placeholder="IT, Birou..." />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-semibold text-[#8ab0b8] uppercase tracking-wider mb-1.5">Cantitate</label>
                  <input required type="number" min="0" className="w-full px-3 py-2 text-sm border border-[#d8edf0] rounded-xl outline-none focus:border-[#00c9b1] text-[#0d2b32]"
                    value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-[#8ab0b8] uppercase tracking-wider mb-1.5">Unitate</label>
                  <input className="w-full px-3 py-2 text-sm border border-[#d8edf0] rounded-xl outline-none focus:border-[#00c9b1] text-[#0d2b32]"
                    value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))} />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-[#8ab0b8] uppercase tracking-wider mb-1.5">Preț unitar (RON)</label>
                <input type="number" step="0.01" min="0" className="w-full px-3 py-2 text-sm border border-[#d8edf0] rounded-xl outline-none focus:border-[#00c9b1] text-[#0d2b32]"
                  value={form.unitPrice} onChange={e => setForm(f => ({ ...f, unitPrice: e.target.value }))} placeholder="0.00" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-2.5 rounded-xl text-[13px] font-medium bg-white border border-[#d8edf0] text-[#6b9aa5]">Anulează</button>
                <button type="submit" className="flex-1 py-2.5 rounded-xl text-[13px] font-medium text-white" style={{ background: 'linear-gradient(135deg,#00b8a4,#0096a0)' }}>
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
