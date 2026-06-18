import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Plus, Check, X, Clock, MessageSquare, Package, Camera } from 'lucide-react'
import Sidebar from '../components/Sidebar'
import Navbar from '../components/Navbar'
import { ToastContainer } from '../components/Toast'
import { useTransactions } from '../hooks/useTransactions'
import { useStocks } from '../hooks/useStocks'
import { useAuth } from '../hooks/useAuth'
import { useToast } from '../hooks/useToast'
import api from '../api'

const formatRON = (n) =>
  new Intl.NumberFormat('ro-RO', { minimumFractionDigits: 2 }).format(n || 0) + ' RON'

const formatDate = (d) => {
  if (!d) return '-'
  return new Date(d).toLocaleDateString('ro-RO', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

const StatusBadge = ({ status }) => {
  if (status === 'Aprobat') return <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200"><Check size={9} />Aprobată</span>
  if (status === 'Respins') return <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1 rounded-full bg-red-50 text-red-600 border border-red-200"><X size={9} />Respinsă</span>
  return <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200"><Clock size={9} />În așteptare</span>
}

const ApprovalStep = ({ label, sublabel, state }) => {
  const dotClass = state === 'done'
    ? 'bg-emerald-50 border border-emerald-200'
    : state === 'active'
    ? 'bg-amber-50 border border-amber-200'
    : 'bg-[#f7f1f8] border border-[#b48bd0]/30'
  const Icon = state === 'done' ? Check : state === 'active' ? Clock : Package
  const iconColor = state === 'done' ? '#059669' : state === 'active' ? '#92400e' : '#b48bd0'
  return (
    <div className="flex gap-3 pb-4">
      <div className="flex flex-col items-center">
        <div className={`w-7 h-7 rounded-full flex items-center justify-center ${dotClass}`}>
          <Icon size={13} style={{ color: iconColor }} />
        </div>
        <div className="w-px flex-1 bg-[#b48bd0]/20 mt-1" />
      </div>
      <div className="pt-1 pb-2">
        <p className={`text-[12.5px] font-medium ${state === 'wait' ? 'text-[#b48bd0]' : 'text-[#352a6e]'}`}>{label}</p>
        <p className={`text-[11px] ${state === 'active' ? 'text-amber-700' : 'text-[#b48bd0]'}`}>{sublabel}</p>
      </div>
    </div>
  )
}

const DOCUMENT_TYPES = ['Factură', 'Chitanță', 'Bon fiscal']
const CATEGORIES = ['Furnizori', 'Salarii', 'Operațional', 'Produse']
const PAYMENT_METHODS = ['Transfer bancar', 'Numerar', 'Card']

const resetForm = {
  type: 'Cheltuială', documentType: 'Factură', supplier: '',
  cui: '',
  category: 'Furnizori', netAmount: '', tva: '19',
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
  const [editMode, setEditMode] = useState(false)
  const [deletePending, setDeletePending] = useState(false)
  const [managerNote, setManagerNote] = useState('')
  const [showNoteInput, setShowNoteInput] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [loadingScan, setLoadingScan] = useState(false)
  const [form, setForm] = useState(resetForm)
  const [customFields, setCustomFields] = useState(resetCustom)

  // 1. Adăugare stare locală pentru validarea câmpurilor unice
  const [validationErrors, setValidationErrors] = useState({ cui: '', bankAccount: '' })

  const { transactions, loading, pendingCount, approve, reject, create, update, remove, refetch } = useTransactions(filter === 'Toate' ? null : filter)
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

  // 2. Funcție pentru validarea lungimilor strânse în interfață
  const validateFields = (field, value) => {
    let errs = { ...validationErrors };
    
    if (field === 'cui') {
      const cleanCui = value.toUpperCase().replace(/\s/g, '');
      if (cleanCui.length > 0 && (cleanCui.length < 2 || cleanCui.length > 12)) {
        errs.cui = 'CUI invalid (trebuie să aibă între 2 și 12 caractere).';
      } else {
        errs.cui = '';
      }
    }

    if (field === 'bankAccount') {
      const cleanIban = value.toUpperCase().replace(/\s/g, '');
      if (cleanIban.length > 0 && cleanIban.length !== 24) {
        errs.bankAccount = `IBAN incomplet (${cleanIban.length}/24 caractere).`;
      } else {
        errs.bankAccount = '';
      }
    }

    setValidationErrors(errs);
  };

  const handleNetChange = (val) => {
    const net = parseFloat(val) || 0
    const tvaRate = parseFloat(form.tva) || 0
    const total = net + (net * tvaRate / 100)
    setForm(f => ({ ...f, netAmount: val, totalAmount: total.toFixed(2) }))
  }

  // 3. Resetarea stării erorilor la închiderea formularului
  const closeForm = () => {
    setShowForm(false)
    setEditMode(false)
    setForm(resetForm)
    setCustomFields(resetCustom)
    setValidationErrors({ cui: '', bankAccount: '' })
  }

  const openEdit = () => {
    if (!selected) return
    setForm({
      type: selected.type || 'Cheltuială',
      documentType: selected.documentType || 'Factură',
      supplier: selected.supplier || '',
      cui: selected.cui || '',
      category: selected.category || 'Furnizori',
      netAmount: selected.netAmount || '',
      tva: selected.tva ?? 19,
      totalAmount: selected.totalAmount || '',
      dueDate: selected.dueDate ? selected.dueDate.slice(0, 10) : '',
      paymentMethod: selected.paymentMethod || 'Transfer bancar',
      notes: selected.notes || '',
      stockItem: selected.stockItem?._id || selected.stockItem || '',
      stockQuantityDelta: selected.stockQuantityDelta || '',
      documentNumber: selected.documentNumber || '',
      bankAccount: selected.bankAccount || '',
      issueDate: selected.issueDate ? selected.issueDate.slice(0, 10) : '',
      paymentStatus: selected.paymentStatus || 'Neplătit',
    })
    setEditMode(true)
    setShowForm(true)
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

  const handleUpdate = async (e) => {
    e.preventDefault()
    setActionLoading(true)
    try {
      const updated = await update(selected._id, form)
      success('Tranzacție actualizată.')
      closeForm()
      setSelected(updated)
    } catch (err) {
      toastError(err.response?.data?.message || 'Eroare la actualizare.')
    } finally {
      setActionLoading(false)
    }
  }

  const handleDelete = async () => {
    setActionLoading(true)
    try {
      await remove(selected._id)
      success('Tranzacție ștearsă.')
      setSelected(null)
      setDeletePending(false)
    } catch (err) {
      toastError(err.response?.data?.message || 'Eroare la ștergere.')
    } finally {
      setActionLoading(false)
    }
  }

  const handleApprove = async () => {
    if (!selected) return
    setActionLoading(true)
    try {
      const updated = await approve(selected._id, managerNote)
      setSelected(updated)
      setManagerNote('')
      setShowNoteInput(false)
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
      const updated = await reject(selected._id, managerNote)
      setSelected(updated)
      setShowNoteInput(false)
      setManagerNote('')
      success('Tranzacție respinsă.')
    } catch (err) {
      toastError(err.response?.data?.message || 'Eroare la respingere.')
    } finally {
      setActionLoading(false)
    }
  }

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
        const fmtCui = extracted.cui ? extracted.cui.toUpperCase().replace(/\s/g, '') : '';
        const fmtIban = extracted.bankAccount ? extracted.bankAccount.toUpperCase().replace(/\s/g, '') : '';

        setForm(f => ({
          ...f,
          cui: fmtCui || f.cui,
          supplier: extracted.supplier || f.supplier,
          documentNumber: extracted.documentNumber || f.documentNumber,
          bankAccount: fmtIban || f.bankAccount,
          issueDate: extracted.issueDate || f.issueDate,
          netAmount: extracted.netAmount || f.netAmount,
          tva: extracted.tva || f.tva,
          totalAmount: extracted.totalAmount || f.totalAmount,
        }))
        
        // Verificăm validarea și pentru datele venite din scanarea OCR
        if (fmtCui) validateFields('cui', fmtCui);
        if (fmtIban) validateFields('bankAccount', fmtIban);

        success('Document scanat cu succes! Câmpurile financiare au fost completate.')
      }
    } catch (err) {
      toastError('Nu s-au putut extrage datele automat.')
    } finally {
      setLoadingScan(false)
      e.target.value = null
    }
  }

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
          ? `Respinsă · ${selected.rejectionReason || 'fără motiv'}`
          : `${user?.firstName} ${user?.lastName} · În așteptare decizie`,
      state: selected.status === 'Aprobat' ? 'done' : selected.status === 'Respins' ? 'done' : 'active'
    },
    {
      label: 'Actualizare automată stoc',
      sublabel: 'Sistem · Declanșat automat după aprobare',
      state: selected.status === 'Aprobat' && selected.category === 'Produse' ? 'done' : 'wait'
    },
  ] : []

  const filterLabels = ['Toate', 'În așteptare', 'Aprobate', 'Respinse']

  const inputCls = "w-full px-3 py-2 text-sm bg-white/50 border border-[#b48bd0]/30 rounded-xl outline-none focus:border-[#5b4ad1]/60 focus:bg-white/80 text-[#352a6e] placeholder-[#b48bd0]/60 transition-all duration-150"
  const selectCls = "w-full px-3 py-2 text-sm bg-white/50 border border-[#b48bd0]/30 rounded-xl outline-none focus:border-[#5b4ad1]/60 text-[#352a6e] transition-all duration-150"

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'transparent' }}>
      <Sidebar pendingCount={pendingCount} />
      <div className="flex-1 flex flex-col overflow-hidden">

        <Navbar
          title="Gestiune tranzacții"
          subtitle={pendingCount > 0 ? `${pendingCount} documente necesită aprobarea dvs.` : 'Toate tranzacțiile sunt procesate'}
        />

        <div className="flex items-center justify-end gap-4 px-7 pb-4 flex-shrink-0">
          <div className="flex gap-1 bg-white/40 border border-[#b48bd0]/20 rounded-xl p-1">
            {filterLabels.map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`text-[11.5px] px-3 py-1.5 rounded-lg font-medium transition-all duration-200 ${
                  filter === f
                    ? 'bg-[#5b4ad1] text-white shadow-sm shadow-[#5b4ad1]/30'
                    : f === 'În așteptare' && pendingCount > 0
                    ? 'bg-amber-50 text-amber-700'
                    : 'text-[#b48bd0] hover:text-[#5b4ad1]'
                }`}>
                {f}{f === 'În așteptare' && pendingCount > 0 ? ` (${pendingCount})` : ''}
              </button>
            ))}
          </div>
          {!isManager && (
            <button onClick={() => setShowForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-[#5b4ad1] hover:bg-[#6a63d4] text-white text-[12px] font-medium rounded-xl shadow-md shadow-[#5b4ad1]/25 transition-all duration-200">
              <Plus size={13} /> Tranzacție nouă
            </button>
          )}
        </div>

        <div className="flex flex-1 overflow-hidden px-7 pb-6 gap-4 min-h-0">
          <div className="w-64 flex flex-col flex-shrink-0 overflow-hidden">
            {loading && <div className="text-center py-8 text-[#b48bd0] text-sm">Se încarcă...</div>}
            {!loading && transactions.length === 0 && (
              <div className="text-center py-8 text-[#b48bd0] text-sm">Nicio tranzacție</div>
            )}
            <div className="flex-1 overflow-y-auto flex flex-col gap-1.5 pr-1" style={{ scrollbarWidth: 'thin' }}>
              {transactions.map(txn => {
                const isIn = txn.type === 'Venit'
                const isSel = selected?._id === txn._id
                return (
                  <div key={txn._id}
                    onClick={() => { setSelected(txn); setDeletePending(false); setManagerNote(''); setShowNoteInput(false) }}
                    className="bg-white/60 backdrop-blur-sm border rounded-xl px-3 py-2.5 cursor-pointer transition-all duration-200 relative overflow-hidden hover:bg-white/80 flex-shrink-0"
                    style={{
                      borderColor: isSel ? '#5b4ad1' : 'rgba(180,139,208,0.25)',
                      boxShadow: isSel ? '0 0 0 2px rgba(91,74,209,0.15)' : '',
                    }}>
                    {isSel && <div className="absolute top-0 left-0 bottom-0 w-[3px] rounded-r-full bg-gradient-to-b from-[#5b4ad1] to-[#b48bd0]" />}
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[9.5px] text-[#b48bd0] font-mono">{txn.reference}</span>
                      <StatusBadge status={txn.status} />
                    </div>
                    <p className="text-[12px] font-medium text-[#352a6e] truncate mb-0.5">{txn.supplier}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-[10.5px] text-[#b48bd0]">
                        {new Date(txn.createdAt).toLocaleDateString('ro-RO', { day: '2-digit', month: 'short' })}
                      </span>
                      <span className={`text-[12px] font-semibold ${isIn ? 'text-emerald-600' : 'text-red-500'}`}>
                        {isIn ? '+' : '-'}{formatRON(txn.totalAmount)}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {selected ? (
            <div className="flex-1 bg-white/60 backdrop-blur-xl border border-[#b48bd0]/25 rounded-2xl overflow-hidden flex flex-col min-h-0">
              <div className="px-5 py-3 border-b border-[#b48bd0]/15 flex items-center justify-between flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, rgba(247,241,248,0.7), rgba(255,255,255,0.5))' }}>
                <div className="min-w-0 flex-1 mr-3">
                  <h2 className="text-[14px] font-semibold text-[#352a6e] truncate">{selected.documentType} - {selected.supplier}</h2>
                  <p className="text-[11px] text-[#b48bd0]">{selected.reference} · {selected.createdBy?.firstName} {selected.createdBy?.lastName} · {formatDate(selected.createdAt)}</p>
                </div>
                <StatusBadge status={selected.status} />
              </div>

              <div className="flex-1 overflow-y-auto p-5 space-y-4 min-h-0" style={{ scrollbarWidth: 'thin' }}>
                <div className="grid grid-cols-4 gap-3">
                  {[
                    { label: 'Sumă totală', value: formatRON(selected.totalAmount), big: true },
                    { label: 'Tip document', value: selected.documentType },
                    { label: 'Furnizor', value: selected.supplier },
                    { label: 'Categorie', value: selected.category },
                  ].map(({ label, value, big }) => (
                    <div key={label} className="bg-white/50 border border-[#b48bd0]/20 rounded-2xl px-4 py-3.5">
                      <p className="text-[10px] font-semibold text-[#b48bd0] uppercase tracking-wider mb-1.5">{label}</p>
                      <p className={`font-semibold text-[#352a6e] truncate ${big ? 'text-[18px]' : 'text-[13px]'}`}>{value}</p>
                    </div>
                  ))}
                </div>

                {selected.category === 'Produse' && selected.stockItem && (
                  <div className="flex gap-3 p-3.5 rounded-xl text-[12.5px] bg-emerald-50 border border-emerald-200 text-emerald-700">
                    <Package size={15} className="flex-shrink-0 mt-0.5" />
                    <p><strong>{selected.stockQuantityDelta} unități</strong> din stoc. Cantitatea se actualizează automat la aprobare.</p>
                  </div>
                )}

                {selected.managerNote && (
                  <div className="flex gap-3 p-3.5 rounded-xl text-[12.5px] bg-amber-50 border border-amber-200 text-amber-700">
                    <MessageSquare size={15} className="flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider mb-0.5 text-amber-800">Notă manager</p>
                      <p>{selected.managerNote}</p>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <p className="text-[10px] font-semibold text-[#b48bd0] uppercase tracking-widest mb-3">Flux aprobare</p>
                    {approvalSteps.map((step, i) => <ApprovalStep key={i} {...step} />)}
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-[#b48bd0] uppercase tracking-widest mb-3">Detalii financiare</p>
                    <div className="bg-white/50 border border-[#b48bd0]/20 rounded-2xl overflow-hidden">
                      {[
                        { label: 'Nr. document', value: selected.documentNumber || '-' },
                        { label: 'Dată emitere', value: selected.issueDate ? new Date(selected.issueDate).toLocaleDateString('ro-RO', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '-' },
                        { label: 'CUI', value: selected && selected.cui || '-', mono: true },
                        { label: 'IBAN', value: selected.bankAccount || '-', mono: true },
                        { label: 'Status plată', value: selected.paymentStatus || 'Neplătit', badge: true },
                        { label: 'Sumă netă', value: formatRON(selected.netAmount) },
                        { label: `TVA (${selected.tva || 19}%)`, value: formatRON(selected.totalAmount - selected.netAmount) },
                        { label: 'Total factură', value: formatRON(selected.totalAmount), bold: true },
                        { label: 'Metodă plată', value: selected.paymentMethod },
                        { label: 'Scadență aprobare', value: selected.dueDate ? new Date(selected.dueDate).toLocaleDateString('ro-RO') : '-', alert: selected.status === 'În așteptare' },
                      ].map(({ label, value, bold, mono, badge, alert }) => (
                        <div key={label} className="flex justify-between items-center px-4 py-2.5 border-b border-[#b48bd0]/10 last:border-0">
                          <span className="text-[12px] text-[#b48bd0] flex-shrink-0 mr-2">{label}</span>
                          {badge ? (
                            <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border flex-shrink-0 ${
                              value === 'Plătit' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                              value === 'În curs' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                              'bg-red-50 text-red-600 border-red-200'
                            }`}>{value}</span>
                          ) : (
                            <span className={`text-[12.5px] text-right truncate max-w-[140px] ${bold ? 'font-semibold text-[#352a6e]' : 'text-[#352a6e]'} ${mono ? 'font-mono text-[11px]' : ''} ${alert ? 'text-amber-700 font-medium' : ''}`}>
                              {value}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {isManager && selected.status === 'În așteptare' && (
                <div className="px-4 pb-4 pt-3 border-t border-[#b48bd0]/15 flex-shrink-0">
                  {showNoteInput && (
                    <textarea value={managerNote} onChange={e => setManagerNote(e.target.value)}
                      rows={2} placeholder="Notă pentru angajat..."
                      className="w-full px-3 py-2 text-sm border border-[#b48bd0]/30 rounded-xl mb-2.5 outline-none focus:border-[#5b4ad1]/60 text-[#352a6e] resize-none bg-white/50" />
                  )}
                  <div className="flex gap-2">
                    <button onClick={() => setShowNoteInput(v => !v)}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-[12px] font-medium border transition-all duration-200 ${showNoteInput ? 'bg-[#f7f1f8] border-[#b48bd0]/40 text-[#5b4ad1]' : 'bg-white/50 border-[#b48bd0]/30 text-[#b48bd0]'}`}>
                      <MessageSquare size={12} /> Notă
                    </button>
                    <button onClick={handleReject} disabled={actionLoading}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-[12px] font-medium bg-red-50 border border-red-200 text-red-600 disabled:opacity-60 hover:bg-red-100 transition-all duration-200">
                      <X size={12} /> Respinge
                    </button>
                    <button onClick={handleApprove} disabled={actionLoading}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-[12px] font-medium text-white disabled:opacity-60 bg-[#5b4ad1] hover:bg-[#6a63d4] shadow-md shadow-[#5b4ad1]/25 transition-all duration-200">
                      <Check size={12} /> {actionLoading ? 'Se procesează...' : 'Aprobă'}
                    </button>
                  </div>
                </div>
              )}

              {!isManager && selected.status !== 'Aprobat' && (
                <div className="px-4 pb-4 pt-3 border-t border-[#b48bd0]/15 flex-shrink-0">
                  {!deletePending ? (
                    <div className="flex gap-2">
                      <button onClick={openEdit}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[12px] font-medium bg-white/50 border border-[#b48bd0]/30 text-[#5b4ad1] hover:border-[#5b4ad1]/50 hover:bg-white/70 transition-all duration-200">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        Editează
                      </button>
                      <button onClick={() => setDeletePending(true)}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[12px] font-medium bg-red-50 border border-red-200 text-red-600 hover:bg-red-100 transition-all duration-200">
                        <X size={12} /> Șterge
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-[11.5px] text-[#352a6e] flex-1">Ștergi această tranzacție?</span>
                      <button onClick={handleDelete} disabled={actionLoading}
                        className="px-3 py-1.5 rounded-xl text-[11.5px] font-medium bg-red-600 text-white disabled:opacity-60 hover:bg-red-700 transition-all duration-200">
                        {actionLoading ? 'Se șterge...' : 'Da, șterge'}
                      </button>
                      <button onClick={() => setDeletePending(false)} disabled={actionLoading}
                        className="px-3 py-1.5 rounded-xl text-[11.5px] font-medium bg-white/50 border border-[#b48bd0]/30 text-[#b48bd0]">
                        Anulează
                      </button>
                    </div>
                  )}
                </div>
              )}

              {!isManager && selected.status === 'Aprobat' && (
                <div className="px-4 pb-3 pt-2.5 border-t border-[#b48bd0]/15 flex-shrink-0">
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 bg-white/40 backdrop-blur-sm border border-[#b48bd0]/20 rounded-2xl flex items-center justify-center text-[#b48bd0] text-sm">
              Selectează o tranzacție din lista din stânga
            </div>
          )}
        </div>
      </div>

      {/* Modal Formular */}
      {showForm && (
        <div className="fixed inset-0 bg-[#352a6e]/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white/90 backdrop-blur-xl border border-[#b48bd0]/30 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b border-[#b48bd0]/20 flex items-center justify-between">
              <h3 className="text-[15px] font-semibold text-[#352a6e]">{editMode ? 'Editare tranzacție' : 'Tranzacție nouă'}</h3>
              <button onClick={closeForm} className="text-[#b48bd0] hover:text-[#352a6e] transition-colors"><X size={18} /></button>
            </div>
            <form onSubmit={editMode ? handleUpdate : handleCreate} className="p-5 space-y-4">

              {!editMode && (
                <div className="p-4 bg-[#f7f1f8] border border-dashed border-[#b48bd0]/40 rounded-xl text-center">
                  <p className="text-[12px] text-[#352a6e] mb-2 font-medium">
                    {loadingScan ? 'Se procesează documentul...' : 'Completare automată inteligentă'}
                  </p>
                  <label className={`inline-flex items-center gap-2 px-4 py-2 bg-[#5b4ad1] text-white rounded-xl text-[12px] font-medium shadow-sm hover:bg-[#6a63d4] cursor-pointer transition-all ${loadingScan ? 'opacity-50 pointer-events-none' : ''}`}>
                    <Camera size={14} />
                    <span>{loadingScan ? 'Procesare OCR în curs...' : 'Scanează poză / Factură PDF'}</span>
                    <input type="file" accept="image/*,application/pdf" className="hidden" onChange={handleInvoiceScan} disabled={loadingScan} />
                  </label>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-semibold text-[#b48bd0] uppercase tracking-wider mb-1.5">Tip</label>
                  <select className={selectCls} value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                    <option>Cheltuială</option><option>Venit</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-[#b48bd0] uppercase tracking-wider mb-1.5">Tip document</label>
                  <select className={selectCls} value={isCustomDocType ? 'Altele' : form.documentType} onChange={e => handleSelectChange('documentType', e.target.value, DOCUMENT_TYPES)}>
                    {DOCUMENT_TYPES.map(o => <option key={o}>{o}</option>)}
                    <option>Altele</option>
                  </select>
                  {isCustomDocType && (
                    <input autoFocus className={inputCls + ' mt-1.5'} placeholder="Specifică tipul documentului..." value={customFields.documentType} onChange={e => handleCustomChange('documentType', e.target.value)} />
                  )}
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-[#b48bd0] uppercase tracking-wider mb-1.5">Grup / Categorie</label>
                <select className={selectCls} value={isCustomCategory ? 'Altele' : form.category} onChange={e => handleSelectChange('category', e.target.value, CATEGORIES)}>
                  {CATEGORIES.map(o => <option key={o}>{o}</option>)}
                  <option>Altele</option>
                </select>
                {isCustomCategory && (
                  <input autoFocus className={inputCls + ' mt-1.5'} placeholder="Specifică categoria..." value={customFields.category} onChange={e => handleCustomChange('category', e.target.value)} />
                )}
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-[#b48bd0] uppercase tracking-wider mb-1.5">Furnizor / Client</label>
                <input required className={inputCls} value={form.supplier} onChange={e => setForm(f => ({ ...f, supplier: e.target.value }))} placeholder="Ex: Electro SRL" />
              </div>

              {/* MODIFICAT: Câmpul CUI cu validare în timp real, auto-uppercase și eroare vizuală */}
              <div>
                <label className="block text-[10px] font-semibold text-[#b48bd0] uppercase tracking-wider mb-1.5">CUI</label>
                <input 
                  className={`${inputCls} ${validationErrors.cui ? 'border-red-500 focus:border-red-500 bg-red-50/30' : ''}`} 
                  value={form.cui} 
                  maxLength={12} 
                  onChange={e => {
                    const val = e.target.value.toUpperCase().replace(/\s/g, '');
                    setForm(f => ({ ...f, cui: val }));
                    validateFields('cui', val);
                  }} 
                  placeholder="Ex: RO12345678" 
                />
                {validationErrors.cui && <p className="text-red-500 text-[11px] mt-1 font-medium">{validationErrors.cui}</p>}
              </div>

              {/* MODIFICAT: Limita maximă pe numărul de document */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-semibold text-[#b48bd0] uppercase tracking-wider mb-1.5">Număr document</label>
                  <input 
                    className={inputCls} 
                    value={form.documentNumber} 
                    maxLength={30} 
                    onChange={e => setForm(f => ({ ...f, documentNumber: e.target.value }))} 
                    placeholder="Ex: Seria FT nr. 42" 
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-[#b48bd0] uppercase tracking-wider mb-1.5">Data emitere</label>
                  <input type="date" className={inputCls} value={form.issueDate} onChange={e => setForm(f => ({ ...f, issueDate: e.target.value }))} />
                </div>
              </div>

              {/* MODIFICAT: Câmpul Cont IBAN cu validare pe 24 de caractere și auto-uppercase */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-semibold text-[#b48bd0] uppercase tracking-wider mb-1.5">Cont IBAN</label>
                  <input 
                    className={`${inputCls} ${validationErrors.bankAccount ? 'border-red-500 focus:border-red-500 bg-red-50/30' : ''}`} 
                    value={form.bankAccount} 
                    maxLength={24} 
                    onChange={e => {
                      const val = e.target.value.toUpperCase().replace(/\s/g, '');
                      setForm(f => ({ ...f, bankAccount: val }));
                      validateFields('bankAccount', val);
                    }} 
                    placeholder="RO00BTRL..." 
                  />
                  {validationErrors.bankAccount && <p className="text-red-500 text-[11px] mt-1 font-medium">{validationErrors.bankAccount}</p>}
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-[#b48bd0] uppercase tracking-wider mb-1.5">Status plată</label>
                  <select className={selectCls} value={form.paymentStatus} onChange={e => setForm(f => ({ ...f, paymentStatus: e.target.value }))}>
                    <option>Neplătit</option>
                    <option>Plătit</option>
                    <option>În curs</option>
                  </select>
                </div>
              </div>

              {form.category === 'Produse' && (
                <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                  <div>
                    <label className="block text-[10px] font-semibold text-emerald-700 uppercase tracking-wider mb-1.5">Produs din stoc</label>
                    <select className="w-full px-3 py-2 text-sm border border-emerald-200 rounded-xl outline-none text-[#352a6e] bg-white"
                      value={form.stockItem} onChange={e => setForm(f => ({ ...f, stockItem: e.target.value }))}>
                      <option value="">Selectează</option>
                      {stocks.map(s => <option key={s._id} value={s._id}>{s.name} (stoc: {s.quantity})</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-emerald-700 uppercase tracking-wider mb-1.5">Cantitate</label>
                    <input type="number" min="1" className="w-full px-3 py-2 text-sm border border-emerald-200 rounded-xl outline-none text-[#352a6e] bg-white"
                      value={form.stockQuantityDelta} onChange={e => setForm(f => ({ ...f, stockQuantityDelta: e.target.value }))} placeholder="Ex: 4" />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-semibold text-[#b48bd0] uppercase tracking-wider mb-1.5">Sumă netă (RON)</label>
                  <input required type="number" step="0.01" min="0" className={inputCls} value={form.netAmount} onChange={e => handleNetChange(e.target.value)} placeholder="0.00" />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-[#b48bd0] uppercase tracking-wider mb-1.5">TVA (%)</label>
                  <input type="number" min="0" max="100" className={inputCls} value={form.tva}
                    onChange={e => {
                      const rate = parseFloat(e.target.value) || 0
                      const net = parseFloat(form.netAmount) || 0
                      setForm(f => ({ ...f, tva: e.target.value, totalAmount: (net + net * rate / 100).toFixed(2) }))
                    }} />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-[#b48bd0] uppercase tracking-wider mb-1.5">Total (RON)</label>
                  <input readOnly type="number" className={inputCls + ' bg-[#f7f1f8]'} value={form.totalAmount} placeholder="0.00" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-semibold text-[#b48bd0] uppercase tracking-wider mb-1.5">Scadență aprobare</label>
                  <input type="date" className={inputCls} value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-[#b48bd0] uppercase tracking-wider mb-1.5">Metodă plată</label>
                  <select className={selectCls} value={isCustomPayment ? 'Altele' : form.paymentMethod} onChange={e => handleSelectChange('paymentMethod', e.target.value, PAYMENT_METHODS)}>
                    {PAYMENT_METHODS.map(o => <option key={o}>{o}</option>)}
                    <option>Altele</option>
                  </select>
                  {isCustomPayment && (
                    <input autoFocus className={inputCls + ' mt-1.5'} placeholder="Specifică metoda de plată..." value={customFields.paymentMethod} onChange={e => handleCustomChange('paymentMethod', e.target.value)} />
                  )}
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-[#b48bd0] uppercase tracking-wider mb-1.5">Notă (opțional)</label>
                <textarea rows={2} className={inputCls + ' resize-none'} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Detalii suplimentare..." />
              </div>

              {/* MODIFICAT: Dezactivarea butonului de trimitere dacă există erori de validare */}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={closeForm}
                  className="flex-1 py-2.5 rounded-xl text-[13px] font-medium bg-white/60 border border-[#b48bd0]/30 text-[#b48bd0] hover:text-[#352a6e] transition-all duration-200">
                  Anulează
                </button>
                <button 
                  type="submit" 
                  disabled={actionLoading || loadingScan || !!validationErrors.cui || !!validationErrors.bankAccount}
                  className="flex-1 py-2.5 rounded-xl text-[13px] font-medium text-white disabled:opacity-40 disabled:cursor-not-allowed bg-[#5b4ad1] hover:bg-[#6a63d4] shadow-md shadow-[#5b4ad1]/25 transition-all duration-200"
                >
                  {actionLoading ? 'Se salvează...' : editMode ? 'Salvează modificările' : 'Înregistrează'}
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