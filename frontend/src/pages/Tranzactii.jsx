import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Plus, Check, X, Clock, MessageSquare, Package, Camera } from 'lucide-react'
import Sidebar from '../components/Sidebar'
import { ToastContainer } from '../components/Toast'
import { useTransactions } from '../hooks/useTransactions'
import { useStocks } from '../hooks/useStocks'
import { useAuth } from '../hooks/useAuth'
import { useToast } from '../hooks/useToast'
import api from '../api' // Importăm instanța ta globală de axios pentru apelul către OCR

const formatRON = (n) =>
  new Intl.NumberFormat('ro-RO', { minimumFractionDigits: 2 }).format(n || 0) + ' RON'

const formatDate = (d) => {
  if (!d) return '-'
  return new Date(d).toLocaleDateString('ro-RO', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

const StatusBadge = ({ status }) => {
  if (status === 'Aprobat') return <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1 rounded-full bg-[#e0f7f5] text-[#0f6e56] border border-[#9fe1cb]"><Check size={9} />{status}</span>
  if (status === 'Respins') return <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1 rounded-full bg-[#fcebeb] text-[#a32d2d] border border-[#f7c1c1]"><X size={9} />{status}</span>
  return <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1 rounded-full bg-[#faeeda] text-[#854f0b] border border-[#f5c775]"><Clock size={9} />În așteptare</span>
}

const ApprovalStep = ({ label, sublabel, state }) => {
  const dotClass = state === 'done' ? 'bg-[#e0f7f5] border border-[#9fe1cb]' : state === 'active' ? 'bg-[#faeeda] border border-[#f5c775]' : 'bg-[#f5fcfc] border border-[#d8edf0]'
  const Icon = state === 'done' ? Check : state === 'active' ? Clock : Package
  const iconColor = state === 'done' ? '#0f6e56' : state === 'active' ? '#854f0b' : '#8ab0b8'
  return (
    <div className="flex gap-3 pb-4">
      <div className="flex flex-col items-center">
        <div className={`w-7 h-7 rounded-full flex items-center justify-center ${dotClass}`}>
          <Icon size={13} style={{ color: iconColor }} />
        </div>
        <div className="w-px flex-1 bg-[#d8edf0] mt-1" />
      </div>
      <div className="pt-1 pb-2">
        <p className={`text-[12.5px] font-medium ${state === 'wait' ? 'text-[#8ab0b8]' : 'text-[#0d2b32]'}`}>{label}</p>
        <p className={`text-[11px] ${state === 'active' ? 'text-[#854f0b]' : 'text-[#8ab0b8]'}`}>{sublabel}</p>
      </div>
    </div>
  )
}

const DOCUMENT_TYPES = ['Factură', 'Chitanță', 'Bon fiscal']
const CATEGORIES = ['Furnizori', 'Salarii', 'Operațional', 'Stoc produse']
const PAYMENT_METHODS = ['Transfer bancar', 'Numerar', 'Card']

const resetForm = {
  type: 'Cheltuială', documentType: 'Factură', supplier: '',
  cui: '',
  category: 'Furnizori', netAmount: '', tva: '19', // Modificat la 19 standard pentru o aliniere mai ușoară cu OCR-ul românesc
  totalAmount: '', dueDate: '', paymentMethod: 'Transfer bancar',
  notes: '', stockItem: '', stockQuantityDelta: '', documentNumber: '',
  bankAccount: '',
  issueDate: '',
  paymentStatus: 'Neplătit'
}

const resetCustom = { documentType: '', category: '', paymentMethod: '' }

export default function Tranzactii() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [filter, setFilter] = useState('Toate')
  const [selected, setSelected] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [rejectNote, setRejectNote] = useState('')
  const [showRejectInput, setShowRejectInput] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [loadingScan, setLoadingScan] = useState(false) // Stare nouă pentru procesul de scanare OCR
  const [form, setForm] = useState(resetForm)
  const [customFields, setCustomFields] = useState(resetCustom)

  const { transactions, loading, pendingCount, approve, reject, create, refetch } = useTransactions(filter === 'Toate' ? null : filter)
  const { stocks } = useStocks()
  const { isManager, user } = useAuth()
  const { toasts, success, error: toastError, removeToast } = useToast()

  useEffect(() => {
    const q = searchParams.get('q')
    if (!q || transactions.length === 0) return
    const match = transactions.find(t => t.reference === q)
      || transactions.find(t => t.supplier?.toLowerCase().includes(q.toLowerCase()))
    if (match) setSelected(match)
    setSearchParams({}, { replace: true })
  }, [searchParams, transactions, setSearchParams])

  const handleNetChange = (val) => {
    const net = parseFloat(val) || 0
    const tvaRate = parseFloat(form.tva) || 0
    const total = net + (net * tvaRate / 100)
    setForm(f => ({ ...f, netAmount: val, totalAmount: total.toFixed(2) }))
  }

  const closeForm = () => {
    setShowForm(false)
    setForm(resetForm)
    setCustomFields(resetCustom)
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    setActionLoading(true)
    try {
      const newTxn = await create(form)
      success('Tranzacție înregistrată și trimisă spre aprobare.')
      closeForm()
      setSelected(newTxn)
    } catch (err) {
      toastError(err.response?.data?.message || 'Eroare la înregistrare.')
    } finally {
      setActionLoading(false)
    }
  }

  const handleApprove = async () => {
    if (!selected) return
    setActionLoading(true)
    try {
      const updated = await approve(selected._id)
      setSelected(updated)
      success('Tranzacție aprobată. Stocul a fost actualizat automat.')
    } catch (err) {
      toastError(err.response?.data?.message || 'Eroare la aprobare.')
    } finally {
      setActionLoading(false)
    }
  }

  const handleReject = async () => {
    if (!selected) return
    setActionLoading(true)
    try {
      const updated = await reject(selected._id, rejectNote)
      setSelected(updated)
      setShowRejectInput(false)
      setRejectNote('')
      success('Tranzacție respinsă.')
    } catch (err) {
      toastError(err.response?.data?.message || 'Eroare la respingere.')
    } finally {
      setActionLoading(false)
    }
  }

  // Funcția nouă care trimite documentul încărcat către endpoint-ul OCR de backend
  const handleInvoiceScan = async (e) => {
  const file = e.target.files[0]
  if (!file) return

  const uploadData = new FormData()
  uploadData.append('invoice', file)

  setLoadingScan(true)
  success('Se analizează structura documentului. Te rugăm să aștepți...')

  try {
    const response = await api.post('/ocr/scan', uploadData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })

    if (response.data.success) {
      const extracted = response.data.data

      setForm(f => ({
        ...f,
        cui: extracted.cui || f.cui,
        supplier: extracted.supplier || f.supplier,
        documentNumber: extracted.documentNumber || f.documentNumber,
        bankAccount: extracted.bankAccount || f.bankAccount,
        issueDate: extracted.issueDate || f.issueDate,
        netAmount: extracted.netAmount || f.netAmount,
        tva: extracted.tva || f.tva,
        totalAmount: extracted.totalAmount || f.totalAmount,
      }))

      success('Document scanat cu succes! Câmpurile financiare au fost completate.')
    }
  } catch (err) {
    console.error(err)
    toastError('Nu s-au putut extrage datele automat.')
  } finally {
    setLoadingScan(false)
    e.target.value = null
  }
}
  // helpers pentru câmpurile cu "Altele"
  const isCustomDocType = !DOCUMENT_TYPES.includes(form.documentType)
  const isCustomCategory = !CATEGORIES.includes(form.category)
  const isCustomPayment = !PAYMENT_METHODS.includes(form.paymentMethod)

  const handleSelectChange = (field, value, standardList) => {
    if (value === 'Altele') {
      setForm(f => ({ ...f, [field]: customFields[field] || '' }))
    } else {
      setForm(f => ({ ...f, [field]: value }))
      setCustomFields(f => ({ ...f, [field]: '' }))
    }
  }

  const handleCustomChange = (field, value) => {
    setCustomFields(f => ({ ...f, [field]: value }))
    setForm(f => ({ ...f, [field]: value }))
  }

  const approvalSteps = selected ? [
    {
      label: 'Document înregistrat în sistem',
      sublabel: `${selected.createdBy?.firstName || ''} ${selected.createdBy?.lastName || ''} · ${formatDate(selected.createdAt)}`,
      state: 'done'
    },
    { label: 'Validare automată date & CUI', sublabel: 'Sistem · Sumă și CUI verificate', state: 'done' },
    {
      label: 'Aprobare manager',
      sublabel: selected.status === 'Aprobat'
        ? `${selected.approvedBy?.firstName || ''} ${selected.approvedBy?.lastName || ''} · ${formatDate(selected.approvedAt)}`
        : selected.status === 'Respins'
          ? `Respins · ${selected.rejectionReason || 'fără motiv'}`
          : `${user?.firstName} ${user?.lastName} · În așteptare decizie`,
      state: selected.status === 'Aprobat' ? 'done' : selected.status === 'Respins' ? 'done' : 'active'
    },
    {
      label: 'Actualizare automată stoc',
      sublabel: 'Sistem · Declanșat automat după aprobare',
      state: selected.status === 'Aprobat' && selected.category === 'Stoc produse' ? 'done' : 'wait'
    },
  ] : []

  const filterLabels = ['Toate', 'În așteptare', 'Aprobat', 'Respins']

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'transparent' }}>
      <Sidebar pendingCount={pendingCount} />
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <div className="flex items-center justify-between px-7 py-5 bg-white border-b border-[#d8edf0] flex-shrink-0">
          <div>
            <h1 className="text-[18px] font-semibold text-[#0d2b32]" style={{ letterSpacing: '-.3px' }}>Gestiune tranzacții</h1>
            <p className="text-[12px] text-[#6b9aa5] mt-0.5 font-light">
              {pendingCount > 0 ? `${pendingCount} documente necesită aprobarea dvs.` : 'Toate tranzacțiile sunt procesate'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex gap-1.5 bg-[#f0f8fa] border border-[#c5e0e6] rounded-lg p-1">
              {filterLabels.map(f => (
                <button key={f} onClick={() => setFilter(f)}
                  className={`text-[12px] px-3 py-1.5 rounded-md font-medium transition-all ${filter === f ? 'text-white' : f === 'În așteptare' && pendingCount > 0 ? 'bg-[#faeeda] text-[#854f0b]' : 'text-[#6b9aa5]'}`}
                  style={filter === f ? { background: 'linear-gradient(135deg,#00b8a4,#0096a0)' } : {}}>
                  {f}{f === 'În așteptare' && pendingCount > 0 ? ` (${pendingCount})` : ''}
                </button>
              ))}
            </div>
            {!isManager && (
              <button onClick={() => setShowForm(true)}
                className="flex items-center gap-2 px-4 py-2 text-white text-[12.5px] font-medium rounded-lg"
                style={{ background: 'linear-gradient(135deg,#00b8a4,#0096a0)' }}>
                <Plus size={14} /> Tranzacție nouă
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden px-7 py-5 gap-4">
          {/* List */}
          <div className="w-72 flex flex-col gap-2 overflow-y-auto flex-shrink-0">
            {loading && <div className="text-center py-8 text-[#8ab0b8] text-sm">Se încarcă...</div>}
            {!loading && transactions.length === 0 && <div className="text-center py-8 text-[#8ab0b8] text-sm">Nicio tranzacție</div>}
            {transactions.map(txn => {
              const isIn = txn.type === 'Venit'
              const isSel = selected?._id === txn._id
              return (
                <div key={txn._id} onClick={() => setSelected(txn)}
                  className="bg-white border rounded-xl p-3.5 cursor-pointer transition-all relative overflow-hidden"
                  style={{ borderColor: isSel ? '#00c9b1' : '#d8edf0', boxShadow: isSel ? '0 0 0 3px rgba(0,201,177,.1)' : '' }}>
                  {isSel && <div className="absolute top-0 left-0 bottom-0 w-[3px] rounded-r-full" style={{ background: 'linear-gradient(180deg,#00c9b1,#0096a0)' }} />}
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] text-[#8ab0b8] font-mono">{txn.reference}</span>
                    <StatusBadge status={txn.status} />
                  </div>
                  <p className="text-[13px] font-medium text-[#0d2b32] mb-1 truncate">{txn.supplier}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-[#8ab0b8]">{new Date(txn.createdAt).toLocaleDateString('ro-RO', { day: '2-digit', month: 'short' })}</span>
                    <span className={`text-[13px] font-semibold ${isIn ? 'text-[#0f6e56]' : 'text-[#a32d2d]'}`}>
                      {isIn ? '+' : '-'}{formatRON(txn.totalAmount)}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Detail */}
          {selected ? (
            <div className="flex-1 bg-white border border-[#d8edf0] rounded-2xl overflow-hidden flex flex-col">
              <div className="p-6 border-b border-[#edf5f7] flex items-start justify-between flex-shrink-0" style={{ background: 'linear-gradient(135deg,#f5fcfc,#fff)' }}>
                <div>
                  <h2 className="text-[17px] font-semibold text-[#0d2b32] mb-1">{selected.documentType} — {selected.supplier}</h2>
                  <p className="text-[12px] text-[#8ab0b8]">{selected.reference} · {selected.createdBy?.firstName} {selected.createdBy?.lastName} · {formatDate(selected.createdAt)}</p>
                </div>
                <StatusBadge status={selected.status} />
              </div>

              <div className="p-5 flex-1 overflow-y-auto">
                <div className="grid grid-cols-4 gap-3 mb-4">
                  {[
                    { label: 'Sumă totală', value: formatRON(selected.totalAmount), big: true },
                    { label: 'Tip document', value: selected.documentType },
                    { label: 'Furnizor', value: selected.supplier },
                    { label: 'Categorie', value: selected.category },
                  ].map(({ label, value, big }) => (
                    <div key={label} className="bg-[#f5fcfc] border border-[#cce8ec] rounded-xl p-3.5">
                      <p className="text-[9.5px] font-semibold text-[#8ab0b8] uppercase tracking-wider mb-1.5">{label}</p>
                      <p className={`font-semibold text-[#0d2b32] ${big ? 'text-[19px]' : 'text-[13px]'}`}>{value}</p>
                    </div>
                  ))}
                </div>

                {selected.category === 'Stoc produse' && selected.stockItem && (
                  <div className="flex gap-3 p-3.5 rounded-xl mb-4 text-[12.5px]" style={{ background: '#edf9f7', border: '1px solid #9fe1cb', color: '#0f6e56' }}>
                    <Package size={15} className="flex-shrink-0 mt-0.5" />
                    <p>Această tranzacție conține <strong>{selected.stockQuantityDelta} unități</strong> din stoc. La aprobare, cantitatea se actualizează automat.</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <p className="text-[9.5px] font-semibold text-[#8ab0b8] uppercase tracking-widest mb-3">Flux de aprobare</p>
                    {approvalSteps.map((step, i) => <ApprovalStep key={i} {...step} />)}
                  </div>
                  <div>
  <p className="text-[9.5px] font-semibold text-[#8ab0b8] uppercase tracking-widest mb-3">Detalii financiare & Document</p>
  <div className="bg-[#f5fcfc] border border-[#cce8ec] rounded-xl overflow-hidden">
    {[
      { label: 'Număr Document / Bon', value: selected.documentNumber || '-' },
      { label: 'Dată Emitere Document', value: selected.issueDate ? new Date(selected.issueDate).toLocaleDateString('ro-RO', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '-' },
      { label: 'Cont IBAN Furnizor', value: selected.bankAccount || '-', mono: true },
      { label: 'Status Plată Remisă', value: selected.paymentStatus || 'Neplătit', badge: true },
      { label: 'Sumă netă', value: formatRON(selected.netAmount) },
      { label: `TVA (${selected.tva || 19}%)`, value: formatRON(selected.totalAmount - selected.netAmount) },
      { label: 'Total factură', value: formatRON(selected.totalAmount), bold: true },
      { label: 'Metodă plată', value: selected.paymentMethod },
      { label: 'Scadență Aprobare Manager', value: selected.dueDate ? new Date(selected.dueDate).toLocaleDateString('ro-RO') : '-', alert: selected.status === 'În așteptare' },
    ].map(({ label, value, bold, mono, badge, alert }) => (
      <div key={label} className="flex justify-between items-center px-4 py-2.5 border-b border-[#d8edf0] last:border-0">
        <span className="text-[12px] text-[#6b9aa5]">{label}</span>
        {badge ? (
          <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${
            value === 'Plătit' ? 'bg-[#e0f7f5] text-[#0f6e56] border-[#9fe1cb]' :
            value === 'În curs' ? 'bg-[#faeeda] text-[#854f0b] border-[#f5c775]' :
            'bg-[#fcebeb] text-[#a32d2d] border-[#f7c1c1]'
          }`}>
            {value}
          </span>
        ) : (
          <span className={`text-[12.5px] ${bold ? 'font-semibold text-[#0d2b32]' : 'text-[#0d2b32]'} ${mono ? 'font-mono text-[11.5px]' : ''} ${alert ? 'text-[#854f0b] font-medium' : ''}`}>
            {value}
          </span>
        )}
      </div>
    ))}
  </div>
</div>
                </div>
              </div>

              {/* Actions - MANAGER ONLY, PENDING ONLY */}
              {isManager && selected.status === 'În așteptare' && (
                <div className="px-5 pb-5 border-t border-[#edf5f7] pt-4 flex-shrink-0">
                  {showRejectInput && (
                    <input value={rejectNote} onChange={e => setRejectNote(e.target.value)}
                      placeholder="Motiv respingere (opțional)..."
                      className="w-full px-3 py-2 text-sm border border-[#d8edf0] rounded-xl mb-3 outline-none focus:border-[#00c9b1] text-[#0d2b32]" />
                  )}
                  <div className="flex gap-3">
                    <button onClick={() => setShowRejectInput(v => !v)}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-medium bg-white border border-[#d8edf0] text-[#6b9aa5]">
                      <MessageSquare size={13} /> Notă
                    </button>
                    <button onClick={showRejectInput ? handleReject : () => setShowRejectInput(true)} disabled={actionLoading}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-medium bg-[#fcebeb] border border-[#f7c1c1] text-[#a32d2d] disabled:opacity-60">
                      <X size={13} /> Respinge
                    </button>
                    <button onClick={handleApprove} disabled={actionLoading}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-medium text-white disabled:opacity-60"
                      style={{ background: 'linear-gradient(135deg,#00b8a4,#0096a0)' }}>
                      <Check size={13} /> {actionLoading ? 'Se procesează...' : 'Aprobă tranzacția'}
                    </button>
                  </div>
                </div>
              )}

              {/* Info for Angajat - read only on approved/rejected */}
              {!isManager && selected.status !== 'În așteptare' && (
                <div className="px-5 pb-4 pt-3 border-t border-[#edf5f7] flex-shrink-0">
                  <p className="text-[12px] text-[#8ab0b8] text-center">
                    Această tranzacție a fost {selected.status === 'Aprobat' ? 'aprobată' : 'respinsă'} de manager.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 bg-white border border-[#d8edf0] rounded-2xl flex items-center justify-center text-[#8ab0b8] text-sm">
              Selectează o tranzacție din lista din stânga
            </div>
          )}
        </div>
      </div>

      {/* New transaction modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b border-[#d8edf0] flex items-center justify-between">
              <h3 className="text-[15px] font-semibold text-[#0d2b32]">Tranzacție nouă</h3>
              <button onClick={closeForm} className="text-[#8ab0b8] hover:text-[#0d2b32]"><X size={18} /></button>
            </div>
            <form onSubmit={handleCreate} className="p-5 space-y-4">
              
              {/* ZONĂ NOUĂ: Panou dedicat pentru scanare și procesare rapidă prin OCR */}
              <div className="p-4 bg-[#f5fcfc] border border-dashed border-[#9fe1cb] rounded-xl text-center">
                <p className="text-[12px] text-[#0d2b32] mb-2 font-medium">
                  {loadingScan ? "Se procesează documentul..." : "Completare automată inteligentă"}
                </p>
                <label className={`inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-[12px] font-medium shadow-sm hover:bg-indigo-700 cursor-pointer transition-all ${loadingScan ? 'opacity-50 pointer-events-none' : ''}`}>
                  <Camera size={14} />
                  <span>{loadingScan ? 'Procesare OCR în curs...' : 'Scanează Poză / PDF Factură'}</span>
                  <input 
                    type="file" 
                    accept="image/*,application/pdf" 
                    className="hidden" 
                    onChange={handleInvoiceScan}
                    disabled={loadingScan}
                  />
                </label>
                <p className="text-[10px] text-[#6b9aa5] mt-1.5 font-light">Sistemul va extrage automat CUI, Furnizor, Sumă și Dată</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-semibold text-[#8ab0b8] uppercase tracking-wider mb-1.5">Tip</label>
                  <select className="w-full px-3 py-2 text-sm border border-[#d8edf0] rounded-xl outline-none focus:border-[#00c9b1] text-[#0d2b32]"
                    value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                    <option>Cheltuială</option><option>Venit</option>
                  </select>
                </div>

                {/* Tip document cu "Altele" editabil */}
                <div>
                  <label className="block text-[10px] font-semibold text-[#8ab0b8] uppercase tracking-wider mb-1.5">Tip document</label>
                  <select
                    className="w-full px-3 py-2 text-sm border border-[#d8edf0] rounded-xl outline-none focus:border-[#00c9b1] text-[#0d2b32]"
                    value={isCustomDocType ? 'Altele' : form.documentType}
                    onChange={e => handleSelectChange('documentType', e.target.value, DOCUMENT_TYPES)}>
                    {DOCUMENT_TYPES.map(o => <option key={o}>{o}</option>)}
                    <option>Altele</option>
                  </select>
                  {isCustomDocType && (
                    <input
                      autoFocus
                      className="w-full px-3 py-2 text-sm border border-[#00c9b1] rounded-xl outline-none mt-1.5 text-[#0d2b32]"
                      placeholder="Specifică tipul documentului..."
                      value={customFields.documentType}
                      onChange={e => handleCustomChange('documentType', e.target.value)}
                    />
                  )}
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-[#8ab0b8] uppercase tracking-wider mb-1.5">Categorie</label>
                <select
                  className="w-full px-3 py-2 text-sm border border-[#d8edf0] rounded-xl outline-none focus:border-[#00c9b1] text-[#0d2b32]"
                  value={isCustomCategory ? 'Altele' : form.category}
                  onChange={e => handleSelectChange('category', e.target.value, CATEGORIES)}>
                  {CATEGORIES.map(o => <option key={o}>{o}</option>)}
                  <option>Altele</option>
                </select>
                {isCustomCategory && (
                  <input
                    autoFocus
                    className="w-full px-3 py-2 text-sm border border-[#00c9b1] rounded-xl outline-none mt-1.5 text-[#0d2b32]"
                    placeholder="Specifică categoria..."
                    value={customFields.category}
                    onChange={e => handleCustomChange('category', e.target.value)}
                  />
                )}
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-[#8ab0b8] uppercase tracking-wider mb-1.5">Furnizor / Client</label>
                <input required className="w-full px-3 py-2 text-sm border border-[#d8edf0] rounded-xl outline-none focus:border-[#00c9b1] text-[#0d2b32]"
                  value={form.supplier} onChange={e => setForm(f => ({ ...f, supplier: e.target.value }))} placeholder="Ex: Electro SRL" />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-[#8ab0b8] uppercase tracking-wider mb-1.5">CUI</label>
                <input
                  className="w-full px-3 py-2 text-sm border border-[#d8edf0] rounded-xl outline-none focus:border-[#00c9b1] text-[#0d2b32]"
                  value={form.cui}
                  onChange={e => setForm(f => ({ ...f, cui: e.target.value }))}
                  placeholder="Ex: RO12345678"
                />
              </div>
              {/* ================= PASUL C: CÂMPURILE NOI ADĂUGATE AICI ================= */}
<div className="grid grid-cols-2 gap-3">
  <div>
    <label className="block text-[10px] font-semibold text-[#8ab0b8] uppercase tracking-wider mb-1.5">Număr Document</label>
    <input 
      className="w-full px-3 py-2 text-sm border border-[#d8edf0] rounded-xl outline-none focus:border-[#00c9b1] text-[#0d2b32]"
      value={form.documentNumber} 
      onChange={e => setForm(f => ({ ...f, documentNumber: e.target.value }))} 
      placeholder="Ex: Seria FT nr. 42" 
    />
  </div>
  <div>
    <label className="block text-[10px] font-semibold text-[#8ab0b8] uppercase tracking-wider mb-1.5">Data emitere</label>
    <input 
      type="date" 
      className="w-full px-3 py-2 text-sm border border-[#d8edf0] rounded-xl outline-none focus:border-[#00c9b1] text-[#0d2b32]"
      value={form.issueDate} 
      onChange={e => setForm(f => ({ ...f, issueDate: e.target.value }))} 
    />
  </div>
</div>

<div className="grid grid-cols-2 gap-3">
  <div>
    <label className="block text-[10px] font-semibold text-[#8ab0b8] uppercase tracking-wider mb-1.5">Cont IBAN</label>
    <input 
      className="w-full px-3 py-2 text-sm border border-[#d8edf0] rounded-xl outline-none focus:border-[#00c9b1] text-[#0d2b32]"
      value={form.bankAccount} 
      onChange={e => setForm(f => ({ ...f, bankAccount: e.target.value }))} 
      placeholder="RO00BTRL..." 
    />
  </div>
  <div>
    <label className="block text-[10px] font-semibold text-[#8ab0b8] uppercase tracking-wider mb-1.5">Status plată</label>
    <select 
      className="w-full px-3 py-2 text-sm border border-[#d8edf0] rounded-xl outline-none focus:border-[#00c9b1] text-[#0d2b32]"
      value={form.paymentStatus} 
      onChange={e => setForm(f => ({ ...f, paymentStatus: e.target.value }))}
    >
      <option>Neplătit</option>
      <option>Plătit</option>
      <option>În curs</option>
    </select>
  </div>
</div>

              {/* Stock linking */}
              {form.category === 'Stoc produse' && (
                <div className="grid grid-cols-2 gap-3 p-3 rounded-xl" style={{ background: '#edf9f7', border: '1px solid #9fe1cb' }}>
                  <div>
                    <label className="block text-[10px] font-semibold text-[#0f6e56] uppercase tracking-wider mb-1.5">Produs din stoc</label>
                    <select className="w-full px-3 py-2 text-sm border border-[#9fe1cb] rounded-xl outline-none text-[#0d2b32] bg-white"
                      value={form.stockItem} onChange={e => setForm(f => ({ ...f, stockItem: e.target.value }))}>
                      <option value="">— Selectează —</option>
                      {stocks.map(s => <option key={s._id} value={s._id}>{s.name} (stoc: {s.quantity})</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-[#0f6e56] uppercase tracking-wider mb-1.5">Cantitate</label>
                    <input type="number" min="1" className="w-full px-3 py-2 text-sm border border-[#9fe1cb] rounded-xl outline-none text-[#0d2b32] bg-white"
                      value={form.stockQuantityDelta} onChange={e => setForm(f => ({ ...f, stockQuantityDelta: e.target.value }))} placeholder="Ex: 4" />
                  </div>
                  <p className="col-span-2 text-[11px] text-[#0f6e56]">Stocul se va actualiza automat la aprobarea managerului.</p>
                </div>
              )}

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-semibold text-[#8ab0b8] uppercase tracking-wider mb-1.5">Sumă netă (RON)</label>
                  <input required type="number" step="0.01" min="0" className="w-full px-3 py-2 text-sm border border-[#d8edf0] rounded-xl outline-none focus:border-[#00c9b1] text-[#0d2b32]"
                    value={form.netAmount} onChange={e => handleNetChange(e.target.value)} placeholder="0.00" />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-[#8ab0b8] uppercase tracking-wider mb-1.5">TVA (%)</label>
                  <input type="number" min="0" max="100" className="w-full px-3 py-2 text-sm border border-[#d8edf0] rounded-xl outline-none focus:border-[#00c9b1] text-[#0d2b32]"
                    value={form.tva}
                    onChange={e => {
                      const rate = parseFloat(e.target.value) || 0
                      const net = parseFloat(form.netAmount) || 0
                      setForm(f => ({ ...f, tva: e.target.value, totalAmount: (net + net * rate / 100).toFixed(2) }))
                    }} />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-[#8ab0b8] uppercase tracking-wider mb-1.5">Total (RON)</label>
                  <input readOnly type="number" className="w-full px-3 py-2 text-sm border border-[#d8edf0] rounded-xl outline-none bg-[#f5fcfc] text-[#0d2b32]"
                    value={form.totalAmount} placeholder="0.00" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-semibold text-[#8ab0b8] uppercase tracking-wider mb-1.5">Scadență aprobare</label>
                  <input type="date" className="w-full px-3 py-2 text-sm border border-[#d8edf0] rounded-xl outline-none focus:border-[#00c9b1] text-[#0d2b32]"
                    value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} />
                </div>

                {/* Metodă plată cu "Altele" editabil */}
                <div>
                  <label className="block text-[10px] font-semibold text-[#8ab0b8] uppercase tracking-wider mb-1.5">Metodă plată</label>
                  <select
                    className="w-full px-3 py-2 text-sm border border-[#d8edf0] rounded-xl outline-none focus:border-[#00c9b1] text-[#0d2b32]"
                    value={isCustomPayment ? 'Altele' : form.paymentMethod}
                    onChange={e => handleSelectChange('paymentMethod', e.target.value, PAYMENT_METHODS)}>
                    {PAYMENT_METHODS.map(o => <option key={o}>{o}</option>)}
                    <option>Altele</option>
                  </select>
                  {isCustomPayment && (
                    <input
                      autoFocus
                      className="w-full px-3 py-2 text-sm border border-[#00c9b1] rounded-xl outline-none mt-1.5 text-[#0d2b32]"
                      placeholder="Specifică metoda de plată..."
                      value={customFields.paymentMethod}
                      onChange={e => handleCustomChange('paymentMethod', e.target.value)}
                    />
                  )}
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-[#8ab0b8] uppercase tracking-wider mb-1.5">Notă (opțional)</label>
                <textarea rows={2} className="w-full px-3 py-2 text-sm border border-[#d8edf0] rounded-xl outline-none focus:border-[#00c9b1] text-[#0d2b32] resize-none"
                  value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Detalii suplimentare..." />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={closeForm}
                  className="flex-1 py-2.5 rounded-xl text-[13px] font-medium bg-white border border-[#d8edf0] text-[#6b9aa5]">
                  Anulează
                </button>
                <button type="submit" disabled={actionLoading || loadingScan}
                  className="flex-1 py-2.5 rounded-xl text-[13px] font-medium text-white disabled:opacity-60"
                  style={{ background: 'linear-gradient(135deg,#00b8a4,#0096a0)' }}>
                  {actionLoading ? 'Se salvează...' : 'Înregistrează'}
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