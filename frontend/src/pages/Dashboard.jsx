import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Wallet, TrendingUp, TrendingDown, Clock, AlertTriangle, Check, AlertCircle, XCircle, FileText, Download, Bot } from 'lucide-react'
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
import { useWorkLogs } from '../hooks/useWorkLogs'
import api from '../api'
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts'

const formatRON = (n) =>
  new Intl.NumberFormat('ro-RO', { minimumFractionDigits: 0 }).format(Math.round(n || 0)) + ' RON'

const PIE_COLORS = ['#5b4ad1', '#6a63d4', '#8fb9ff', '#8fd0ff']

const MONTHS = [
  'Ianuarie', 'Februarie', 'Martie', 'Aprilie', 'Mai', 'Iunie',
  'Iulie', 'August', 'Septembrie', 'Octombrie', 'Noiembrie', 'Decembrie'
]

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white/80 backdrop-blur-xl border border-[#b48bd0]/30 rounded-xl shadow-lg p-3 text-xs">
      <p className="font-semibold text-[#352a6e] mb-1">{label}</p>
      {payload.map(p => (
        <div key={p.dataKey} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-[#6a63d4]/80">{p.name}: </span>
          <span className="font-semibold text-[#352a6e]">{p.name === 'Ore Lucrate' ? `${p.value} ore` : formatRON(p.value)}</span>
        </div>
      ))}
    </div>
  )
}

// Reusable hover card wrapper — lift + glow on hover
const HoverCard = ({ children, className = '', style = {}, ...rest }) => (
  <div
    className={`bg-white/60 backdrop-blur-xl border border-[#b48bd0]/20 rounded-2xl transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-xl hover:shadow-[#b48bd0]/25 hover:border-[#b48bd0]/40 hover:bg-white/75 ${className}`}
    style={style}
    {...rest}
  >
    {children}
  </div>
)

const CardHeader = ({ title, action }) => (
  <div className="flex items-center justify-between mb-4">
    <h3 className="text-[13.5px] font-semibold text-[#352a6e] flex items-center gap-2">
      <span className="w-0.5 h-3.5 bg-gradient-to-b from-[#5b4ad1] to-[#b48bd0] rounded-sm inline-block" />
      {title}
    </h3>
    {action}
  </div>
)

