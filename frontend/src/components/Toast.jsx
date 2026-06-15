import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react'

const STYLES = {
  success: {
    bg: 'bg-emerald-50 border-emerald-200',
    text: 'text-emerald-800',
    icon: <CheckCircle size={16} className="text-emerald-600 flex-shrink-0" />,
  },
  error: {
    bg: 'bg-red-50 border-red-200',
    text: 'text-red-800',
    icon: <XCircle size={16} className="text-red-600 flex-shrink-0" />,
  },
  warning: {
    bg: 'bg-amber-50 border-amber-200',
    text: 'text-amber-800',
    icon: <AlertCircle size={16} className="text-amber-600 flex-shrink-0" />,
  },
  info: {
    bg: 'bg-sky-50 border-sky-200',
    text: 'text-sky-800',
    icon: <Info size={16} className="text-sky-600 flex-shrink-0" />,
  },
}

export function Toast({ toast, onRemove }) {
  const s = STYLES[toast.type] || STYLES.info
  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium shadow-lg ${s.bg} ${s.text} max-w-sm animate-fade-in`}>
      {s.icon}
      <span className="flex-1">{toast.message}</span>
      <button onClick={() => onRemove(toast.id)} className="opacity-50 hover:opacity-80 transition-opacity ml-1">
        <X size={14} />
      </button>
    </div>
  )
}

export function ToastContainer({ toasts, removeToast }) {
  if (toasts.length === 0) return null
  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2">
      {toasts.map(t => (
        <Toast key={t.id} toast={t} onRemove={removeToast} />
      ))}
    </div>
  )
}
