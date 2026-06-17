import { useState, useEffect, useCallback } from 'react';
import {
  Plus, Edit2, Trash2, LogIn, LogOut,
  ChevronDown, ChevronUp, Filter, RefreshCw
} from 'lucide-react';
import Sidebar from '../components/Sidebar';
import Navbar  from '../components/Navbar';
import { useAuth } from '../hooks/useAuth';

const ACTION_CONFIG = {
  CREATE: { label: 'Creat',       color: 'bg-emerald-100 text-emerald-700', Icon: Plus    },
  UPDATE: { label: 'Modificat',   color: 'bg-amber-100 text-amber-700',     Icon: Edit2   },
  DELETE: { label: 'Șters',       color: 'bg-red-100 text-red-700',         Icon: Trash2  },
  LOGIN:  { label: 'Autentificat',color: 'bg-blue-100 text-blue-700',       Icon: LogIn   },
  LOGOUT: { label: 'Deconectat',  color: 'bg-slate-100 text-slate-600',     Icon: LogOut  },
};

const ENTITY_LABELS = {
  Order: 'Document', Invoice: 'Factură', User: 'Utilizator', Stock: 'Stoc', Product: 'Produs'
};

const GRID = '1fr 2fr 1.5fr 1.2fr 2rem';

const fmt = (iso) => {
  const d = new Date(iso);
  return d.toLocaleDateString('ro-RO', { day: '2-digit', month: '2-digit', year: 'numeric' })
    + ' ' + d.toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' });
};

const getDiff = (before, after) => {
  if (!before || !after) return [];
  const skip = ['_id', '__v', 'updatedAt', 'createdAt', 'password'];
  return Object.keys(after)
    .filter(k => !skip.includes(k) && JSON.stringify(before[k]) !== JSON.stringify(after[k]))
    .map(k => ({ field: k, before: before[k], after: after[k] }));
};

const DiffRow = ({ field, before, after }) => (
  <div className="flex items-start gap-2 text-[11.5px] py-1 border-b border-[#b48bd0]/10 last:border-0">
    <span className="text-[#b48bd0] w-28 shrink-0 font-medium">{field}</span>
    <span className="line-through text-red-400 max-w-[180px] truncate">{String(before ?? '—')}</span>
    <span className="text-[#b48bd0] mx-1">→</span>
    <span className="text-emerald-600 max-w-[180px] truncate">{String(after ?? '—')}</span>
  </div>
);

const renderEntityDetails = (log) => {
  if (log.entity === 'User') return null;

  if (log.entity === 'Order') {
    const after  = log.changes?.after?.data || log.changes?.after;
    const before = log.changes?.before;
    const docNr  = after?.documentNumber || before?.documentNumber || null;
    const storedLabel = (log.entityName || '').split(/\s*—/)[0].trim();
    const isManagerAction = storedLabel === 'Aprobare' || storedLabel === 'Respingere';
    const label = isManagerAction
      ? storedLabel
      : (after?.type || before?.type || storedLabel || '');
    return (
      <span className="text-[12px] font-medium text-[#352a6e]">
        {label}{docNr ? ` - ${docNr}` : ''}
      </span>
    );
  }

  if (log.entity === 'Stock') {
    const after  = log.changes?.after?.data || log.changes?.after;
    const before = log.changes?.before;
    const name = after?.name || before?.name || log.entityName;
    const qty  = log.action === 'DELETE' ? (before?.quantity ?? null) : (after?.quantity ?? null);
    const unit = after?.unit || before?.unit || 'buc.';
    return (
      <span className="flex items-center gap-1.5">
        <span className="text-[#352a6e] font-medium">{name}</span>
        {qty !== null && (
          <span className="text-[11px] bg-[#f7f1f8] text-[#5b4ad1] font-medium px-2 py-0.5 rounded-md border border-[#b48bd0]/20">
            {qty} {unit}
          </span>
        )}
      </span>
    );
  }

  return <span className="text-[12px] text-[#352a6e]">{log.entityName}</span>;
};

