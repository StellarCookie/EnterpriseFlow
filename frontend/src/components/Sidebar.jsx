import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, Receipt, Package,
  Users, Settings, LogOut, TrendingUp, ChevronsRight
} from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { ClipboardList } from 'lucide-react'

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Tablou de bord', section: 'principal' },
  { to: '/tranzactii', icon: Receipt, label: 'Tranzacții', section: 'principal', badge: true },
  { to: '/stocuri', icon: Package, label: 'Stocuri', section: 'principal' },
  { to: '/utilizatori', icon: Users, label: 'Utilizatori', section: 'sistem', managerOnly: true },
  { to: '/audit', icon: ClipboardList, label: 'Audit Log', section: 'sistem', managerOnly: true },
  { to: '/configurare', icon: Settings, label: 'Setări', section: 'sistem' },
]

const sidebarVariants = {
  expanded: { width: '224px', transition: { type: 'spring', stiffness: 350, damping: 35 } },
  collapsed: { width: '64px', transition: { type: 'spring', stiffness: 350, damping: 35 } },
}

const labelVariants = {
  expanded: { opacity: 1, x: 0, display: 'block', transition: { delay: 0.05, duration: 0.2 } },
  collapsed: { opacity: 0, x: -8, transitionEnd: { display: 'none' }, transition: { duration: 0.15 } },
}

const sectionLabelVariants = {
  expanded: { opacity: 1, height: 'auto', transition: { delay: 0.05, duration: 0.2 } },
  collapsed: { opacity: 0, height: 0, transition: { duration: 0.15 } },
}

export default function Sidebar({ pendingCount = 0 }) {
  const { user, logout, isManager, isAngajat } = useAuth()
  const navigate = useNavigate()
  const [collapsed, setCollapsed] = useState(false)

  const handleLogout =  async () => {
    await logout()
    navigate('/login')
  }

  const principalItems = navItems.filter(i =>
    i.section === 'principal' &&
    (!i.managerOnly || isManager)
  )
  const sistemItems = navItems.filter(i =>
    i.section === 'sistem' &&
    (!i.managerOnly || isManager)
  )

  const initials = user
    ? `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase()
    : 'U'

  return (
    <motion.aside
      variants={sidebarVariants}
      animate={collapsed ? 'collapsed' : 'expanded'}
      className="mt-[88px] mb-6 ml-3 mr-3 h-[calc(100vh-7rem)] bg-white/50 backdrop-blur-xl border border-lavender/30 rounded-3xl flex flex-col flex-shrink-0 relative overflow-hidden"
      style={{ boxShadow: '0 8px 32px 0 rgba(91,74,209,0.18)' }}
    >
      {/* Glow effects */}
      <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-lavender/30 blur-2xl pointer-events-none" />
      <div className="absolute bottom-16 -left-12 w-40 h-40 rounded-full bg-pastelpink/30 blur-2xl pointer-events-none" />

      {/* Logo */}
<div className="px-3 py-5 border-b border-lavender/20 flex items-center flex-shrink-0">
  <div className="flex items-center gap-3 min-w-0">
    {/* MODIFICAT: Gradient mai închis și umbră profundă */}
    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#352a6e] to-[#5b4ad1] flex items-center justify-center flex-shrink-0 shadow-lg shadow-[#352a6e]/30">
      <TrendingUp size={18} className="text-white" />
    </div>
    <motion.div variants={labelVariants} className="min-w-0 overflow-hidden">
      {/* MODIFICAT: Textul principal în cel mai închis mov din paletă */}
      <p className="text-[#1c1447] font-semibold text-[15px] leading-tight tracking-tight whitespace-nowrap font-serif">EnterpriseFlow</p>
      {/* MODIFICAT: Subtitlul într-un mov mediu-închis, foarte lizibil */}
      <p className="text-[#5b4ad1] text-[9px] font-semibold tracking-[0.15em] uppercase mt-0.5 whitespace-nowrap">SO Financiar</p>
    </motion.div>
  </div>
</div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-4 overflow-y-auto overflow-x-hidden">
        <motion.p
          variants={sectionLabelVariants}
          className="text-blueviolet/50 text-[9px] font-bold tracking-[0.15em] uppercase px-2 mb-2 overflow-hidden"
        >
          Principal
        </motion.p>

        {principalItems.map(({ to, icon: Icon, label, badge }) => (
          <NavLink
            key={to}
            to={to}
            title={collapsed ? label : undefined}
            className={({ isActive }) =>
              `relative flex items-center gap-2.5 px-2.5 py-2.5 rounded-xl text-sm mb-0.5 transition-all duration-200
               ${isActive
                ? 'bg-gradient-to-r from-periwinkle/20 to-lavender/15 text-periwinkle font-semibold border border-periwinkle/30'
                : 'text-ink/60 hover:text-ink hover:bg-white/50'
              }`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-gradient-to-b from-periwinkle to-lavender rounded-r-full" />
                )}
                <Icon size={16} className="flex-shrink-0" />
                <motion.span variants={labelVariants} className="flex-1 overflow-hidden whitespace-nowrap">
                  {label}
                </motion.span>
                {badge && pendingCount > 0 && (
                  <motion.span variants={labelVariants} className="bg-pastelpink/40 text-[#9d2b54] text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap">
                    {pendingCount}
                  </motion.span>
                )}
              </>
            )}
          </NavLink>
        ))}

        {sistemItems.length > 0 && (
          <>
            <motion.p
              variants={sectionLabelVariants}
              className="text-blueviolet/50 text-[9px] font-bold tracking-[0.15em] uppercase px-2 mb-2 mt-5 overflow-hidden"
            >
              Sistem
            </motion.p>
            {sistemItems.map(({ to, icon: Icon, label }) => (
              <NavLink
                key={to}
                to={to}
                title={collapsed ? label : undefined}
                className={({ isActive }) =>
                  `relative flex items-center gap-2.5 px-2.5 py-2.5 rounded-xl text-sm mb-0.5 transition-all duration-200
                   ${isActive
                    ? 'bg-gradient-to-r from-periwinkle/20 to-lavender/15 text-periwinkle font-semibold border border-periwinkle/30'
                    : 'text-ink/60 hover:text-ink hover:bg-white/50'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-gradient-to-b from-periwinkle to-lavender rounded-r-full" />
                    )}
                    <Icon size={16} className="flex-shrink-0" />
                    <motion.span variants={labelVariants} className="overflow-hidden whitespace-nowrap">
                      {label}
                    </motion.span>
                  </>
                )}
              </NavLink>
            ))}
          </>
        )}
      </nav>

     {/* User card */}
