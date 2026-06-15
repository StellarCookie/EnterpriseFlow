import { useNavigate } from 'react-router-dom'
import { Wallet, TrendingUp, TrendingDown, Clock, AlertTriangle, Check, AlertCircle, XCircle } from 'lucide-react'
import Sidebar from '../components/Sidebar'
import Navbar from '../components/Navbar'
import DashboardCard from '../components/DashboardCard'
import { ToastContainer } from '../components/Toast'
import { useDashboard } from '../hooks/useDashboard'
import { useStocks } from '../hooks/useStocks'
import { useTransactions } from '../hooks/useTransactions'
import { useAuth } from '../hooks/useAuth'
import { useToast } from '../hooks/useToast'
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts'

const formatRON = (n) =>
  new Intl.NumberFormat('ro-RO', { minimumFractionDigits: 0 }).format(Math.round(n || 0)) + ' RON'

const PIE_COLORS = ['#00a090', '#00c9b1', '#5dd8c8', '#b8e8e3']

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-[#d8edf0] rounded-xl shadow-lg p-3 text-xs">
      <p className="font-semibold text-[#0d2b32] mb-1">{label}</p>
      {payload.map(p => (
        <div key={p.dataKey} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-[#5a7a85]">{p.name}: </span>
          <span className="font-semibold">{formatRON(p.value)}</span>
        </div>
      ))}
    </div>
  )
}