const LogRow = ({ log }) => {
  const [open, setOpen] = useState(false);
  const cfg  = ACTION_CONFIG[log.action] || ACTION_CONFIG.UPDATE;
  const diff = log.changes ? getDiff(log.changes.before, log.changes.after) : [];
  const hasDiff = diff.length > 0;

  return (
    <>
      {/* Row — same grid as header */}
      <div
        className={`grid items-center px-5 py-2.5 border-b border-[#b48bd0]/10 transition-colors duration-150 ${hasDiff ? 'cursor-pointer hover:bg-[#f7f1f8]/40' : ''}`}
        style={{ gridTemplateColumns: GRID }}
        onClick={() => hasDiff && setOpen(o => !o)}
      >
        {/* Acțiune */}
        <div>
          <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full ${cfg.color}`}>
            <cfg.Icon size={11} />{cfg.label}
          </span>
        </div>

        {/* Entitate */}
        <div className="text-[12px] min-w-0 pr-2 flex items-center gap-1.5 flex-wrap">
          <span className="text-[#b48bd0]">{ENTITY_LABELS[log.entity] || log.entity}</span>
          {renderEntityDetails(log)}
        </div>

        {/* Utilizator */}
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[9px] font-bold shrink-0 bg-gradient-to-br from-[#352a6e] to-[#5b4ad1]">
            {log.userName?.split(' ').map(n => n[0]).join('').slice(0, 2)}
          </div>
          <span className="text-[12px] text-[#352a6e] truncate">{log.userName}</span>
        </div>

        {/* Data */}
        <div className="text-[12px] text-[#b48bd0]">{fmt(log.createdAt)}</div>

        {/* Expand icon */}
        <div className="flex justify-end">
          {hasDiff && (
            <span className="text-[#b48bd0]">
              {open ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
            </span>
          )}
        </div>
      </div>

      {/* Diff panel */}
      {open && hasDiff && (
        <div className="px-8 py-3 bg-[#f7f1f8]/50 border-b border-[#b48bd0]/10">
          <p className="text-[10px] font-semibold text-[#b48bd0] uppercase tracking-wider mb-2">
            Modificări ({diff.length})
          </p>
          {diff.map(d => <DiffRow key={d.field} {...d} />)}
        </div>
      )}
    </>
  );
};

export default function AuditLogPage() {
  const [logs,         setLogs]         = useState([]);
  const [total,        setTotal]        = useState(0);
  const [pages,        setPages]        = useState(1);
  const [page,         setPage]         = useState(1);
  const [loading,      setLoading]      = useState(true);
  const [users,        setUsers]        = useState([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [filters,      setFilters]      = useState({ entity: '', action: '', userId: '', startDate: '', endDate: '' });

  const { isManager } = useAuth();

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 50 });
      Object.entries(filters).forEach(([k, v]) => v && params.append(k, v));
      const token = sessionStorage.getItem('ef_token');
      const res   = await fetch(`/api/audit?${params}`, { headers: { Authorization: `Bearer ${token}` } });
      const data  = await res.json();
      setLogs(data.logs || []);
      setTotal(data.total || 0);
      setPages(data.pages || 1);
    } catch (err) {
      console.error('AUDIT ERROR:', err);
    } finally {
      setLoading(false);
    }
  }, [page, filters]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  useEffect(() => {
    if (!isManager) return;
    const token = sessionStorage.getItem('ef_token');
    fetch('/api/audit/users', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(setUsers);
  }, [isManager]);

  const setFilter = (key, val) => { setFilters(f => ({ ...f, [key]: val })); setPage(1); };
  const resetFilters = () => { setFilters({ entity: '', action: '', userId: '', startDate: '', endDate: '' }); setPage(1); };

  const filterSelectCls = "text-[11.5px] border border-[#b48bd0]/30 rounded-xl px-3 py-1.5 text-[#352a6e] outline-none focus:border-[#5b4ad1]/60 bg-white/60 backdrop-blur-sm transition-all duration-150";

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'transparent' }}>
      <Sidebar pendingCount={pendingCount} />

      <div className="flex-1 flex flex-col overflow-hidden min-h-0">
        <Navbar title="Audit Log" subtitle={`${total} înregistrări`} showSearch={false} />

        <main className="flex-1 overflow-hidden flex flex-col px-7 pb-6 gap-3 min-h-0">

          {/* Filters */}
          <div className="bg-white/60 backdrop-blur-xl border border-[#b48bd0]/20 rounded-2xl px-4 py-3 flex-shrink-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Filter size={13} className="text-[#b48bd0]" />
              <select value={filters.entity} onChange={e => setFilter('entity', e.target.value)} className={filterSelectCls}>
                <option value="">Toate entitățile</option>
                {[{ key: 'Order', label: 'Document' }, { key: 'User', label: 'Utilizator' }, { key: 'Stock', label: 'Stoc' }]
                  .map(e => <option key={e.key} value={e.key}>{e.label}</option>)}
              </select>
              <select value={filters.action} onChange={e => setFilter('action', e.target.value)} className={filterSelectCls}>
                <option value="">Toate acțiunile</option>
                {Object.entries(ACTION_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
              {isManager && users.length > 0 && (
                <select value={filters.userId} onChange={e => setFilter('userId', e.target.value)} className={filterSelectCls}>
                  <option value="">Toți utilizatorii</option>
                  {users.map(u => <option key={u._id} value={u._id}>{u.userName}</option>)}
                </select>
              )}
              <input type="date" value={filters.startDate} onChange={e => setFilter('startDate', e.target.value)} className={filterSelectCls} />
              <input type="date" value={filters.endDate} onChange={e => setFilter('endDate', e.target.value)} className={filterSelectCls} />
              <button onClick={resetFilters} className="ml-auto flex items-center gap-1.5 text-[11.5px] text-[#b48bd0] hover:text-[#5b4ad1] transition-colors duration-150">
                <RefreshCw size={12} /> Reset
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="flex-1 bg-white/60 backdrop-blur-xl border border-[#b48bd0]/20 rounded-2xl overflow-hidden flex flex-col min-h-0">
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="w-7 h-7 border-4 border-[#5b4ad1] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : logs.length === 0 ? (
              <div className="text-center py-12 text-[#b48bd0] text-[13px]">Nicio înregistrare găsită.</div>
            ) : (
              <div className="flex-1 overflow-hidden flex flex-col min-h-0">

                {/* Header — fixed */}
                <div className="flex-shrink-0 border-b border-[#b48bd0]/10">
                  <div className="grid px-5 py-2.5 bg-[#f7f1f8]/60" style={{ gridTemplateColumns: GRID }}>
                    {['Acțiune', 'Entitate', 'Utilizator', 'Data', ''].map(h => (
                      <span key={h} className="text-[10px] font-semibold text-[#b48bd0] uppercase tracking-wider">{h}</span>
                    ))}
                  </div>
                </div>

                {/* Rows — same grid, no table */}
                <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
                  {logs.map(log => <LogRow key={log._id} log={log} />)}
                </div>

              </div>
            )}
          </div>

          {/* Pagination */}
          {pages > 1 && (
            <div className="flex justify-center gap-2 flex-shrink-0">
              {Array.from({ length: pages }, (_, i) => i + 1).map(p => (
                <button key={p} onClick={() => setPage(p)}
                  className={`w-7 h-7 rounded-lg text-[11.5px] font-medium transition-all duration-200 ${
                    p === page
                      ? 'bg-[#5b4ad1] text-white shadow-md shadow-[#5b4ad1]/25'
                      : 'bg-white/60 border border-[#b48bd0]/25 text-[#b48bd0] hover:border-[#5b4ad1]/50 hover:text-[#5b4ad1]'
                  }`}>
                  {p}
                </button>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
