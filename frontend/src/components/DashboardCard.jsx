import { TrendingUp, TrendingDown } from 'lucide-react'

export default function DashboardCard({
  label, value, change, changeType = 'up',
  color = 'teal-dark', icon: Icon,
  miniBar, tag, progress, progressLabel, bigNumber,
}) {
  const isDarkTeal = color === 'teal-dark'
  const isDarkSlate = color === 'dark-slate'
  const isDark = isDarkTeal || isDarkSlate

  const bgStyle = isDarkTeal
    ? { background: '#0d4a52', border: '1px solid #0a3840' }
    : isDarkSlate
      ? { background: '#1a2e35', border: '1px solid #223a42' }
      : color === 'glass'
        ? { background: 'rgba(255,255,255,0.82)', border: '1px solid rgba(0,201,177,0.22)' }
        : { background: '#fff', border: '1px solid #dceef2' }

  const labelColor = isDark ? 'rgba(255,255,255,0.45)' : '#6b9aa5'
  const valueColor = isDark ? '#fff' : '#0d2b32'
  const changeColor = changeType === 'up'
    ? (isDark ? '#00c9b1' : '#0f6e56')
    : changeType === 'warn'
      ? '#ef9f27'
      : '#e24b4a'

  const iconBg = isDarkTeal
    ? 'rgba(255,255,255,0.13)'
    : isDarkSlate
      ? 'rgba(226,75,74,0.14)'
      : color === 'glass'
        ? '#e0f7f5'
        : '#faeeda'

  const iconColor = isDarkTeal ? '#fff'
    : isDarkSlate ? '#e24b4a'
      : color === 'glass' ? '#007d72'
        : '#855000'

  const miniBarData = [40, 55, 45, 70, 60, 80, 100]

  return (
    <div className="rounded-2xl p-5 relative overflow-hidden transition-transform duration-200 ease-out hover:-translate-y-1 hover:shadow-xl" style={bgStyle}>
      {/* Orb effects */}
      <div style={{
        position: 'absolute', top: -28, right: -28, width: 110, height: 110,
        borderRadius: '50%',
        background: isDarkTeal
          ? 'radial-gradient(circle,rgba(0,201,177,.25) 0%,transparent 65%)'
          : isDarkSlate
            ? 'radial-gradient(circle,rgba(226,75,74,.15) 0%,transparent 65%)'
            : 'radial-gradient(circle,rgba(0,201,177,.1) 0%,transparent 65%)',
        pointerEvents: 'none',
      }} />

      {/* Icon */}
      {Icon && !bigNumber && (
        <div style={{
          width: 40, height: 40, borderRadius: 11,
          background: iconBg, color: iconColor,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 19, marginBottom: 14,
        }}>
          <Icon size={19} />
        </div>
      )}

      {/* Big number (card 4 style) */}
      {bigNumber !== undefined && (
        <>
          {Icon && (
            <div style={{
              width: 40, height: 40, borderRadius: 11,
              background: iconBg, color: iconColor,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 19, marginBottom: 14,
            }}>
              <Icon size={19} />
            </div>
          )}
          <div style={{ position: 'absolute', top: 18, right: 18, textAlign: 'right' }}>
            <div style={{ fontSize: 30, fontWeight: 600, color: '#fff', lineHeight: 1 }}>{bigNumber}</div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,.35)', marginTop: 1 }}>documente</div>
          </div>
        </>
      )}

      {/* Label */}
      <div style={{
        fontSize: 10, fontWeight: 600, letterSpacing: '0.09em',
        textTransform: 'uppercase', marginBottom: 8,
        color: labelColor,
        marginTop: bigNumber !== undefined ? 28 : 0,
      }}>
        {label}
      </div>

      {/* Value */}
      {!bigNumber && (
        <div style={{
          fontSize: 24, fontWeight: 600, lineHeight: 1,
          marginBottom: 8, letterSpacing: '-0.5px',
          color: valueColor,
        }}>
          {value}
        </div>
      )}

      {/* Divider for dark cards */}
      {isDark && (
        <div style={{ height: 1, background: 'rgba(255,255,255,.08)', margin: '8px 0' }} />
      )}

      {/* Change */}
      {change && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11.5, fontWeight: 500, color: changeColor }}>
          {changeType === 'up'
            ? <TrendingUp size={12} />
            : changeType === 'warn'
              ? <TrendingDown size={12} />
              : <TrendingDown size={12} />}
          {change}
        </div>
      )}

      {/* Progress bar (card 3 style) */}
      {progress !== undefined && (
        <div style={{ marginTop: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#6b9aa5', marginBottom: 4 }}>
            <span>{progressLabel}</span><span style={{ fontWeight: 500, color: '#0d2b32' }}>{progress}%</span>
          </div>
          <div style={{ height: 5, background: '#e0f0f3', borderRadius: 10, overflow: 'hidden' }}>
            <div style={{ height: 5, width: `${progress}%`, background: '#ef9f27', borderRadius: 10 }} />
          </div>
        </div>
      )}

      {/* Mini bars (card 1 style) */}
      {miniBar && (
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 26, marginTop: 10 }}>
          {miniBarData.map((h, i) => (
            <div key={i} style={{
              flex: 1, height: `${h}%`, borderRadius: '3px 3px 0 0',
              background: i === miniBarData.length - 1 ? '#00c9b1' : 'rgba(0,201,177,.3)',
            }} />
          ))}
        </div>
      )}

      {/* Tag */}
      {tag && (
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 4,
          marginTop: 10, fontSize: 10, fontWeight: 600,
          padding: '3px 9px', borderRadius: 20,
          background: isDark ? 'rgba(0,201,177,.15)' : 'transparent',
          border: isDark ? '1px solid rgba(0,201,177,.3)' : '1px solid #00c9b1',
          color: isDark ? '#00c9b1' : '#007d72',
        }}>
          {tag}
        </div>
      )}
    </div>
  )
}
