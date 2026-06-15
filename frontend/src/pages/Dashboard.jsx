import { useState, useEffect } from 'react' // CORECTAT: useState este acum definit corect aici
import { useNavigate } from 'react-router-dom'
import { Wallet, TrendingUp, TrendingDown, Clock, AlertTriangle, Check, AlertCircle, XCircle, FileText, Download } from 'lucide-react'
import { pdf } from '@react-pdf/renderer'
import Sidebar from '../components/Sidebar'
import Navbar from '../components/Navbar'
import DashboardCard from '../components/DashboardCard'
import ReportPDF from '../components/ReportPDF'
import { ToastContainer } from '../components/Toast'
import { useDashboard } from '../hooks/useDashboard'
import { useStocks } from '../hooks/useStocks'
import { useTransactions } from '../hooks/useTransactions'
import { useAuth } from '../hooks/useAuth'
import { useToast } from '../hooks/useToast'
import api from '../api' // Instanța ta globală de axios pentru asistentul AI
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts'

const formatRON = (n) =>
  new Intl.NumberFormat('ro-RO', { minimumFractionDigits: 0 }).format(Math.round(n || 0)) + ' RON'

const PIE_COLORS = ['#00a090', '#00c9b1', '#5dd8c8', '#b8e8e3']

const MONTHS = [
  'Ianuarie', 'Februarie', 'Martie', 'Aprilie', 'Mai', 'Iunie',
  'Iulie', 'August', 'Septembrie', 'Octombrie', 'Noiembrie', 'Decembrie'
]

// Date simulate pentru orele logate săptămânal de angajat
const MOCK_LOGGED_TIME = [
  { week: 'Săpt 22', ore: 40 },
  { week: 'Săpt 23', ore: 42 },
  { week: 'Săpt 24', ore: 38 },
  { week: 'Săpt 25', ore: 45 },
]

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-[#d8edf0] rounded-xl shadow-lg p-3 text-xs">
      <p className="font-semibold text-[#0d2b32] mb-1">{label}</p>
      {payload.map(p => (
        <div key={p.dataKey} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-[#5a7a85]">{p.name}: </span>
          <span className="font-semibold">{p.name === 'Ore Lucrate' ? `${p.value} ore` : formatRON(p.value)}</span>
        </div>
      ))}
    </div>
  )
}

