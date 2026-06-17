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
    <div className="min-h-screen w-full relative flex items-center justify-center overflow-hidden bg-[#f7f1f8]">

      {/* Full-screen animated background */}
      <div className="absolute inset-0 z-0">
        <ColorBends
          rotation={90}
          speed={0.2}
          colors={["#5b4ad1", "#f0a4c4", "#b48bd0", "#6a63d4", "#f3c9dc"]}
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
      <div className="absolute inset-0 z-10 bg-[#f7f1f8]/30" />

      {/* Content */}
      <div className="relative z-20 w-full max-w-lg mx-auto px-6">

        {/* Logo + titles */}
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center gap-3 mb-6">
            <motion.div
              className="w-14 h-14 rounded-xl bg-[#5b4ad1]/10 border border-[#5b4ad1]/20 backdrop-blur-sm flex items-center justify-center"
              initial={{ filter: 'blur(10px)', opacity: 0, y: -50 }}
              animate={{ filter: 'blur(0px)', opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: 'easeOut' }}
            >
              <TrendingUp size={26} className="text-[#5b4ad1]" />
            </motion.div>
            <div>
              <BlurText
                text="EnterpriseFlow"
                animateBy="letters"
                direction="top"
                delay={60}
                threshold={0}
                rootMargin="0px"
                className="text-[#352a6e] font-semibold text-2xl leading-tight tracking-tight"
              />
              <BlurText
                text="Financial OS"
                animateBy="letters"
                direction="top"
                delay={60}
                threshold={0}
                rootMargin="0px"
                className="text-[#5b4ad1]/60 text-[11px] font-medium tracking-[0.18em] uppercase"
              />
            </div>
          </div>

          <h1
            className="text-3xl font-light text-[#352a6e] text-center leading-snug mb-1"
            style={{ fontFamily: 'Georgia, serif' }}
          >
            Bun venit!
          </h1>
          <p className="text-[#5b4ad1]/70 text-sm text-center">
            Autentifică-te pentru a continua
          </p>
        </div>

        {/* Glass card */}
        <div className="bg-white/60 backdrop-blur-xl border border-[#b48bd0]/30 rounded-2xl px-8 py-14 shadow-2xl">

          {error && (
            <div className="bg-red-500/10 border border-red-400/30 text-red-600 text-sm px-4 py-3 rounded-xl mb-5">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-[10.5px] font-semibold text-[#5b4ad1]/70 uppercase tracking-widest mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-4 py-3.5 text-sm bg-white/50 border border-[#b48bd0]/30 rounded-xl
                           text-[#352a6e] placeholder-[#b48bd0]/60 outline-none
                           hover:border-[#5b4ad1]/40 hover:bg-white/70
                           focus:border-[#5b4ad1]/70 focus:bg-white/70
                           transition-[border-color,background-color] duration-150"
                placeholder="email@companie.ro"
                required
                autoComplete="email"
              />
            </div>

            <div>
              <label className="block text-[10.5px] font-semibold text-[#5b4ad1]/70 uppercase tracking-widest mb-1.5">
                Parolă
              </label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full px-4 py-3.5 pr-11 text-sm bg-white/50 border border-[#b48bd0]/30 rounded-xl
                             text-[#352a6e] placeholder-[#b48bd0]/60 outline-none
                             hover:border-[#5b4ad1]/40 hover:bg-white/70
                             focus:border-[#5b4ad1]/70 focus:bg-white/70
                             transition-[border-color,background-color] duration-150"
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#b48bd0] hover:text-[#5b4ad1] transition-colors"
                >
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3.5 mt-1
                         bg-[#5b4ad1] text-white text-sm font-semibold rounded-xl
                         hover:bg-[#6a63d4] transition-all shadow-lg shadow-[#5b4ad1]/30
                         disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
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
          <div className="mt-5 pt-5 border-t border-[#b48bd0]/20">
            <p className="text-[9.5px] font-bold text-[#5b4ad1]/40 uppercase tracking-widest mb-2.5">
              Conturi demo
            </p>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#352a6e]/70">manager@demo.ro</span>
                <span className="text-[#b48bd0]">parola123 · Manager</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#352a6e]/70">angajat@demo.ro</span>
                <span className="text-[#b48bd0]">parola123 · Angajat</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
