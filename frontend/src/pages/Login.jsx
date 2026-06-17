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
    <div className="min-h-screen w-full relative flex items-center justify-center overflow-hidden bg-[#f0f3fa]">

      {/* Full-screen animated background - Fără roz, doar nuanțele reci/profunde din dashboard */}
      <div className="absolute inset-0 z-0">
        <ColorBends
          rotation={90}
          speed={0.2}
          colors={["#5b4ad1", "#6a63d4", "#b48bd0", "#e2e8f5", "#f0f3fa"]}
          transparent
          autoRotate={0}
          scale={1}
          frequency={1}
          warpStrength={1}
          mouseInfluence={1}
          parallax={0.5}
          noise={0.12}
          iterations={1}
          intensity={1.4}
          bandWidth={6}
        />
      </div>

      {/* Overlay subtil pentru difuzie curată */}
      <div className="absolute inset-0 z-10 bg-white/20 backdrop-blur-[1px]" />

      {/* Content */}
      <div className="relative z-20 w-full max-w-lg mx-auto px-6">

        {/* Logo + titles */}
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center gap-3 mb-6">
            <motion.div
              className="w-14 h-14 rounded-xl bg-[#5b4ad1]/10 border border-[#b48bd0]/40 backdrop-blur-md flex items-center justify-center"
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
                className="text-[#6a63d4]/70 text-[11px] font-medium tracking-[0.18em] uppercase"
              />
            </div>
          </div>

          <h1
            className="text-3xl font-light text-[#352a6e] text-center leading-snug mb-1"
            style={{ fontFamily: 'Georgia, serif' }}
          >
            Bun venit!
          </h1>
          <p className="text-[#6a63d4]/80 text-sm text-center">
            Autentifică-te pentru a continua
          </p>
        </div>

        {/* Glass card - Albastru-indigo foarte deschis, curat și translucid */}
        <div className="bg-[#f5f7fc]/70 backdrop-blur-2xl border border-[#b48bd0]/30 rounded-2xl px-8 py-12 shadow-xl shadow-[#5b4ad1]/10">

          {error && (
            <div className="bg-red-500/10 border border-red-400/20 text-red-600 text-sm px-4 py-3 rounded-xl mb-5">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-[10.5px] font-semibold text-[#352a6e]/80 uppercase tracking-widest mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-4 py-3.5 text-sm bg-white/70 border border-[#b48bd0]/30 rounded-xl
                           text-[#352a6e] placeholder-[#6a63d4]/40 outline-none
                           hover:border-[#5b4ad1]/50 hover:bg-white/90
                           focus:border-[#5b4ad1] focus:bg-white
                           transition-all duration-150"
                placeholder="email@companie.ro"
                required
                autoComplete="email"
              />
            </div>

            <div>
              <label className="block text-[10.5px] font-semibold text-[#352a6e]/80 uppercase tracking-widest mb-1.5">
                Parolă
              </label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full px-4 py-3.5 pr-11 text-sm bg-white/70 border border-[#b48bd0]/30 rounded-xl
                             text-[#352a6e] placeholder-[#6a63d4]/40 outline-none
                             hover:border-[#5b4ad1]/50 hover:bg-white/90
                             focus:border-[#5b4ad1] focus:bg-white
                             transition-all duration-150"
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6a63d4]/50 hover:text-[#5b4ad1] transition-colors"
                >
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3.5 mt-2
                         bg-[#5b4ad1] text-white text-sm font-semibold rounded-xl
                         hover:bg-[#6a63d4] active:scale-[0.99] transition-all shadow-lg shadow-[#5b4ad1]/20
                         disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
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
          <div className="mt-6 pt-5 border-t border-[#b48bd0]/20">
            <p className="text-[9.5px] font-bold text-[#6a63d4]/60 uppercase tracking-widest mb-2.5">
              Conturi demo
            </p>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#352a6e]/70 font-medium">manager@demo.ro</span>
                <span className="text-[#5b4ad1] font-semibold">parola123 · <span className="text-[#6a63d4]/70 font-normal">Manager</span></span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#352a6e]/70 font-medium">angajat@demo.ro</span>
                <span className="text-[#5b4ad1] font-semibold">parola123 · <span className="text-[#6a63d4]/70 font-normal">Angajat</span></span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}