export default function Dashboard() {
  const { stats, loading: statsLoading, downloadReport } = useDashboard()
  const { stocks, lowStockCount } = useStocks()
  const { transactions: recentTxns } = useTransactions()
  const { isManager, user } = useAuth()
  const { toasts, success, error: toastError, removeToast } = useToast()
  const navigate = useNavigate()

  // Stări pentru asistentul AI virtual
  const [aiQuestion, setAiQuestion] = useState('')
  const [aiReply, setAiReply] = useState(
    `Salut! Sunt asistentul tău digital. Îmi poți pune întrebări despre stocuri, despre statusul documentelor tale sau cum să folosești platforma EnterpriseFlow.`
  )
  const [loadingAi, setLoadingAi] = useState(false)

  const handleDownload = async () => {
    try {
      await downloadReport()
      success('Raport descărcat cu succes!')
    } catch {
      toastError('Eroare la generarea raportului.')
    }
  }

  const handleAiSubmit = async (e) => {
    if (e) e.preventDefault()
    if (!aiQuestion.trim() || loadingAi) return

    const currentQuestion = aiQuestion
    setAiQuestion('')
    setLoadingAi(true)
    setAiReply('Se gândește...')

    try {
      // REPARAT: Am eliminat prefixul /api duplicat deoarece este deja inclus automat în instanța ta "api"
      const response = await api.post('/ai-assistant/chat', { message: currentQuestion })
      if (response.data.success) {
        setAiReply(response.data.reply)
      }
    } catch (error) {
      console.error(error)
      setAiReply('Ne pare rău, a intervenit o eroare de comunicare cu serverul AI. Încearcă din nou.')
    } finally {
      setLoadingAi(false)
    }
  }

  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [downloadLoading, setDownloadLoading] = useState(false)

  const handleMonthlyReportDownload = async () => {
    if (downloadLoading) return
    setDownloadLoading(true)

    try {
      const res = await api.get('/transactions/report/monthly', {
        params: { month: selectedMonth, year: selectedYear }
      })

      const blob = await pdf(
        <ReportPDF
          month={selectedMonth}
          year={selectedYear}
          transactions={res.data.transactions}
          newStockItems={res.data.newStockItems}
          stats={res.data.stats}
          generatedBy={`${user?.firstName} ${user?.lastName}`}
        />
      ).toBlob()

      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `raport_${MONTHS[selectedMonth - 1].toLowerCase()}_${selectedYear}.pdf`
      a.click()
      URL.revokeObjectURL(url)
      success('Raport descărcat!')
    } catch (error) {
      console.error(error)
      toastError('Eroare la descărcarea raportului.')
    } finally {
      setDownloadLoading(false)
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

          {/* TOȚI UTILIZATORII (Manager și Angajat) văd aceleași carduri globale de sus */}
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
              label="Încasări luna curentă"
              value={formatRON(stats.monthlyIncome)}
              change="+8,1% față de luna trecută"
              color="glass"
              icon={TrendingUp}
              tag="Obiectiv atins"
            />
            <DashboardCard
              label="Cheltuieli luna curentă"
              value={formatRON(stats.monthlyExpenses)}
              change="+3,2% față de luna trecută"
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
              tag={isManager ? "Necesită decizie" : "Manager notificat"}
            />
          </div>

          {/* CONDIȚIONARE DOAR PE MIJLOCUL ECRANULUI */}
          {isManager ? (
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
                  <span className="text-[11px] text-[#8ab0b8]">Actualizat curent</span>
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
          ) : (
            /* PANOU SPECIAL PENTRU ANGAJAT: ORE LOGATE ȘI CHAT-UL CU INTELIGENȚA ARTIFICIALĂ GEMINI */
            <div className="grid grid-cols-2 gap-4">
              
              {/* CARD: STATISTICĂ SĂPTĂMÂNALĂ TIMP LUCRAT */}
              <div className="bg-white rounded-2xl border border-[#d8edf0] p-5 flex flex-col justify-between h-[235px] transition-transform duration-200 ease-out hover:-translate-y-1 hover:shadow-xl">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-[13.5px] font-semibold text-[#0d2b32] flex items-center gap-2">
                    <span className="w-0.5 h-3.5 bg-gradient-to-b from-[#00b8a4] to-[#0096a0] rounded-sm inline-block" />
                    Ore Lucrate Raportate (Săptămânal)
                  </h3>
                  <span className="text-[10px] bg-[#e0f7f5] text-[#0f6e56] font-semibold px-2 py-0.5 rounded-full border border-[#9fe1cb]">Normă Întreagă</span>
                </div>
                
                <div className="flex-1 mt-1">
                  <ResponsiveContainer width="100%" height={140}>
                    <BarChart data={MOCK_LOGGED_TIME} barSize={26}>
                      <CartesianGrid vertical={false} stroke="#dff0f3" strokeDasharray="3 3" />
                      <XAxis dataKey="week" tick={{ fontSize: 10, fill: '#6b9aa5' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: '#6b9aa5' }} axisLine={false} tickLine={false} unit=" h" domain={[0, 50]} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="ore" name="Ore Lucrate" fill="#00c9b1" radius={[5, 5, 0, 0]} fillOpacity={0.85}>
                        {MOCK_LOGGED_TIME.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.ore > 40 ? '#ef9f27' : '#00a090'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* CARD: ASISTENT AI COMPLET FUNCTIONAL (DOAR PENTRU ANGAJAT) */}
              <div className="bg-white rounded-2xl border border-[#d8edf0] p-5 flex flex-col justify-between h-[235px] transition-transform duration-200 ease-out hover:-translate-y-1 hover:shadow-xl">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="p-1.5 bg-indigo-50 rounded-lg text-indigo-600 text-sm">🤖</span>
                    <div>
                      <h3 className="text-[13.5px] font-semibold text-[#0d2b32]">Asistent AI Virtual</h3>
                      <p className="text-[10.5px] text-[#6b9aa5]">Suport operațional conectat la datele tale</p>
                    </div>
                  </div>
                  
                  <div className="bg-[#f5fcfc] border border-[#cce8ec] rounded-xl p-3 text-[12px] text-[#0d2b32] font-light leading-relaxed h-[110px] overflow-y-auto whitespace-pre-line">
                    {aiReply}
                  </div>
                </div>

                <form onSubmit={handleAiSubmit} className="mt-2 flex gap-2">
                  <input 
                    type="text" 
                    value={aiQuestion}
                    onChange={e => setAiQuestion(e.target.value)}
                    placeholder={loadingAi ? "Se generează răspunsul..." : "Pune o întrebare asistentului..."} 
                    disabled={loadingAi}
                    className="flex-1 px-3 py-1.5 text-xs border border-[#d8edf0] rounded-xl outline-none focus:border-[#00b8a4] text-[#0d2b32] disabled:opacity-60"
                  />
                  <button 
                    type="submit"
                    disabled={loadingAi || !aiQuestion.trim()}
                    className="px-3 py-1.5 text-white text-xs font-medium rounded-xl transition-all disabled:opacity-40 flex-shrink-0"
                    style={{ background: 'linear-gradient(135deg,#00b8a4,#0096a0)' }}
                  >
                    {loadingAi ? '...' : 'Trimite'}
                  </button>
                </form>
              </div>

            </div>
          )}

          {isManager && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="bg-white rounded-2xl border border-[#d8edf0] p-5 lg:col-span-1">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-[12px] font-semibold text-[#8ab0b8] uppercase tracking-wider">Raport lunar</p>
                    <h3 className="text-[15px] font-semibold text-[#0d2b32] mt-1">Descarcă PDF</h3>
                  </div>
                  <div className="w-10 h-10 rounded-2xl bg-[#e0f7f5] text-[#00796b] flex items-center justify-center">
                    <FileText size={18} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div>
                    <label className="block text-[10px] font-semibold text-[#8ab0b8] uppercase tracking-wider mb-1.5">Lună</label>
                    <select
                      className="w-full px-3 py-2 text-sm border border-[#d8edf0] rounded-xl outline-none focus:border-[#00c9b1] text-[#0d2b32]"
                      value={selectedMonth}
                      onChange={e => setSelectedMonth(Number(e.target.value))}
                    >
                      {MONTHS.map((m, i) => (
                        <option key={m} value={i + 1}>{m}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-[#8ab0b8] uppercase tracking-wider mb-1.5">An</label>
                    <select
                      className="w-full px-3 py-2 text-sm border border-[#d8edf0] rounded-xl outline-none focus:border-[#00c9b1] text-[#0d2b32]"
                      value={selectedYear}
                      onChange={e => setSelectedYear(Number(e.target.value))}
                    >
                      {[new Date().getFullYear(), new Date().getFullYear() - 1].map(y => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <button
                  onClick={handleMonthlyReportDownload}
                  disabled={downloadLoading}
                  className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl text-[13px] font-semibold text-white disabled:opacity-60"
                  style={{ background: 'linear-gradient(135deg,#00b8a4,#0096a0)' }}
                >
                  <Download size={14} />
                  {downloadLoading ? 'Se generează...' : `Descarcă ${MONTHS[selectedMonth - 1]} ${selectedYear}`}
                </button>

                <p className="text-[11px] text-[#6b9aa5] mt-3">Fără încărcare suplimentară. Raportul se generează direct.</p>
              </div>
            </div>
          )}

          {/* TOȚI UTILIZATORII (Manager și Angajat) văd rândul final de jos cu Tranzacții și Stocuri */}
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
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${isIn ? 'bg-[#e0f7f5] text-[#00796b]' : txn.status === 'În așteptare' ? 'bg-[#faeeda] text-[#854f0b]' : 'bg-[#fcebeb] text-[#a32d2d]'}`}>
                        {isIn ? <TrendingUp size={14} /> : txn.status === 'În așteptare' ? <Clock size={14} /> : <TrendingDown size={14} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[12.5px] font-medium text-[#0d2b32] truncate">{txn.supplier}</p>
                        <p className="text-[11px] text-[#8ab0b8] font-mono">{txn.reference}</p>
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
                  {stocks.length === 0 && <p className="text-sm text-[#8ab0b8] text-center py-2">Niciun produs în nomenclator</p>}
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