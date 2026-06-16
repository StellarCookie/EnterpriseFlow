import { useState, useEffect, useCallback } from 'react';
import {
  Plus, Edit2, Trash2, LogIn, LogOut,
  ChevronDown, ChevronUp, Filter, RefreshCw
} from 'lucide-react';
import Sidebar from '../components/Sidebar';
import Navbar  from '../components/Navbar';
import { useAuth } from '../hooks/useAuth';

// ── helpers ──────────────────────────────────────────────────────────────────

const ACTION_CONFIG = {
  CREATE: { label: 'Creat',      color: 'bg-emerald-100 text-emerald-700', Icon: Plus    },
  UPDATE: { label: 'Modificat',  color: 'bg-amber-100 text-amber-700',     Icon: Edit2   },
  DELETE: { label: 'Șters',      color: 'bg-red-100 text-red-700',         Icon: Trash2  },
  LOGIN:  { label: 'Autentificat',color: 'bg-blue-100 text-blue-700',      Icon: LogIn   },
  LOGOUT: { label: 'Deconectat', color: 'bg-slate-100 text-slate-600',     Icon: LogOut  },
};

// CORECTAT: Înlocuit Comandă cu Document și păstrat restul conform cerinței
const ENTITY_LABELS = {
  Order: 'Document',
  Invoice: 'Factură',
  User: 'Utilizator',
  Stock: 'Stoc',
  Product: 'Produs'
};

const fmt = (iso) => {
  const d = new Date(iso);
  return d.toLocaleDateString('ro-RO', { day: '2-digit', month: '2-digit', year: 'numeric' })
    + ' ' + d.toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' });
};

// Formatare RON utilă pentru afișarea sumei la documente
const formatRON = (n) =>
  new Intl.NumberFormat('ro-RO', { minimumFractionDigits: 0 }).format(Math.round(n || 0)) + ' RON';

// Compară before/after și returnează câmpurile modificate
const getDiff = (before, after) => {
  if (!before || !after) return [];
  const skip = ['_id', '__v', 'updatedAt', 'createdAt', 'password'];
  return Object.keys(after)
    .filter(k => !skip.includes(k) && JSON.stringify(before[k]) !== JSON.stringify(after[k]))
    .map(k => ({ field: k, before: before[k], after: after[k] }));
};

// ── sub-componente ────────────────────────────────────────────────────────────

const DiffRow = ({ field, before, after }) => (
  <div className="flex items-start gap-2 text-[11.5px] py-1 border-b border-[#f0f8f9] last:border-0">
    <span className="text-[#8ab0b8] w-28 shrink-0 font-medium">{field}</span>
    <span className="line-through text-red-400 max-w-[180px] truncate">
      {String(before ?? '—')}
    </span>
    <span className="text-[#8ab0b8] mx-1">→</span>
    <span className="text-emerald-600 max-w-[180px] truncate">
      {String(after ?? '—')}
    </span>
  </div>
);

