import { useEffect, useRef, useState } from 'react'

export default function CursorGlow() {
  const [hovering, setHovering] = useState(false)
  const [clicking, setClicking] = useState(false)

  useEffect(() => {
    const root = document.documentElement

    const onMove = (e) => {
      root.style.setProperty('--cx', `${e.clientX}px`)
      root.style.setProperty('--cy', `${e.clientY}px`)

      const el = document.elementFromPoint(e.clientX, e.clientY)
      setHovering(!!el?.closest('button, a, input, select, textarea, [role="button"]'))
    }

    const onDown = () => setClicking(true)
    const onUp = () => setClicking(false)

    window.addEventListener('mousemove', onMove, { passive: true })
    window.addEventListener('mousedown', onDown)
    window.addEventListener('mouseup', onUp)

    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mousedown', onDown)
      window.removeEventListener('mouseup', onUp)
    }
  }, [])

  return (
    <>
      {/* Dot */}
      <div
        className="pointer-events-none fixed top-0 left-0 z-[9999] rounded-full mix-blend-multiply"
        style={{
          width:  clicking ? 5 : hovering ? 10 : 7,
          height: clicking ? 5 : hovering ? 10 : 7,
          background: hovering ? '#f0a4c4' : '#5b4ad1',
          translate: 'var(--cx, -100px) var(--cy, -100px)',
          marginLeft: clicking ? '-2.5px' : hovering ? '-5px' : '-3.5px',
          marginTop:  clicking ? '-2.5px' : hovering ? '-5px' : '-3.5px',
          transition: 'width 0.12s, height 0.12s, background 0.15s, margin 0.12s',
        }}
      />
      {/* Glow */}
      <div
        className="pointer-events-none fixed top-0 left-0 z-[9998] rounded-full"
        style={{
          width: 40,
          height: 40,
          background: hovering
            ? 'radial-gradient(circle, rgba(240,164,196,0.4) 0%, transparent 70%)'
            : 'radial-gradient(circle, rgba(91,74,209,0.22) 0%, transparent 70%)',
          translate: 'var(--cx, -100px) var(--cy, -100px)',
          marginLeft: '-20px',
          marginTop:  '-20px',
          transition: 'background 0.2s',
        }}
      />
    </>
  )
}
