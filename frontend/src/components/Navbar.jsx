import { useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Receipt, Package } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useTransactions } from '../hooks/useTransactions'
import { useStocks } from '../hooks/useStocks'
import NotificationsPanel from './NotificationsPanel'

const formatRON = (n) =>
  new Intl.NumberFormat('ro-RO', { minimumFractionDigits: 2 }).format(n || 0) + ' RON'

export default function Navbar({ title, subtitle, pendingCount = 0, onDownload, showSearch = true }) {
  const { isManager } = useAuth()
  const navigate = useNavigate()
  const { transactions } = useTransactions()
  const { stocks } = useStocks()

  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const blurTimeout = useRef(null)

  const today = new Date().toLocaleDateString('ro-RO', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  })
  const todayCapitalized = today.charAt(0).toUpperCase() + today.slice(1)

  const { matchedTxns, matchedStocks } = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (q.length < 2) return { matchedTxns: [], matchedStocks: [] }
    return {
      matchedTxns: transactions.filter(t =>
        [t.reference, t.supplier, t.documentType, t.category].some(f => f?.toLowerCase().includes(q))
      ).slice(0, 5),
      matchedStocks: stocks.filter(s =>
        [s.name, s.sku, s.category].some(f => f?.toLowerCase().includes(q))
      ).slice(0, 5),
    }
  }, [query, transactions, stocks])

  const hasResults = matchedTxns.length > 0 || matchedStocks.length > 0
  const showDropdown = open && query.trim().length >= 2

  const goToTransaction = (txn) => {
    setQuery('')
    setOpen(false)
    navigate(`/tranzactii?q=${encodeURIComponent(txn.reference)}`)
  }

  const goToStock = (stock) => {
    setQuery('')
    setOpen(false)
    navigate(`/stocuri?q=${encodeURIComponent(stock.name)}`)
  }

  const handleBlur = () => {
    blurTimeout.current = setTimeout(() => setOpen(false), 150)
  }

  const handleFocus = () => {
    if (blurTimeout.current) clearTimeout(blurTimeout.current)
    setOpen(true)
  }

  return (
    <header className="flex items-center justify-between px-7 py-5 flex-shrink-0">
      <div>
        <h1 className="text-2xl font-semibold text-ink tracking-tight font-serif">
          {title}
        </h1>
        <p className="text-xs text-blueviolet/70 mt-0.5 font-medium">
          {subtitle || todayCapitalized}
        </p>
      </div>

      <div className="flex items-center gap-3">
        {showSearch && (
        <div className="relative">
          <div className="flex items-center gap-2 bg-white/50 backdrop-blur-xl border border-lavender/30 rounded-xl px-3 py-2 shadow-lg shadow-lavender/10 focus-within:border-periwinkle/70 focus-within:bg-white/70 transition-all duration-200">
            <Search size={13} className="text-blueviolet/70" />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              onFocus={handleFocus}
              onBlur={handleBlur}
              placeholder="Caută tranzacții, produse..."
              className="text-sm text-ink bg-transparent outline-none w-44 placeholder-lavender/60"
            />
          </div>

          {showDropdown && (
            <div className="absolute right-0 mt-2 w-72 bg-white/70 backdrop-blur-xl border border-lavender/30 rounded-2xl shadow-xl shadow-lavender/20 overflow-hidden z-50">
              {!hasResults && (
                <p className="px-4 py-3 text-xs text-blueviolet/70">Niciun rezultat pentru „{query}”</p>
              )}

              {matchedTxns.length > 0 && (
                <div className="py-1.5">
                  <p className="px-4 pb-1 text-[10px] font-semibold text-blueviolet/60 uppercase tracking-wider">Tranzacții</p>
                  {matchedTxns.map(txn => (
                    <button key={txn._id} onClick={() => goToTransaction(txn)}
                      className="w-full flex items-center gap-2.5 px-4 py-2 text-left hover:bg-lavender/15 transition-colors">
                      <Receipt size={13} className="text-blueviolet/70 flex-shrink-0" />
                      <span className="flex-1 min-w-0">
                        <span className="block text-xs font-medium text-ink truncate">{txn.supplier}</span>
                        <span className="block text-[10px] text-blueviolet/60 font-mono">{txn.reference}</span>
                      </span>
                      <span className="text-xs font-semibold text-periwinkle flex-shrink-0">{formatRON(txn.totalAmount)}</span>
                    </button>
                  ))}
                </div>
              )}

              {matchedStocks.length > 0 && (
                <div className="py-1.5 border-t border-lavender/20">
                  <p className="px-4 pb-1 text-[10px] font-semibold text-blueviolet/60 uppercase tracking-wider">Produse</p>
                  {matchedStocks.map(stock => (
                    <button key={stock._id} onClick={() => goToStock(stock)}
                      className="w-full flex items-center gap-2.5 px-4 py-2 text-left hover:bg-lavender/15 transition-colors">
                      <Package size={13} className="text-blueviolet/70 flex-shrink-0" />
                      <span className="flex-1 min-w-0">
                        <span className="block text-xs font-medium text-ink truncate">{stock.name}</span>
                        <span className="block text-[10px] text-blueviolet/60 font-mono">{stock.sku || '—'}</span>
                      </span>
                      <span className="text-xs font-semibold text-periwinkle flex-shrink-0">{stock.quantity} {stock.unit}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
        )}

              {matchedTxns.length > 0 && (
                <div className="py-1.5">
                  <p className="px-4 pb-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">TranzacČ›ii</p>
                  {matchedTxns.map(txn => (
                    <button key={txn._id} onClick={() => goToTransaction(txn)}
                      className="w-full flex items-center gap-2.5 px-4 py-2 text-left hover:bg-slate-50 transition-colors">
                      <Receipt size={13} className="text-slate-400 flex-shrink-0" />
                      <span className="flex-1 min-w-0">
                        <span className="block text-xs font-medium text-slate-700 truncate">{txn.supplier}</span>
                        <span className="block text-[10px] text-slate-400 font-mono">{txn.reference}</span>
                      </span>
                      <span className="text-xs font-semibold text-slate-500 flex-shrink-0">{formatRON(txn.totalAmount)}</span>
                    </button>
                  ))}
                </div>
              )}

              {matchedStocks.length > 0 && (
                <div className="py-1.5 border-t border-slate-100">
                  <p className="px-4 pb-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Produse</p>
                  {matchedStocks.map(stock => (
                    <button key={stock._id} onClick={() => goToStock(stock)}
                      className="w-full flex items-center gap-2.5 px-4 py-2 text-left hover:bg-slate-50 transition-colors">
                      <Package size={13} className="text-slate-400 flex-shrink-0" />
                      <span className="flex-1 min-w-0">
                        <span className="block text-xs font-medium text-slate-700 truncate">{stock.name}</span>
                        <span className="block text-[10px] text-slate-400 font-mono">{stock.sku || 'â€”'}</span>
                      </span>
                      <span className="text-xs font-semibold text-slate-500 flex-shrink-0">{stock.quantity} {stock.unit}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
        
        

        <NotificationsPanel transactions={transactions} isManager={isManager} />

    
    </header>
  )
}