const LogRow = ({ log }) => {
  const [open, setOpen] = useState(false);
  const { isManager } = useAuth(); // Preluăm rolul pentru a decide ce detalii afișăm
  
  const cfg  = ACTION_CONFIG[log.action] || ACTION_CONFIG.UPDATE;
  const diff = log.changes ? getDiff(log.changes.before, log.changes.after) : [];
  const hasDiff = diff.length > 0;

  // Logica optimizată de afișare dinamică și securizată în coloana de entitate
  const renderEntityDetails = () => {
    if (log.entity === 'User') {
      // 1. Când este utilizator, nu apare numele lui în textul secundar
      return null;
    }

    if (log.entity === 'Order') {
      // _txData is live data fetched from the Transaction collection (works for all entries)
      const tx     = log._txData;
      const after  = log.changes?.after?.data || log.changes?.after;
      const before = log.changes?.before;
      const docNr     = tx?.documentNumber || after?.documentNumber || before?.documentNumber || null;
      const docStatus = tx?.status || after?.status || before?.status || null;
      // entityName may be old verbose format "Aprobare — Cheltuială..." or new short "Aprobare"
      const label = (log.entityName || '').split(/\s*—/)[0].trim()
                 || (log.action === 'CREATE' ? 'Document nou' : '');

      return (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[12px] font-medium text-[#0d2b32]">
            {label}{docNr ? ` - ${docNr}` : ''}
          </span>
        </div>
      );
    }

    if (log.entity === 'Stock') {
      // after may be nested { success, data } (old entries) or flat (new entries)
      const after  = log.changes?.after?.data || log.changes?.after;
      const before = log.changes?.before;
      // _stockFallback is populated by the backend for old CREATE entries with no changes stored
      const fb = log._stockFallback;

      const name = after?.name || before?.name || fb?.name || log.entityName;
      // quantity reflects the state AT THE TIME of the action:
      // DELETE → what it was before; CREATE/UPDATE → what it became after
      const qty  = log.action === 'DELETE'
        ? (before?.quantity ?? null)
        : (after?.quantity  ?? null);
      const unit = after?.unit || before?.unit || fb?.unit || 'buc.';

      return (
        <div className="flex items-center gap-2">
          <span className="text-[#0d2b32] font-medium">{name}</span>
          {qty !== null && (
            <span className="text-[11px] bg-[#f0f8fa] text-[#6b9aa5] font-medium px-2 py-0.5 rounded-md border border-[#d8edf0]">
              {qty} {unit}
            </span>
          )}
        </div>
      );
    }

    return log.entityName;
  };

  return (
    <>
      <tr
        className={`border-b border-[#edf5f7] transition-colors ${hasDiff ? 'cursor-pointer hover:bg-[#f9fdfd]' : ''}`}
        onClick={() => hasDiff && setOpen(o => !o)}
      >
        {/* Acțiune */}
        <td className="px-5 py-3">
          <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full ${cfg.color}`}>
            <cfg.Icon size={11} />
            {cfg.label}
          </span>
        </td>

        {/* Entitate */}
        <td className="px-5 py-3 text-[12px]">
          <span className="text-[#8ab0b8] mr-2 font-normal">
            {ENTITY_LABELS[log.entity] || log.entity}
          </span>
          <div className="inline-block align-middle">
            {renderEntityDetails()}
          </div>
        </td>

        {/* Utilizator */}
        <td className="px-5 py-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[9px] font-bold shrink-0"
              style={{ background: 'linear-gradient(135deg,#00c9b1,#0096a0)' }}>
              {log.userName?.split(' ').map(n => n[0]).join('').slice(0, 2)}
            </div>
            <span className="text-[12px] text-[#0d2b32]">{log.userName}</span>
          </div>
        </td>

        {/* Data */}
        <td className="px-5 py-3 text-[12px] text-[#8ab0b8]">{fmt(log.createdAt)}</td>

        {/* Expand */}
        <td className="px-5 py-3 text-right">
          {hasDiff && (
            <span className="text-[#8ab0b8]">
              {open ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
            </span>
          )}
        </td>
      </tr>

      {/* Diff expandabil */}
      {open && hasDiff && (
        <tr className="bg-[#f5fcfc]">
          <td colSpan={5} className="px-8 py-3">
            <p className="text-[10px] font-semibold text-[#8ab0b8] uppercase tracking-wider mb-2">
              Modificări ({diff.length})
            </p>
            {diff.map(d => <DiffRow key={d.field} {...d} />)}
          </td>
        </tr>
      )}
    </>
  );
};

// ── pagina principală ─────────────────────────────────────────────────────────

export default function AuditLogPage() {
  const [logs,       setLogs]       = useState([]);
  const [total,      setTotal]      = useState(0);
  const [pages,      setPages]      = useState(1);
  const [page,       setPage]       = useState(1);
  const [loading,    setLoading]    = useState(true);
  const [users,      setUsers]      = useState([]);   
  const [pendingCount, setPendingCount] = useState(0); 

  const [filters, setFilters] = useState({
    entity: '', action: '', userId: '', startDate: '', endDate: ''
  });

  const { user, isManager } = useAuth();

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 50 });
      Object.entries(filters).forEach(([k, v]) => v && params.append(k, v));

      const token = sessionStorage.getItem('ef_token');
      const res   = await fetch(`/api/audit?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data  = await res.json();
      console.log('AUDIT RESPONSE:', data);
      setLogs(data.logs || []);
      setTotal(data.total || 0);
      setPages(data.pages || 1);
    }  catch(err) {
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

  const setFilter = (key, val) => {
    setFilters(f => ({ ...f, [key]: val }));
    setPage(1);
  };

  const resetFilters = () => {
    setFilters({ entity: '', action: '', userId: '', startDate: '', endDate: '' });
    setPage(1);
  };

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'transparent' }}>
      <Sidebar pendingCount={pendingCount} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar title="Audit Log" subtitle={`${total} înregistrări`} showSearch={false} />

        <main className="flex-1 overflow-y-auto px-7 pb-6 mt-6 space-y-4">

          {/* ── Filtre ── */}
          <div className="bg-white rounded-2xl border border-[#d8edf0] px-5 py-4">
            <div className="flex items-center gap-3 flex-wrap">
              <Filter size={14} className="text-[#8ab0b8]" />

              {/* REPARAT: Filtrul conține doar opțiunile Document (Order), Utilizator (User) și Stoc (Stock) */}
              <select value={filters.entity} onChange={e => setFilter('entity', e.target.value)}
                className="text-[12px] border border-[#d8edf0] rounded-lg px-3 py-1.5 text-[#6b9aa5] outline-none focus:border-[#00c9b1] bg-white font-medium">
                <option value="">Toate entitățile</option>
                {[
                  { key: 'Order', label: 'Document' },
                  { key: 'User',  label: 'Utilizator' },
                  { key: 'Stock', label: 'Stoc' }
                ].map(e =>
                  <option key={e.key} value={e.key}>{e.label}</option>
                )}
              </select>

              <select value={filters.action} onChange={e => setFilter('action', e.target.value)}
                className="text-[12px] border border-[#d8edf0] rounded-lg px-3 py-1.5 text-[#6b9aa5] outline-none focus:border-[#00c9b1] bg-white">
                <option value="">Toate acțiunile</option>
                {Object.entries(ACTION_CONFIG).map(([k, v]) =>
                  <option key={k} value={k}>{v.label}</option>)}
              </select>

              {isManager && users.length > 0 && (
                <select value={filters.userId} onChange={e => setFilter('userId', e.target.value)}
                  className="text-[12px] border border-[#d8edf0] rounded-lg px-3 py-1.5 text-[#6b9aa5] outline-none focus:border-[#00c9b1] bg-white">
                  <option value="">Toți utilizatorii</option>
                  {users.map(u => <option key={u._id} value={u._id}>{u.userName}</option>)}
                </select>
              )}

              <input type="date" value={filters.startDate}
                onChange={e => setFilter('startDate', e.target.value)}
                className="text-[12px] border border-[#d8edf0] rounded-lg px-3 py-1.5 text-[#6b9aa5] outline-none focus:border-[#00c9b1]" />

              <input type="date" value={filters.endDate}
                onChange={e => setFilter('endDate', e.target.value)}
                className="text-[12px] border border-[#d8edf0] rounded-lg px-3 py-1.5 text-[#6b9aa5] outline-none focus:border-[#00c9b1]" />

              <button onClick={resetFilters}
                className="ml-auto flex items-center gap-1.5 text-[12px] text-[#8ab0b8] hover:text-[#00c9b1] transition-colors">
                <RefreshCw size={13} /> Reset
              </button>
            </div>
          </div>

          {/* ── Tabel ── */}
          <div className="bg-white rounded-2xl border border-[#d8edf0] overflow-hidden">
            {loading ? (
              <div className="flex justify-center py-16">
                <div className="w-8 h-8 border-4 border-[#00c9b1] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : logs.length === 0 ? (
              <div className="text-center py-16 text-[#8ab0b8] text-[13px]">
                Nicio înregistrare găsită.
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="bg-[#f5fcfc] border-b border-[#edf5f7]">
                    {['Acțiune', 'Entitate', 'Utilizator', 'Data', ''].map(h => (
                      <th key={h} className="text-[10px] font-semibold text-[#8ab0b8] uppercase tracking-wider px-5 py-3 text-left">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {logs.map(log => <LogRow key={log._id} log={log} />)}
                </tbody>
              </table>
            )}
          </div>

          {/* ── Paginare ── */}
          {pages > 1 && (
            <div className="flex justify-center gap-2">
              {Array.from({ length: pages }, (_, i) => i + 1).map(p => (
                <button key={p} onClick={() => setPage(p)}
                  className={`w-8 h-8 rounded-lg text-[12px] font-medium transition-colors
                    ${p === page
                      ? 'bg-[#00c9b1] text-white'
                      : 'bg-white border border-[#d8edf0] text-[#6b9aa5] hover:border-[#00c9b1]'}`}>
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