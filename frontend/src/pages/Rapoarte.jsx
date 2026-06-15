import { useState } from 'react'
import { PDFDownloadLink } from '@react-pdf/renderer'
import { Download, FileText, Calendar } from 'lucide-react'
import Sidebar from '../components/Sidebar'
import Navbar from '../components/Navbar'
import { ToastContainer } from '../components/Toast'
import { useTransactions } from '../hooks/useTransactions'
import { useToast } from '../hooks/useToast'
import { useAuth } from '../hooks/useAuth'
import { useDashboard } from '../hooks/useDashboard'
import ReportPDF from '../components/ReportPDF'
import api from '../api'

const MONTHS = [
  'Ianuarie', 'Februarie', 'Martie', 'Aprilie', 'Mai', 'Iunie',
  'Iulie', 'August', 'Septembrie', 'Octombrie', 'Noiembrie', 'Decembrie'
]

const formatRON = (amount) =>
  new Intl.NumberFormat('ro-RO', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount) + ' RON'

const formatDate = (date) => {
  const d = new Date(date)
  return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}`
}

export default function Rapoarte() {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [reportData, setReportData] = useState(null)
  const [fetching, setFetching] = useState(false)
  const { pendingCount } = useTransactions()
  const { toasts, success, error: toastError, removeToast } = useToast()
  const { user } = useAuth()

  const years = [new Date().getFullYear(), new Date().getFullYear() - 1]

  const handleLoad = async () => {
    setFetching(true)
    setReportData(null)
    try {
      const res = await api.get('/transactions/report/monthly', {
        params: { month: selectedMonth, year: selectedYear }
      })
      setReportData(res.data)
      success('Date încărcate!')
    } catch {
      toastError('Eroare la încărcarea datelor.')
    } finally {
      setFetching(false)
    }
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'transparent' }}>
      <Sidebar pendingCount={pendingCount} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar title="Rapoarte PDF" subtitle="Generează și descarcă rapoarte financiare lunare" />

        <main className="flex-1 overflow-y-auto px-7 pb-6">
          <div className="mt-6">

            {/* Controls */}
            <div className="bg-white rounded-2xl border border-[#d8edf0] p-8 mb-5 max-w-md aspect-square mx-auto mt-12 flex flex-col">
              <h3 className="text-[18px] font-semibold text-[#0d2b32] flex items-center gap-2 mb-7 mt-12">
                <span className="w-1 h-5 bg-gradient-to-b from-[#00c9b1] to-[#0096a0] rounded-sm inline-block" />
                Generează raport lunar
              </h3>

              <div className="grid grid-cols-2 gap-5 my-auto">
                <div>
                  <label className="text-[12px] font-semibold text-[#8ab0b8] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Calendar size={13} /> Lună
                  </label>
                  <select
                    className="w-full px-4 py-3.5 text-base border border-[#d8edf0] rounded-xl outline-none focus:border-[#00c9b1] text-[#0d2b32]"
                    value={selectedMonth}
                    onChange={e => { setSelectedMonth(Number(e.target.value)); setReportData(null) }}>
                    {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[12px] font-semibold text-[#8ab0b8] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Calendar size={13} /> An
                  </label>
                  <select
                    className="w-full px-4 py-3.5 text-base border border-[#d8edf0] rounded-xl outline-none focus:border-[#00c9b1] text-[#0d2b32]"
                    value={selectedYear}
                    onChange={e => { setSelectedYear(Number(e.target.value)); setReportData(null) }}>
                    {years.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
              </div>

              <button
                onClick={handleLoad}
                disabled={fetching}
                className="w-full py-4 rounded-xl text-base font-semibold text-white disabled:opacity-60 mt-auto mb-10"
                style={{ background: 'linear-gradient(135deg,#00c9b1,#0096a0)' }}>
                {fetching ? 'Se încarcă...' : `Încarcă date ${MONTHS[selectedMonth - 1]} ${selectedYear}`}
              </button>
            </div>

            {/* Results */}
            {reportData && (
              <div className="max-w-4xl mx-auto">
                {/* KPI summary */}
                <div className="grid grid-cols-4 gap-3 mb-5">
                  {[
                    { label: 'Încasări', value: formatRON(reportData.stats.monthlyIncome), color: '#059669' },
                    { label: 'Cheltuieli', value: formatRON(reportData.stats.monthlyExpenses), color: '#d97706' },
                    { label: 'Profit net', value: formatRON(reportData.stats.netProfit), color: reportData.stats.netProfit >= 0 ? '#059669' : '#dc2626' },
                    { label: 'Tranzacții', value: reportData.transactions.length, color: '#1d4ed8' },
                  ].map(k => (
                    <div key={k.label} className="bg-white rounded-xl border border-[#d8edf0] p-4">
                      <p className="text-[10px] font-semibold text-[#8ab0b8] uppercase tracking-wider mb-1">{k.label}</p>
                      <p className="text-[15px] font-bold" style={{ color: k.color }}>{k.value}</p>
                    </div>
                  ))}
                </div>

                {/* Transactions table */}
                <div className="bg-white rounded-2xl border border-[#d8edf0] overflow-hidden mb-5">
                  <div className="px-5 py-4 border-b border-[#edf5f7]">
                    <h3 className="text-[13.5px] font-semibold text-[#0d2b32]">
                      Tranzacții — {MONTHS[selectedMonth - 1]} {selectedYear}
                      <span className="ml-2 text-[11px] font-normal text-[#8ab0b8]">({reportData.transactions.length} înregistrări)</span>
                    </h3>
                  </div>
                  {reportData.transactions.length === 0 ? (
                    <div className="py-12 text-center text-[13px] text-[#8ab0b8]">
                      Nicio tranzacție în această perioadă
                    </div>
                  ) : (
                    <table className="w-full">
                      <thead>
                        <tr className="bg-[#f5fcfc] border-b border-[#edf5f7]">
                          {['Data', 'Referință', 'Furnizor/Client', 'Categorie', 'Tip', 'Total', 'Status'].map(h => (
                            <th key={h} className="text-[10px] font-semibold text-[#8ab0b8] uppercase tracking-wider px-4 py-3 text-left">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {reportData.transactions.map((t, i) => (
                          <tr key={t._id} className="border-b border-[#edf5f7] hover:bg-[#f9fdfd]">
                            <td className="px-4 py-3 text-[12px] text-[#8ab0b8]">{formatDate(t.createdAt)}</td>
                            <td className="px-4 py-3 text-[12px] font-mono text-[#0d2b32]">{t.reference}</td>
                            <td className="px-4 py-3 text-[12px] text-[#0d2b32]">{t.supplier}</td>
                            <td className="px-4 py-3 text-[12px] text-[#6b9aa5]">{t.category}</td>
                            <td className="px-4 py-3">
                              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${t.type === 'Venit' ? 'bg-[#e0f7f5] text-[#0f6e56]' : 'bg-[#fef3c7] text-[#92400e]'}`}>
                                {t.type}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-[12px] font-semibold text-[#0d2b32]">{formatRON(t.totalAmount)}</td>
                            <td className="px-4 py-3">
                              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                                t.status === 'Aprobat' ? 'bg-[#e0f7f5] text-[#0f6e56]' :
                                t.status === 'Respins' ? 'bg-[#fcebeb] text-[#a32d2d]' :
                                'bg-[#f0f9ff] text-[#1d4ed8]'
                              }`}>
                                {t.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>

                {/* Download button */}
                <PDFDownloadLink
                  document={
                    <ReportPDF
                      month={selectedMonth}
                      year={selectedYear}
                      transactions={reportData.transactions}
                      newStockItems={reportData.newStockItems}
                      stats={reportData.stats}
                      generatedBy={`${user?.firstName} ${user?.lastName}`}
                    />
                  }
                  fileName={`raport_${MONTHS[selectedMonth - 1].toLowerCase()}_${selectedYear}.pdf`}
                  className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-semibold text-white"
                  style={{ background: 'linear-gradient(135deg,#1d4ed8,#1e3a8a)', textDecoration: 'none' }}
                >
                  {({ loading }) => (
                    <>
                      <Download size={14} />
                      {loading ? 'Se generează PDF...' : `Descarcă PDF — ${MONTHS[selectedMonth - 1]} ${selectedYear}`}
                    </>
                  )}
                </PDFDownloadLink>
              </div>
            )}
          </div>
        </main>
      </div>
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  )
}