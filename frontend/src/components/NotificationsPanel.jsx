import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, Clock, AlertTriangle, CheckCircle2 } from 'lucide-react'

const formatRON = (n) =>
  new Intl.NumberFormat('ro-RO', { minimumFractionDigits: 2 }).format(n || 0) + ' RON'

const formatDate = (d) =>
  new Date(d).toLocaleDateString('ro-RO', { day: 'numeric', month: 'short' })

/* Section accent colors come from the app's palette, matching the
   accents used in the sidebar (sapphire / ballet slipper). */
const SECTION_COLORS = {
  approvals: '#72B0AB',
  overdue: '#FE9179',
}

function Section({ title, icon: Icon, color, children }) {
  return (
    <div className="py-1.5 border-b border-slate-100 last:border-b-0">
      <p
        className="px-4 pb-1 pt-1.5 text-[10px] font-semibold uppercase tracking-wider flex items-center gap-1.5"
        style={{ color }}
      >
        <Icon size={11} />
        {title}
      </p>
      {children}
    </div>
  )
}

function Item({ onClick, title, subtitle, value, valueColor }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-2.5 px-4 py-2 text-left hover:bg-slate-50 transition-colors"
    >
      <span className="flex-1 min-w-0">
        <span className="block text-xs font-medium text-slate-700 truncate">{title}</span>
        <span className="block text-[10px] text-slate-400">{subtitle}</span>
      </span>
      <span className="text-xs font-semibold flex-shrink-0" style={{ color: valueColor || '#5a7a85' }}>
        {value}
      </span>
    </button>
  )
}

function More({ count, onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full px-4 py-2 text-left text-[11px] font-semibold text-[#72B0AB] hover:bg-slate-50 transition-colors"
    >
      + încă {count} {count === 1 ? 'rezultat' : 'rezultate'}
    </button>
  )
}

export default function NotificationsPanel({ transactions = [], isManager = false }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    const onClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  const now = Date.now()

  const pendingApprovals = transactions.filter(t => t.status === 'În așteptare')
  const overdue = transactions.filter(t =>
    t.status === 'În așteptare' && t.dueDate && new Date(t.dueDate).getTime() < now
  )

  const attentionIds = new Set([
    ...(isManager ? pendingApprovals.map(t => t._id) : []),
    ...overdue.map(t => t._id),
  ])
  const total = attentionIds.size

  const goTo = (path) => {
    setOpen(false)
    navigate(path)
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        className="w-9 h-9 bg-white border border-slate-200 rounded-lg flex items-center justify-center shadow-sm hover:bg-slate-50 transition-colors relative"
      >
        <Bell size={15} className="text-slate-500" />
        {total > 0 && (
          <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-[#FE9179] text-white text-[10px] font-bold border-2 border-white">
            {total > 9 ? '9+' : total}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden z-50 max-h-[28rem] overflow-y-auto">
          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white">
            <p className="text-sm font-semibold text-[#0d2b32]">Notificări</p>
            {total > 0 && <span className="text-[11px] text-slate-400">{total} active</span>}
          </div>

          {total === 0 ? (
            <div className="px-4 py-8 text-center">
              <CheckCircle2 size={22} className="text-[#72B0AB] mx-auto mb-2" />
              <p className="text-xs text-slate-400">Totul e la zi. Nicio notificare nouă.</p>
            </div>
          ) : (
            <>
              {isManager && pendingApprovals.length > 0 && (
                <Section title="Aprobări în așteptare" icon={Clock} color={SECTION_COLORS.approvals}>
                  {pendingApprovals.slice(0, 4).map(t => (
                    <Item
                      key={t._id}
                      onClick={() => goTo(`/tranzactii?q=${encodeURIComponent(t.reference)}`)}
                      title={t.supplier}
                      subtitle={t.reference}
                      value={formatRON(t.totalAmount)}
                      valueColor={SECTION_COLORS.approvals}
                    />
                  ))}
                  {pendingApprovals.length > 4 && (
                    <More count={pendingApprovals.length - 4} onClick={() => goTo('/tranzactii')} />
                  )}
                </Section>
              )}

              {overdue.length > 0 && (
                <Section title="Scadențe depășite" icon={AlertTriangle} color={SECTION_COLORS.overdue}>
                  {overdue.slice(0, 4).map(t => (
                    <Item
                      key={t._id}
                      onClick={() => goTo(`/tranzactii?q=${encodeURIComponent(t.reference)}`)}
                      title={t.supplier}
                      subtitle={`Scadent ${formatDate(t.dueDate)} · ${t.reference}`}
                      value={formatRON(t.totalAmount)}
                      valueColor={SECTION_COLORS.overdue}
                    />
                  ))}
                  {overdue.length > 4 && (
                    <More count={overdue.length - 4} onClick={() => goTo('/tranzactii')} />
                  )}
                </Section>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