export default function Dashboard() {
  const { stats, loading: statsLoading, downloadReport } = useDashboard()
  const { stocks, lowStockCount } = useStocks()
  const { transactions: recentTxns } = useTransactions()
  const { isManager, user, mustChangePassword } = useAuth()
  const { workLogs } = useWorkLogs()
  const { toasts, success, error: toastError, removeToast } = useToast()
  const navigate = useNavigate()

  const [aiQuestion, setAiQuestion] = useState('')
  const [aiReply, setAiReply] = useState(
    `Salut! Sunt asistentul tău digital. Îmi poți pune întrebări despre stocuri, despre statusul documentelor tale sau cum să folosești platforma EnterpriseFlow.`
  )
  const [loadingAi, setLoadingAi] = useState(false)
  const [fluxView, setFluxView] = useState('Lunar')
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [downloadLoading, setDownloadLoading] = useState(false)
  const [managerInsight, setManagerInsight] = useState('Apasă pe „Generează” pentru o analiză a indicatorilor manageriali.')
  const [managerInsightLoading, setManagerInsightLoading] = useState(false)
  const [managerInsightReady, setManagerInsightReady] = useState(false)
  const [managerInsightWindowOpen, setManagerInsightWindowOpen] = useState(false)

  const handleDownload = async () => {
    try { await downloadReport(); success('Raport descărcat cu succes!') }
    catch { toastError('Eroare la generarea raportului.') }
  }

  const handleAiSubmit = async (e) => {
    if (e) e.preventDefault()
    if (!aiQuestion.trim() || loadingAi) return
    const currentQuestion = aiQuestion
    setAiQuestion('')
    setLoadingAi(true)
    setAiReply('Se gândește...')
    try {
      const response = await api.post('/ai-assistant/chat', { message: currentQuestion })
      if (response.data.success) setAiReply(response.data.reply)
    } catch {
      setAiReply('Ne pare rău, a intervenit o eroare. Încearcă din nou.')
    } finally {
      setLoadingAi(false)
    }
  }

  const handleMonthlyReportDownload = async () => {
    if (downloadLoading) return
    setDownloadLoading(true)
    try {
      const res = await api.get('/transactions/report/monthly', { params: { month: selectedMonth, year: selectedYear } })
      const blob = await pdf(
        <ReportPDF
          month={selectedMonth} year={selectedYear}
          transactions={res.data.transactions} newStockItems={res.data.newStockItems}
          stats={res.data.stats} generatedBy={`${user?.firstName} ${user?.lastName}`}
        />
      ).toBlob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `raport_${MONTHS[selectedMonth - 1].toLowerCase()}_${selectedYear}.pdf`
      a.click()
      URL.revokeObjectURL(url)
      success('Raport descărcat!')
    } catch {
      toastError('Eroare la descărcarea raportului.')
    } finally {
      setDownloadLoading(false)
    }
  }

  const pendingCount = stats.pendingCount || 0
  const pieData = stats.categoryBreakdown?.map(c => ({ name: c._id, value: Math.round(c.total) })) || []

  const generateManagerInsight = async () => {
    if (managerInsightLoading) return

    const managerPrompt = `
      Ești un agent AI pentru managerul din EnterpriseFlow.
      Analizează statisticile de mai jos și oferă:
      1. Un rezumat executiv de 2-3 propoziții.
      2. Trei insight-uri concrete despre performanță, cheltuieli sau documente în așteptare.
      3. Două acțiuni recomandate, scurte și practice.

      Reguli:
      - Răspunde în limba română.
      - Fii concis și orientat spre decizie.
      - Nu inventa valori care nu apar în date.

      Statistici curente:
      - Sold curent: ${formatRON(stats.balance)}
      - Încasări luna curentă: ${formatRON(stats.monthlyIncome)}
      - Cheltuieli luna curentă: ${formatRON(stats.monthlyExpenses)}
      - Documente în așteptare: ${pendingCount}
      - Distribuția cheltuielilor: ${JSON.stringify(pieData)}
      - Evoluția lunară: ${JSON.stringify(stats.monthlyBreakdown || [])}
    `

    setManagerInsightLoading(true)
    setManagerInsight('Se generează insight-urile manageriale...')

    try {
      const response = await api.post('/ai-assistant/chat', { message: managerPrompt })
      if (response.data.success) {
        setManagerInsight(response.data.reply)
      } else {
        setManagerInsight('AI Agent nu a putut genera insight-uri în acest moment.')
      }
    } catch {
      setManagerInsight('AI Agent nu a putut genera insight-uri în acest moment.')
    } finally {
      setManagerInsightLoading(false)
      setManagerInsightReady(true)
    }
  }

  

  const mb = stats.monthlyBreakdown || []
  const prev = mb[mb.length - 2] || { income: 0, expenses: 0 }
  const prevBalance = (prev.income || 0) - (prev.expenses || 0)

  const momPct = (current, previous) => {
    if (!previous) return { label: previous === 0 && current > 0 ? 'nou față de luna trecută' : 'fără date luna trecută', positive: true }
    const p = ((current - previous) / Math.abs(previous)) * 100
    return { label: `${p >= 0 ? '+' : ''}${p.toFixed(1)}% față de luna trecută`, positive: p >= 0 }
  }

  const balancePct  = momPct(stats.balance, prevBalance)
  const incomePct   = momPct(stats.monthlyIncome, prev.income || 0)
  const expensesPct = momPct(stats.monthlyExpenses, prev.expenses || 0)

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'transparent', position: 'relative' }}>
      <div style={{ position: 'relative', zIndex: 1, flexShrink: 0 }}>
        <Sidebar pendingCount={pendingCount} />
      </div>

      <div className="flex-1 flex flex-col overflow-hidden" style={{ position: 'relative', zIndex: 1 }}>
        <Navbar title="Tablou de bord" pendingCount={pendingCount} onDownload={isManager ? handleDownload : undefined} />

        <main className="flex-1 overflow-y-auto px-7 pb-6 space-y-4">

          {/* Low stock alert */}
          {lowStockCount > 0 && (
            <div className="flex items-center gap-3 bg-amber-50/70 backdrop-blur-xl border border-amber-300/50 rounded-2xl px-4 py-3 text-sm text-amber-700 mt-4">
              <AlertTriangle size={15} />
              <span><strong>{lowStockCount} produse</strong> au stoc redus sau critic. Verificați inventarul.</span>
              <button onClick={() => navigate('/stocuri')} className="ml-auto text-amber-700 font-semibold underline text-xs">Verifică</button>
            </div>
          )}

          {/* ── TOP 4 KPI CARDS ── */}
          <div className="grid grid-cols-4 gap-4 mt-4">
            <DashboardCard
              label="Sold curent" value={formatRON(stats.balance)}
              change={balancePct.label} changeType={balancePct.positive ? 'up' : 'down'}
              color="teal-dark" icon={Wallet} miniBar
              showOrb={false}
            />
            <DashboardCard
              label="Încasări luna curentă" value={formatRON(stats.monthlyIncome)}
              change={incomePct.label} changeType={incomePct.positive ? 'up' : 'down'}
              color="glass" icon={TrendingUp}
              showOrb={false}
            />
            <DashboardCard
              label="Cheltuieli luna curentă" value={formatRON(stats.monthlyExpenses)}
              change={expensesPct.label} changeType={expensesPct.positive ? 'warn' : 'up'}
              color="white-blue" icon={TrendingDown}
              showOrb={false}
            />
            <DashboardCard
              label="Documente în așteptare" value={`${pendingCount} doc.`}
              change={pendingCount > 0 ? 'Necesită aprobare urgentă' : 'Totul aprobat'}
              changeType={pendingCount > 0 ? 'down' : 'up'}
              color="glass" icon={Clock}
              showOrb={false}
            />
          </div>

          {/* ── MANAGER SECTION ── */}
          {isManager ? (
            <>
              {/* Row 1: Charts — 3 equal columns, fixed height */}
              <div className="grid grid-cols-3 gap-4">

                {/* Flux financiar */}
                <HoverCard className="p-5" style={{ height: 240 }}>
                  <CardHeader
                    title="Flux financiar"
                    action={
                      <div className="flex gap-1 bg-white/50 border border-[#b48bd0]/20 rounded-lg p-0.5">
                        {['Lunar', 'Trim.', 'Anual'].map(t => (
                          <button key={t} onClick={() => setFluxView(t)}
                            className={`text-[11px] px-2.5 py-1 rounded-md transition-all duration-200 ${t === fluxView ? 'bg-[#5b4ad1] text-white font-medium shadow-sm' : 'text-[#6a63d4]/70 hover:text-[#352a6e]'}`}>
                            {t}
                          </button>
                        ))}
                      </div>
                    }
                  />
                  <ResponsiveContainer width="100%" height={148}>
                    <BarChart
                      data={fluxView === 'Lunar' ? stats.monthlyBreakdown : fluxView === 'Trim.' ? stats.quarterlyBreakdown : stats.yearlyBreakdown}
                      barSize={12} barGap={3}>
                      <CartesianGrid vertical={false} stroke="rgba(180,139,208,0.2)" />
                      <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#6a63d4' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: '#6a63d4' }} axisLine={false} tickLine={false} tickFormatter={v => v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v} />
                      <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(180,139,208,0.08)' }} />
                      <Bar dataKey="income" name="Încasări" fill="#5b4ad1" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="expenses" name="Cheltuieli" fill="#8fd0ff" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </HoverCard>

                {/* Evoluția soldului */}
                <HoverCard className="p-5" style={{ height: 240 }}>
                  <CardHeader
                    title="Evoluția soldului"
                    action={<span className="text-[11px] text-[#6a63d4]/60">2026</span>}
                  />
                  <ResponsiveContainer width="100%" height={148}>
                    <LineChart data={stats.monthlyBreakdown?.map((m, i, arr) => ({
                      ...m,
                      balance: arr.slice(0, i + 1).reduce((acc, cur) => acc + (cur.income - cur.expenses), 0)
                    })) || []}>
                      <CartesianGrid vertical={false} stroke="rgba(180,139,208,0.2)" />
                      <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#6a63d4' }} axisLine={false} tickLine={false} />
                      <YAxis
  tick={{ fontSize: 10, fill: '#6a63d4' }}
  axisLine={false}
  tickLine={false}
  domain={[-10000, 10000]}
  tickFormatter={v => {
    if (v === 0) return '0'
    if (Math.abs(v) >= 1000) return (v / 1000).toFixed(0) + 'k'
    return Math.round(v)
  }}
/>
                      <Tooltip content={<CustomTooltip />} />
                      <Line type="monotone" dataKey="balance" name="Sold" stroke="#5b4ad1" strokeWidth={2.3}
                        dot={{ fill: '#5b4ad1', r: 3, strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 5 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </HoverCard>

                {/* Structura cheltuielilor */}
                <HoverCard className="p-5 flex flex-col" style={{ height: 240 }}>
                  <h3 className="text-[13.5px] font-semibold text-[#352a6e] flex items-center gap-2 mb-3 flex-shrink-0">
                    <span className="w-0.5 h-3.5 bg-gradient-to-b from-[#5b4ad1] to-[#b48bd0] rounded-sm inline-block" />
                    Structura cheltuielilor
                  </h3>
                  {pieData.length > 0 ? (
                    <div className="flex gap-3 flex-1 min-h-0">
                      <div className="flex-shrink-0 flex items-center">
                        <ResponsiveContainer width={110} height={110}>
                          <PieChart>
                            <Pie data={pieData} cx="50%" cy="50%" innerRadius={30} outerRadius={50} dataKey="value" paddingAngle={2}>
                              {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                            </Pie>
                            <Tooltip formatter={v => formatRON(v)} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="flex flex-col justify-center gap-1.5 flex-1 min-w-0">
                        {pieData.map((item, i) => (
                          <div key={item.name} className="flex items-center gap-1.5 text-[11px]">
                            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                            <span className="text-[#6a63d4]/80 flex-1 truncate">{item.name}</span>
                            <span className="font-semibold text-[#352a6e] text-[10.5px] flex-shrink-0">{formatRON(item.value)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-[12px] text-[#b48bd0] text-center py-6">Nicio cheltuială</p>
                  )}
                </HoverCard>
              </div>

              {/* Row 2: Txn list + right column — both fixed at 260px height */}
              <div className="grid gap-4" style={{ gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)', height: 260 }}>

                {/* Tranzacții recente — card with internal scroll */}
                <HoverCard className="flex flex-col overflow-hidden" style={{ height: 260 }}>
                  {/* Header — fixed */}
                  <div className="flex items-center justify-between px-4 pt-4 pb-2 flex-shrink-0">
                    <h3 className="text-[13px] font-semibold text-[#352a6e] flex items-center gap-2">
                      <span className="w-0.5 h-3.5 bg-gradient-to-b from-[#5b4ad1] to-[#b48bd0] rounded-sm inline-block" />
                      Tranzacții recente
                    </h3>
                    <button onClick={() => navigate('/tranzactii')} className="text-[11px] text-[#5b4ad1] font-medium hover:underline">
                      Vezi toate
                    </button>
                  </div>

                  {/* Scrollable rows */}
                  <div className="flex-1 overflow-y-auto px-3 pb-3" style={{ scrollbarWidth: 'thin' }}>
                    {recentTxns.length === 0 ? (
                      <p className="text-[12px] text-[#b48bd0] text-center py-6">Nicio tranzacție înregistrată</p>
                    ) : recentTxns.map(txn => {
                      const isIn = txn.type === 'Venit'
                      return (
                        <div
                          key={txn._id}
                          onClick={() => navigate(`/tranzactii?q=${encodeURIComponent(txn.reference)}`)}
                          className="grid items-center px-1 py-2 rounded-lg cursor-pointer transition-all duration-150 hover:bg-white/70 hover:shadow-sm group border-b border-[#b48bd0]/10 last:border-0"
                          style={{ gridTemplateColumns: '1.4rem 1fr 6rem 5.5rem' }}
                        >
                          <div className={`w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 ${isIn ? 'bg-emerald-100/70 text-emerald-700' : txn.status === 'În așteptare' ? 'bg-amber-100/70 text-amber-700' : 'bg-sky-100/70 text-sky-700'}`}>
                            {isIn ? <TrendingUp size={10} /> : txn.status === 'În așteptare' ? <Clock size={10} /> : <TrendingDown size={10} />}
                          </div>
                          <div className="min-w-0 pl-2">
                            <p className="text-[11.5px] font-medium text-[#352a6e] truncate group-hover:text-[#5b4ad1] transition-colors">{txn.supplier}</p>
                            <p className="text-[10px] text-[#b48bd0] font-mono">{txn.reference}</p>
                          </div>
                          <p className={`text-[11.5px] font-semibold text-right pr-2 ${isIn ? 'text-emerald-700' : 'text-sky-700'}`}>
                            {isIn ? '+' : '-'}{new Intl.NumberFormat('ro-RO', { minimumFractionDigits: 0 }).format(Math.round(txn.totalAmount || 0))}
                          </p>
                          <div className="text-right">
                            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${txn.status === 'Aprobat' ? 'bg-emerald-100/70 text-emerald-700' : txn.status === 'Respins' ? 'bg-sky-100/70 text-sky-700' : 'bg-amber-100/70 text-amber-700'}`}>
                              {txn.status}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </HoverCard>

                {/* Right column: AI Agent + PDF — fixed total height 260px */}
                <div className="grid gap-3" style={{ gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', height: 260 }}>

                  {/* Raport PDF — fixed height */}
                  <HoverCard className="p-4 flex flex-col gap-2 items-center" style={{ height: 260 }}>
                    <div className="flex items-center justify-between flex-shrink-0">
                      <h3 className="text-[12px] font-semibold text-[#352a6e] flex items-center gap-1.5">
                        <span className="w-0.5 h-3 bg-gradient-to-b from-[#5b4ad1] to-[#b48bd0] rounded-sm inline-block" />
                        Raport PDF
                      </h3>
                      <div className="w-6 h-6 rounded-lg bg-[#5b4ad1]/10 text-[#5b4ad1] flex items-center justify-center flex-shrink-0">
                        <FileText size={12} />
                      </div>
                    </div>
                    <div className="flex w-full max-w-[12rem] flex-col gap-2 flex-1 justify-center">
                      <div className="flex items-center gap-2">
                        <select className="flex-1 px-2 py-1 text-[11px] bg-white/50 border border-[#b48bd0]/30 rounded-lg outline-none focus:border-[#5b4ad1]/60 text-[#352a6e] transition-all duration-150 text-center"
                          value={selectedMonth} onChange={e => setSelectedMonth(Number(e.target.value))}>
                          {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m.slice(0, 3)}</option>)}
                        </select>
                        <select className="flex-1 px-2 py-1 text-[11px] bg-white/50 border border-[#b48bd0]/30 rounded-lg outline-none focus:border-[#5b4ad1]/60 text-[#352a6e] transition-all duration-150 text-center"
                          value={selectedYear} onChange={e => setSelectedYear(Number(e.target.value))}>
                          {[new Date().getFullYear(), new Date().getFullYear() - 1].map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                      </div>
                      <button onClick={handleMonthlyReportDownload} disabled={downloadLoading}
                        className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#5b4ad1] px-3 py-2.5 text-[12px] font-semibold text-white shadow-md shadow-[#5b4ad1]/25 transition-all duration-200 hover:bg-[#6a63d4] disabled:opacity-60">
                        <Download size={12} />
                        {downloadLoading ? 'Se descarcă...' : 'PDF'}
                      </button>
                    </div>
                  </HoverCard>

                  {/* AI Agent — fixed height, scrollable response */}
                  <HoverCard
                    className="p-4 flex flex-col overflow-hidden cursor-pointer"
                    style={{ height: 260 }}
                    onClick={() => setManagerInsightWindowOpen(true)}
                  >
                    <div className="flex items-center justify-between mb-2 flex-shrink-0">
                      <h3 className="text-[12px] font-semibold text-[#352a6e] flex items-center gap-1.5">
                        <span className="w-0.5 h-3 bg-gradient-to-b from-[#5b4ad1] to-[#b48bd0] rounded-sm inline-block" />
                        AI Agent Manager
                      </h3>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          generateManagerInsight()
                        }}
                        disabled={managerInsightLoading}
                        className="text-[10.5px] text-[#5b4ad1] font-medium hover:underline disabled:opacity-60">
                        {managerInsightLoading ? 'Se generează...' : 'Generează'}
                      </button>
                    </div>
                    <div className="flex-1 overflow-y-auto space-y-2" style={{ scrollbarWidth: 'thin' }}>
                      <div className="flex items-center gap-2 rounded-xl bg-[#f7f1f8]/70 border border-[#b48bd0]/20 px-2.5 py-2">
                        <div className="w-7 h-7 rounded-lg bg-[#5b4ad1]/10 text-[#5b4ad1] flex items-center justify-center flex-shrink-0">
                          <Bot size={14} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[11px] font-semibold text-[#352a6e]">Analiză automată</p>
                          <p className="text-[10px] text-[#6a63d4]/70">Bazată pe sold, cheltuieli, încasări și documente în așteptare</p>
                        </div>
                      </div>
                      <div className="rounded-xl bg-white/50 border border-[#b48bd0]/20 p-2.5 text-[11px] leading-relaxed text-[#352a6e] whitespace-pre-line min-h-[68px]">
                        {managerInsight}
                      </div>
                    </div>
                  </HoverCard>

                </div>
              </div>

              {managerInsightWindowOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[#352a6e]/35 backdrop-blur-sm p-4" onClick={() => setManagerInsightWindowOpen(false)}>
                  <div className="w-full max-w-3xl max-h-[86vh] overflow-hidden rounded-3xl border border-[#b48bd0]/30 bg-white/92 shadow-2xl shadow-[#352a6e]/25" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-between border-b border-[#b48bd0]/20 px-5 py-4 bg-gradient-to-r from-white/90 to-[#f7f1f8]/90">
                      <div>
                        <h3 className="text-[15px] font-semibold text-[#352a6e]">AI Agent Manager</h3>
                        <p className="text-[11px] text-[#6a63d4]/70">Analiză detaliată pe baza indicatorilor curenți</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={generateManagerInsight}
                          disabled={managerInsightLoading}
                          className="rounded-xl bg-[#5b4ad1] px-3 py-2 text-[12px] font-medium text-white shadow-md shadow-[#5b4ad1]/25 transition-all duration-200 hover:bg-[#6a63d4] disabled:opacity-60"
                        >
                          {managerInsightLoading ? 'Se generează...' : 'Regenerează'}
                        </button>
                        <button
                          onClick={() => setManagerInsightWindowOpen(false)}
                          className="rounded-xl border border-[#b48bd0]/30 bg-white/70 px-3 py-2 text-[12px] font-medium text-[#5b4ad1] transition-all duration-200 hover:bg-white"
                        >
                          Închide
                        </button>
                      </div>
                    </div>
                    <div className="max-h-[calc(86vh-74px)] overflow-y-auto p-5" style={{ scrollbarWidth: 'thin' }}>
                      <div className="flex items-center gap-3 rounded-2xl border border-[#b48bd0]/20 bg-[#f7f1f8]/70 p-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#5b4ad1]/10 text-[#5b4ad1]">
                          <Bot size={18} />
                        </div>
                        <div>
                          <p className="text-[12px] font-semibold text-[#352a6e]">Analiză automată pentru manager</p>
                          <p className="text-[11px] text-[#6a63d4]/70">Sold, cheltuieli, încasări, documente în așteptare și distribuția cheltuielilor</p>
                        </div>
                      </div>

                      <div className="mt-4 rounded-2xl border border-[#b48bd0]/20 bg-white/80 p-4 text-[13px] leading-relaxed text-[#352a6e] whitespace-pre-line">
                        {managerInsight}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (

            /* ── ANGAJAT SECTION ── */
            <div className="grid grid-cols-2 gap-4">
              {/* Coloana Stângă: Ore lucrate și Tranzacții recente (unul sub altul) */}
              <div className="flex flex-col gap-4">
                {/* Ore lucrate */}
                <HoverCard className="p-4 flex flex-col" style={{ height: 220 }}>
                  <CardHeader title="Ore Lucrate (Săptămânal)" />
                  <ResponsiveContainer width="100%" height={126}>
                    <BarChart data={workLogs} barSize={22}>
                      <CartesianGrid vertical={false} stroke="rgba(180,139,208,0.2)" strokeDasharray="3 3" />
                      <XAxis dataKey="week" tick={{ fontSize: 10, fill: '#6a63d4' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: '#6a63d4' }} axisLine={false} tickLine={false} unit=" h" domain={[0, 50]} />
                      <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(180,139,208,0.08)' }} />
                      <Bar dataKey="ore" name="Ore Lucrate" fill="#5b4ad1" radius={[5, 5, 0, 0]}>
                        {workLogs.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.ore > 40 ? '#8fd0ff' : '#5b4ad1'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </HoverCard>

                {/* Tranzacții recente */}
                <HoverCard className="p-4 flex flex-col" style={{ height: 240 }}>
                  <CardHeader
                    title="Tranzacții recente"
                    action={<button onClick={() => navigate('/tranzactii')} className="text-[11.5px] text-[#5b4ad1] font-medium hover:underline">Vezi toate</button>}
                  />
                  <div className="divide-y divide-[#b48bd0]/10 flex-1 overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
                    {recentTxns.slice(0, 4).map(txn => {
                      const isIn = txn.type === 'Venit'
                      return (
                        <div
                          key={txn._id}
                          onClick={() => navigate(`/tranzactii?q=${encodeURIComponent(txn.reference)}`)}
                          className="flex items-center gap-3 py-2 cursor-pointer hover:bg-white/40 rounded-lg px-1 transition-all duration-150"
                        >
                          <div className={`w-6.5 h-6.5 rounded-lg flex items-center justify-center flex-shrink-0 ${isIn ? 'bg-emerald-100/60 text-emerald-700' : txn.status === 'În așteptare' ? 'bg-amber-100/60 text-amber-700' : 'bg-sky-100/60 text-sky-700'}`}>
                            {isIn ? <TrendingUp size={12} /> : txn.status === 'În așteptare' ? <Clock size={12} /> : <TrendingDown size={12} />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[11.5px] font-medium text-[#352a6e] truncate">{txn.supplier}</p>
                            <p className="text-[10px] text-[#b48bd0] font-mono">{txn.reference}</p>
                          </div>
                          <div className="text-right">
                            <p className={`text-[11.5px] font-semibold ${isIn ? 'text-emerald-700' : 'text-sky-700'}`}>
                              {isIn ? '+' : '-'}{formatRON(txn.totalAmount)}
                            </p>
                            <span className={`text-[9.5px] font-semibold px-1.5 py-0.5 rounded-full ${txn.status === 'Aprobat' ? 'bg-emerald-100/60 text-emerald-700' : txn.status === 'Respins' ? 'bg-sky-100/60 text-sky-700' : 'bg-amber-100/60 text-amber-700'}`}>
                              {txn.status}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                    {recentTxns.length === 0 && <p className="text-sm text-[#b48bd0] text-center py-6">Nicio tranzacție înregistrată</p>}
                  </div>
                </HoverCard>
              </div>

              {/* Coloana Dreaptă: Asistent AI și Evidența stocuri (unul lângă altul) */}
              <div className="grid grid-cols-2 gap-4">
                {/* Asistent AI */}
                <HoverCard className="p-4 flex flex-col" style={{ height: 476 }}>
                  <div className="flex items-center gap-2 mb-2.5 flex-shrink-0">
                    <span className="w-7 h-7 flex items-center justify-center bg-gradient-to-br from-[#5b4ad1] to-[#b48bd0] rounded-lg text-white flex-shrink-0">
                      <Bot size={14} />
                    </span>
                    <div>
                      <h3 className="text-[12.5px] font-semibold text-[#352a6e]">Asistent AI Virtual</h3>
                      <p className="text-[10px] text-[#6a63d4]/70">Suport operațional</p>
                    </div>
                  </div>
                  <div className="bg-white/40 border border-[#b48bd0]/25 rounded-xl p-3 text-[11.5px] text-[#352a6e] font-light leading-relaxed flex-1 overflow-y-auto whitespace-pre-line min-h-[82px]">
                    {aiReply}
                  </div>
                  <form onSubmit={handleAiSubmit} className="mt-2 flex gap-2">
                    <input type="text" value={aiQuestion} onChange={e => setAiQuestion(e.target.value)}
                      placeholder={loadingAi ? 'Se generează...' : 'Pune o întrebare...'}
                      disabled={loadingAi}
                      className="flex-1 px-3 py-1.5 text-[11px] bg-white/50 border border-[#b48bd0]/30 rounded-xl outline-none focus:border-[#5b4ad1]/60 text-[#352a6e] placeholder-[#b48bd0]/60 transition-all duration-200 disabled:opacity-60" />
                    <button type="submit" disabled={loadingAi || !aiQuestion.trim()}
                      className="px-3 py-1.5 bg-[#5b4ad1] hover:bg-[#6a63d4] text-[11px] font-medium text-white rounded-xl shadow-md shadow-[#5b4ad1]/25 transition-all duration-200 disabled:opacity-40 flex-shrink-0">
                      {loadingAi ? '...' : 'Trimite'}
                    </button>
                  </form>
                </HoverCard>

                {/* Evidența stocuri */}
                <HoverCard className="p-4 flex flex-col" style={{ height: 476 }}>
                  <CardHeader
                    title="Evidența stocuri"
                    action={<button onClick={() => navigate('/stocuri')} className="text-[11.5px] text-[#5b4ad1] font-medium hover:underline">Gestionează</button>}
                  />
                  <div className="space-y-2 flex-1 overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
                    {stocks.slice(0, 12).map(s => (
                      <div key={s._id} className="flex items-center gap-2">
                        <p className="text-[11.5px] font-medium text-[#352a6e] flex-1 truncate">{s.name}</p>
                        <span className="text-[10px] text-[#b48bd0]">{s.quantity} {s.unit}</span>
                        {s.status === 'OK' ? <Check size={12} className="text-emerald-600 flex-shrink-0" />
                          : s.status === 'Redus' ? <AlertCircle size={12} className="text-amber-600 flex-shrink-0" />
                          : <XCircle size={12} className="text-sky-500 flex-shrink-0" />}
                      </div>
                    ))}
                    {stocks.length === 0 && <p className="text-[11px] text-[#b48bd0] text-center py-4">Niciun produs în nomenclator</p>}
                  </div>
                </HoverCard>
              </div>
            </div>
          )}
        </main>
      </div>
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  )
}