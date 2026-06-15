import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { TrendingUp, Eye, EyeOff, LogIn } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import ColorBends from '../components/ColorBends'
import BlurText from '../components/BlurText'
import { motion } from 'motion/react'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.message || 'Eroare de autentificare. Încearcă din nou.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full relative flex items-center justify-center overflow-hidden bg-[#1a2e38]">

      {/* Full-screen animated background */}
      <div className="absolute inset-0 z-0">
        <ColorBends
          rotation={90}
          speed={0.2}
          colors={["#0d4a52"]}
          transparent
          autoRotate={0}
          scale={1}
          frequency={1}
          warpStrength={1}
          mouseInfluence={1}
          parallax={0.5}
          noise={0.15}
          iterations={1}
          intensity={1.5}
          bandWidth={6}
        />
      </div>

      {/* Subtle overlay for readability */}
      <div className="absolute inset-0 z-10 bg-cyan/50" />

      {/* Content */}
      <div className="relative z-20 w-full max-w-lg mx-auto px-6">

        {/* Logo + titles */}
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center gap-3 mb-6">
            <motion.div
              className="w-14 h-14 rounded-xl bg-white/10 border border-white/20 backdrop-blur-sm flex items-center justify-center"
              initial={{ filter: 'blur(10px)', opacity: 0, y: -50 }}
              animate={{ filter: 'blur(0px)', opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: 'easeOut' }}
            >
              <TrendingUp size={26} className="text-white" />
            </motion.div>
            <div>
              <BlurText
                text="EnterpriseFlow"
                animateBy="letters"
                direction="top"
                delay={60}
                threshold={0}
                rootMargin="0px"
                className="text-white font-semibold text-2xl leading-tight tracking-tight"
              />
              <BlurText
                text="Financial OS"
                animateBy="letters"
                direction="top"
                delay={60}
                threshold={0}
                rootMargin="0px"
                className="text-white/40 text-[11px] font-medium tracking-[0.18em] uppercase"
              />
            </div>
          </div>

          <h1
            className="text-3xl font-light text-white text-center leading-snug mb-1"
            style={{ fontFamily: 'Georgia, serif' }}
          >
            Bun venit!
          </h1>
          <p className="text-white/45 text-sm text-center">
            Autentifică-te pentru a continua
          </p>
        </div>

        {/* Glass card */}
        <div className="bg-white/[0.08] backdrop-blur-xl border border-white/[0.12] rounded-2xl px-8 py-14 shadow-2xl">

          {error && (
            <div className="bg-red-500/10 border border-red-400/30 text-red-200 text-sm px-4 py-3 rounded-xl mb-5">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-[10.5px] font-semibold text-white/50 uppercase tracking-widest mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-4 py-3.5 text-sm bg-white/[0.07] border border-white/[0.12] rounded-xl
                           text-white placeholder-white/30 outline-none
                           hover:bg-white/[0.11] hover:border-white/30
                           focus:border-white/60 focus:bg-white/[0.11]
                           transition-[border-color,background-color] duration-150"
                placeholder="email@companie.ro"
                required
                autoComplete="email"
              />
            </div>

            <div>
              <label className="block text-[10.5px] font-semibold text-white/50 uppercase tracking-widest mb-1.5">
                Parolă
              </label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full px-4 py-3.5 pr-11 text-sm bg-white/[0.07] border border-white/[0.12] rounded-xl
                             text-white placeholder-white/30 outline-none
                             hover:bg-white/[0.11] hover:border-white/30
                             focus:border-white/60 focus:bg-white/[0.11]
                             transition-[border-color,background-color] duration-150"
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                >
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3.5 mt-1
                         bg-white text-navy text-sm font-semibold rounded-xl
                         hover:bg-white/90 transition-all shadow-lg shadow-black/20
                         disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-navy/30 border-t-navy rounded-full animate-spin" />
                  Se autentifică...
                </>
              ) : (
                <>
                  <LogIn size={15} />
                  Autentificare
                </>
              )}
            </button>
          </form>

          {/* Demo accounts */}
          <div className="mt-5 pt-5 border-t border-white/[0.08]">
            <p className="text-[9.5px] font-bold text-white/30 uppercase tracking-widest mb-2.5">
              Conturi demo
            </p>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-white/55">manager@demo.ro</span>
                <span className="text-white/30">parola123 · Manager</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-white/55">angajat@demo.ro</span>
                <span className="text-white/30">parola123 · Angajat</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
