import { TrendingUp, TrendingDown } from 'lucide-react'

export default function DashboardCard({
  label, value, change, changeType = 'up',
  color = 'teal-dark', icon: Icon,
  miniBar, tag, progress, progressLabel, bigNumber, showOrb = true,
}) {
  const isPrimary = color === 'teal-dark'
  const isAccent = color === 'dark-slate'
  const isDark = isPrimary || isAccent

  const bgStyle = isPrimary
    ? { background: 'linear-gradient(135deg,#5b4ad1,#6a63d4)', border: '1px solid rgba(255,255,255,0.18)' }
    : isAccent
      ? { background: 'linear-gradient(135deg,#6a63d4,#b48bd0)', border: '1px solid rgba(255,255,255,0.18)' }
      : color === 'glass'
        ? { background: 'rgba(255,255,255,0.5)', border: '1px solid rgba(180,139,208,0.3)', backdropFilter: 'blur(16px)' }
        : color === 'white-blue'
          ? { background: 'linear-gradient(135deg,rgba(255,255,255,0.62),rgba(143,208,255,0.34))', border: '1px solid rgba(143,208,255,0.38)', backdropFilter: 'blur(16px)' }
          : { background: 'linear-gradient(135deg,rgba(255,255,255,0.6),rgba(243,201,220,0.45))', border: '1px solid rgba(180,139,208,0.3)', backdropFilter: 'blur(16px)' }

  const labelColor = isDark ? 'rgba(255,255,255,0.7)' : '#6a63d4'
  const valueColor = isDark ? '#fff' : '#352a6e'
  const changeColor = changeType === 'up'
    ? (isDark ? '#f3c9dc' : '#5b4ad1')
    : changeType === 'warn'
      ? (color === 'white-blue' ? '#5b4ad1' : (isDark ? '#ffe0a6' : '#b8860b'))
      : (isDark ? '#ffd1e0' : '#d6568f')

  const iconBg = isDark
    ? 'rgba(255,255,255,0.18)'
    : color === 'glass'
      ? 'rgba(91,74,209,0.12)'
      : color === 'white-blue'
        ? 'rgba(143,208,255,0.35)'
        : 'rgba(240,164,196,0.3)'

  const iconColor = isDark ? '#fff'
    : color === 'glass' || color === 'white-blue' ? '#5b4ad1'
      : '#d6568f'

  const miniBarData = [40, 55, 45, 70, 60, 80, 100]

  return (
    <div
      className="rounded-2xl p-5 relative overflow-hidden transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-xl hover:shadow-lavender/30 shadow-lg shadow-lavender/10"
      style={bgStyle}
    >
      {/* Orb effects */}
      {showOrb && (
        <div style={{
          position: 'absolute', top: -28, right: -28, width: 110, height: 110,
          borderRadius: '50%',
          background: isDark
            ? 'radial-gradient(circle,rgba(255,255,255,.22) 0%,transparent 65%)'
            : 'radial-gradient(circle,rgba(180,139,208,.25) 0%,transparent 65%)',
          pointerEvents: 'none',
        }} />
      )}

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
            <div style={{ fontSize: 30, fontWeight: 600, color: valueColor, lineHeight: 1 }}>{bigNumber}</div>
            <div style={{ fontSize: 10, color: labelColor, marginTop: 1 }}>documente</div>
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
        <div style={{ height: 1, background: 'rgba(255,255,255,.15)', margin: '8px 0' }} />
      )}

      {/* Change */}
      {change && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11.5, fontWeight: 500, color: changeColor }}>
          {changeType === 'up'
            ? <TrendingUp size={12} />
            : <TrendingDown size={12} />}
          {change}
        </div>
      )}

      {/* Progress bar (card 3 style) */}
      {progress !== undefined && (
        <div style={{ marginTop: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#6a63d4', marginBottom: 4 }}>
            <span>{progressLabel}</span><span style={{ fontWeight: 500, color: '#352a6e' }}>{progress}%</span>
          </div>
          <div style={{ height: 5, background: 'rgba(180,139,208,0.25)', borderRadius: 10, overflow: 'hidden' }}>
            <div style={{ height: 5, width: `${progress}%`, background: '#5b4ad1', borderRadius: 10 }} />
          </div>
        </div>
      )}

      {/* Mini bars (card 1 style) */}
      {miniBar && (
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 26, marginTop: 10 }}>
          {miniBarData.map((h, i) => (
            <div key={i} style={{
              flex: 1, height: `${h}%`, borderRadius: '3px 3px 0 0',
              background: i === miniBarData.length - 1
                ? (isDark ? '#fff' : '#5b4ad1')
                : (isDark ? 'rgba(255,255,255,.4)' : 'rgba(91,74,209,.3)'),
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
          background: isDark ? 'rgba(255,255,255,.18)' : 'rgba(91,74,209,.1)',
          border: isDark ? '1px solid rgba(255,255,255,.3)' : '1px solid rgba(91,74,209,.3)',
          color: isDark ? '#fff' : '#5b4ad1',
        }}>
          {tag}
        </div>
      )}
    </div>
  )
}