<div className="p-2 border-t border-lavender/20 flex-shrink-0">
  <div className="flex items-center gap-2.5 px-2.5 py-2.5 bg-white/50 border border-lavender/30 rounded-xl min-w-0">
    {/* MODIFICAT: Cercul contului cu gradientul mai închis asortat cu logo-ul */}
    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#352a6e] to-[#5b4ad1] flex items-center justify-center text-white text-xs font-semibold flex-shrink-0 shadow-sm">
      {initials}
    </div>
    <motion.div variants={labelVariants} className="flex-1 min-w-0 overflow-hidden">
      {/* MODIFICAT: Numele utilizatorului în mov închis */}
      <p className="text-[#1c1447] text-xs font-semibold truncate whitespace-nowrap">
        {user?.firstName} {user?.lastName}
      </p>
      {/* MODIFICAT: Rolul utilizatorului în tonul mov mediu */}
      <p className="text-[#5b4ad1] text-[10px] truncate whitespace-nowrap">{user?.role}</p>
    </motion.div>
    <button
      onClick={handleLogout}
      title="Deconectare"
      className="text-ink/40 hover:text-[#9d2b54] transition-colors p-1 flex-shrink-0"
    >
      <LogOut size={14} />
    </button>
  </div>
</div>

      <ToggleClose collapsed={collapsed} setCollapsed={setCollapsed} />
    </motion.aside>
  )
}

const ToggleClose = ({ collapsed, setCollapsed }) => {
  return (
    <motion.button
      layout
      onClick={() => setCollapsed((c) => !c)}
      title={collapsed ? 'Expandeaza meniul' : undefined}
      className="flex items-center w-full border-t border-lavender/20 text-ink/50 hover:text-periwinkle hover:bg-white/50 transition-colors flex-shrink-0"
    >
      <motion.div
        layout
        className="grid h-10 w-10 place-content-center flex-shrink-0"
      >
        <motion.div
          animate={{ rotate: collapsed ? 0 : 180 }}
          transition={{ type: 'spring', stiffness: 350, damping: 35 }}
        >
          <ChevronsRight size={16} />
        </motion.div>
      </motion.div>
      <motion.span
        variants={labelVariants}
        className="text-xs font-medium overflow-hidden whitespace-nowrap"
      >
        Ascunde
      </motion.span>
    </motion.button>
  )
}