export default function Dashboard() {
  const { stats, loading: statsLoading, downloadReport } = useDashboard()
  const { stocks, lowStockCount } = useStocks()
  const { transactions: recentTxns } = useTransactions()
  const { isManager } = useAuth()
  const { toasts, success, error: toastError, removeToast } = useToast()
  const navigate = useNavigate()

  const handleDownload = async () => {
    try {
      await downloadReport()
      success('Raport descÄrcat cu succes!')
    } catch {
      toastError('Eroare la generarea raportului.')
    }
  }

  const pendingCount = stats.pendingCount || 0
  const pieData = stats.categoryBreakdown?.map(c => ({
    name: c._id, value: Math.round(c.total)
  })) || []

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'transparent', position: 'relative' }}>

      <div style={{ position: 'relative', zIndex: 1, flexShrink: 0 }}>
        <Sidebar pendingCount={pendingCount} />
      </div>

      <div className="flex-1 flex flex-col overflow-hidden" style={{ position: 'relative', zIndex: 1 }}>
        <Navbar
          title="Tablou de bord"
          pendingCount={pendingCount}
          onDownload={isManager ? handleDownload : undefined}
        />
        <main className="flex-1 overflow-y-auto px-7 pb-6 space-y-4">

          {/* Low stock alert */}
          {lowStockCount > 0 && (
            <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-700 mt-4">
              <AlertTriangle size={15} />
              <span><strong>{lowStockCount} produse</strong> au stoc redus sau critic. Verificați inventarul.</span>
              <button onClick={() => navigate('/stocuri')} className="ml-auto text-amber-700 font-semibold underline text-xs">
                Verifică
              </button>
            </div>
          )}

          {/* KPI Cards */}
          <div className="grid grid-cols-4 gap-4 mt-4">
            <DashboardCard
              label="Sold curent"
              value={formatRON(stats.balance)}
              change="+12,4% față de luna trecută"
              color="teal-dark"
              icon={Wallet}
              miniBar
            />
            <DashboardCard
              label="Încasări mai"
              value={formatRON(stats.monthlyIncome)}
              change="+8,1% față de aprilie"
              color="glass"
              icon={TrendingUp}
              tag="Obiectiv atins"
            />
            <DashboardCard
              label="Cheltuieli mai"
              value={formatRON(stats.monthlyExpenses)}
              change="+3,2% față de aprilie"
              changeType="warn"
              color="white-amber"
              icon={TrendingDown}
              progress={64}
              progressLabel="Din buget lunar"
            />
            <DashboardCard
              label="Documente în așteptare"
              value={`${pendingCount} doc.`}
              change={pendingCount > 0 ? 'Necesită aprobare urgentă' : 'Totul aprobat'}
              changeType={pendingCount > 0 ? 'down' : 'up'}
              color="glass"
              icon={Clock}
              tag="Manager notificat"
            />
          </div>

          {/* Charts - Manager only */}
          {isManager && (
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white rounded-2xl border border-[#d8edf0] p-5 transition-transform duration-200 ease-out hover:-translate-y-1 hover:shadow-xl">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-[13.5px] font-semibold text-[#0d2b32] flex items-center gap-2">
                    <span className="w-0.5 h-3.5 bg-gradient-to-b from-[#00c9b1] to-[#0096a0] rounded-sm inline-block" />
                    Flux financiar 2026
                  </h3>
                  <div className="flex gap-1 bg-[#f0f8fa] rounded-lg p-1">
                    {['Lunar', 'Trim.', 'Anual'].map(t => (
                      <button key={t} className={`text-[11px] px-2.5 py-1 rounded-md transition-colors ${t === 'Lunar' ? 'bg-white text-[#0d2b32] font-medium shadow-sm' : 'text-[#8ab0b8]'}`}>{t}</button>
                    ))}
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={155}>
                  <BarChart data={stats.monthlyBreakdown || []} barSize={14} barGap={3}>
                    <CartesianGrid vertical={false} stroke="#dff0f3" />
                    <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#8ab0b8' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: '#8ab0b8' }} axisLine={false} tickLine={false}
                      tickFormatter={v => v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="income" name="Încasări" fill="#00a090" radius={[4, 4, 0, 0]} fillOpacity={0.9} />
                    <Bar dataKey="expenses" name="Cheltuieli" fill="#b8e8e3" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white rounded-2xl border border-[#d8edf0] p-5 transition-transform duration-200 ease-out hover:-translate-y-1 hover:shadow-xl">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-[13.5px] font-semibold text-[#0d2b32] flex items-center gap-2">
                    <span className="w-0.5 h-3.5 bg-gradient-to-b from-[#00c9b1] to-[#0096a0] rounded-sm inline-block" />
                    Evoluția soldului 2026
                  </h3>
                  <span className="text-[11px] text-[#8ab0b8]">luna Mai</span>
                </div>
                <ResponsiveContainer width="100%" height={155}>
                  <LineChart data={stats.monthlyBreakdown?.map((m, i, arr) => ({
                    ...m,
                    balance: arr.slice(0, i + 1).reduce((acc, cur) => acc + (cur.income - cur.expenses), 0)
                  })) || []}>
                    <CartesianGrid vertical={false} stroke="#dff0f3" />
                    <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#8ab0b8' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: '#8ab0b8' }} axisLine={false} tickLine={false}
                      tickFormatter={v => (v / 1000).toFixed(0) + 'k'} />
                    <Tooltip content={<CustomTooltip />} />
                    <Line type="monotone" dataKey="balance" name="Sold" stroke="#00a090" strokeWidth={2.3}
                      dot={{ fill: '#00a090', r: 4, strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white rounded-2xl border border-[#d8edf0] p-5 transition-transform duration-200 ease-out hover:-translate-y-1 hover:shadow-xl">
                <h3 className="text-[13.5px] font-semibold text-[#0d2b32] flex items-center gap-2 mb-3">
                  <span className="w-0.5 h-3.5 bg-gradient-to-b from-[#00c9b1] to-[#0096a0] rounded-sm inline-block" />
                  Structura cheltuielilor
                </h3>
                {pieData.length > 0 ? (
                  <>
                    <div className="flex justify-center my-3">
                      <ResponsiveContainer width={115} height={115}>
                        <PieChart>
                          <Pie data={pieData} cx="50%" cy="50%" innerRadius={34} outerRadius={54}
                            dataKey="value" paddingAngle={2}>
                            {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                          </Pie>
                          <Tooltip formatter={v => formatRON(v)} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="space-y-1.5">
                      {pieData.map((item, i) => (
                        <div key={item.name} className="flex items-center gap-2 text-[12px]">
                          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                          <span className="text-[#5a7a85] flex-1">{item.name}</span>
                          <span className="font-semibold text-[#0d2b32]">{formatRON(item.value)}</span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-[#8ab0b8] text-center py-8">Nicio cheltuială înregistrată</p>
                )}
              </div>
            </div>
          )}

          {/* Bottom row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl border border-[#d8edf0] p-5 transition-transform duration-200 ease-out hover:-translate-y-1 hover:shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[13.5px] font-semibold text-[#0d2b32] flex items-center gap-2">
                  <span className="w-0.5 h-3.5 bg-gradient-to-b from-[#00c9b1] to-[#0096a0] rounded-sm inline-block" />
                  Tranzacții recente
                </h3>
                <button onClick={() => navigate('/tranzactii')} className="text-[11.5px] text-[#00a090] font-medium hover:underline">
                  Vezi toate
                </button>
              </div>
              <div className="divide-y divide-[#edf5f7]">
                {recentTxns.slice(0, 4).map(txn => {
                  const isIn = txn.type === 'Venit'
                  return (
                    <div key={txn._id} className="flex items-center gap-3 py-2.5">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${isIn ? 'bg-[#e0f7f5] text-[#00796b]' : txn.status === 'ĂŽn aČ™teptare' ? 'bg-[#faeeda] text-[#854f0b]' : 'bg-[#fcebeb] text-[#a32d2d]'}`}>
                        {isIn ? <TrendingUp size={14} /> : txn.status === 'ĂŽn aČ™teptare' ? <Clock size={14} /> : <TrendingDown size={14} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[12.5px] font-medium text-[#0d2b32] truncate">{txn.supplier}</p>
                        <p className="text-[11px] text-[#8ab0b8]">{txn.reference}</p>
                      </div>
                      <div className="text-right">
                        <p className={`text-[13px] font-semibold ${isIn ? 'text-[#0f6e56]' : 'text-[#a32d2d]'}`}>
                          {isIn ? '+' : '-'}{formatRON(txn.totalAmount)}
                        </p>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${txn.status === 'Aprobat' ? 'bg-[#e0f7f5] text-[#0f6e56]' : txn.status === 'Respins' ? 'bg-[#fcebeb] text-[#a32d2d]' : 'bg-[#faeeda] text-[#854f0b]'}`}>
                          {txn.status}
                        </span>
                      </div>
                    </div>
                  )
                })}
                {recentTxns.length === 0 && (
                  <p className="text-sm text-[#8ab0b8] text-center py-6">Nicio tranzacție înregistrată</p>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <div className="bg-white rounded-2xl border border-[#d8edf0] p-5 flex-1 transition-transform duration-200 ease-out hover:-translate-y-1 hover:shadow-xl">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-[13.5px] font-semibold text-[#0d2b32] flex items-center gap-2">
                    <span className="w-0.5 h-3.5 bg-gradient-to-b from-[#00c9b1] to-[#0096a0] rounded-sm inline-block" />
                    Evidența stocuri
                  </h3>
                  <button onClick={() => navigate('/stocuri')} className="text-[11.5px] text-[#00a090] font-medium hover:underline">
                    Gestionează
                  </button>
                </div>
                <div className="space-y-2">
                  {stocks.slice(0, 4).map(s => (
                    <div key={s._id} className="flex items-center gap-2">
                      <p className="text-[12px] font-medium text-[#0d2b32] flex-1 truncate">{s.name}</p>
                      <span className="text-[11px] text-[#8ab0b8] text-right">{s.quantity} {s.unit}</span>
                      {s.status === 'OK' ? <Check size={14} className="text-[#00c9b1]" />
                        : s.status === 'Redus' ? <AlertCircle size={14} className="text-[#ef9f27]" />
                        : <XCircle size={14} className="text-[#e24b4a]" />}
                    </div>
                  ))}
                  {stocks.length === 0 && <p className="text-sm text-[#8ab0b8] text-center py-2">Niciun produs</p>}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  )
}
