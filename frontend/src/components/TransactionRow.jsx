import { ArrowDownLeft, ArrowUpRight, Clock } from 'lucide-react'

const formatRON = (n) =>
  new Intl.NumberFormat('ro-RO', { minimumFractionDigits: 0 }).format(n) + ' RON'

const formatDate = (d) => {
  if (!d) return '-'
  const date = new Date(d)
  return date.toLocaleDateString('ro-RO', { day: '2-digit', month: 'short', year: 'numeric' })
}

const StatusBadge = ({ status }) => {
  if (status === 'Aprobat') return <span className="status-approved">Aprobat</span>
  if (status === 'Respins') return <span className="status-rejected">Respins</span>
  return <span className="status-pending">În așteptare</span>
}

export default function TransactionRow({ txn, onClick, selected }) {
  const isIncome = txn.type === 'Venit'
  const isPending = txn.status === 'În așteptare'

  return (
    <div
      onClick={() => onClick?.(txn)}
      className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all duration-150 border
        ${selected
          ? 'bg-brand-primary/10 border-brand-primary/30 shadow-sm'
          : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm'
        }`}
    >
      {/* Icon */}
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0
        ${isIncome ? 'bg-emerald-50 text-emerald-600' : isPending ? 'bg-amber-50 text-amber-600' : 'bg-red-50 text-red-600'}`}>
        {isIncome
          ? <ArrowDownLeft size={16} />
          : isPending
            ? <Clock size={16} />
            : <ArrowUpRight size={16} />
        }
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-medium text-navy truncate">{txn.supplier}</p>
        <p className="text-[11px] text-slate-400">{txn.reference} · {formatDate(txn.createdAt)}</p>
      </div>

      {/* Amount & Status */}
      <div className="text-right flex-shrink-0">
        <p className={`text-[13px] font-semibold ${isIncome ? 'text-emerald-600' : 'text-red-600'}`}>
          {isIncome ? '+' : '-'}{formatRON(txn.totalAmount)}
        </p>
        <StatusBadge status={txn.status} />
      </div>
    </div>
  )
}
