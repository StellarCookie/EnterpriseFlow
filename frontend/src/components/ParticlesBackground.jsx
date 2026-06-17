import { useLayoutEffect } from 'react'

export default function ParticlesBackground({
  colors = ['#5b4ad1', '#b48bd0', '#f0a4c4', '#6a63d4', '#f3c9dc'],
  size = 3,
  countDesktop = 60,
  countTablet = 50,
  countMobile = 40,
  zIndex = 0,
  height = '100vh',
}) {
  useLayoutEffect(() => {
    // Remove any existing particles instance
    const existing = document.getElementById('js-particles-canvas')
    if (existing) existing.remove()

    const script = document.createElement('script')
    script.id = 'particles-script'
    script.src = 'https://cdn.jsdelivr.net/particles.js/2.0.0/particles.min.js'

    script.onload = () => {
      const particlesElement = document.getElementById('js-particles')
      if (!particlesElement || !window.particlesJS) return

      const getCount = () => {
        const w = window.innerWidth
        if (w > 1024) return countDesktop
        if (w > 768) return countTablet
        return countMobile
      }

      window.particlesJS('js-particles', {
        particles: {
          number: { value: getCount() },
          color: { value: colors },
          shape: { type: 'circle' },
          opacity: { value: 0.7, random: true },
          size: { value: size, random: true },
          line_linked: { enable: false },
          move: {
            enable: true,
            speed: 1.2,
            direction: 'none',
            random: true,
            straight: false,
            out_mode: 'out',
          },
        },
        interactivity: {
          detect_on: 'canvas',
          events: {
            onhover: { enable: false },
            onclick: { enable: false },
            resize: true,
          },
        },
        retina_detect: true,
      })
    }

    document.body.appendChild(script)

    return () => {
      const s = document.getElementById('particles-script')
      if (s) s.remove()
      // Destroy particles instance if possible
      if (window.pJSDom && window.pJSDom.length > 0) {
        window.pJSDom.forEach(p => p.pJS?.fn?.vendors?.destroypJS?.())
        window.pJSDom = []
      }
    }
  }, [colors, size, countDesktop, countTablet, countMobile])

  return (
    <div
      id="js-particles"
      style={{
        width: '100%',
        height,
        position: 'fixed',
        top: 0,
        left: 0,
        zIndex,
        pointerEvents: 'none',
      }}
    >
      <style>{`
        #js-particles canvas {
          position: absolute;
          width: 100% !important;
          height: 100% !important;
        }
      `}</style>

      {/* Glow filter */}
      <svg style={{ position: 'absolute', width: 0, height: 0 }}>
        <defs>
          <filter id="particle-glow">
            <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
      </svg>
    </div>
  )
}
