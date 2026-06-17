import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import MeshGradientBackground from './components/MeshGradientBackground'
import CursorGlow from './components/CursorGlow'
import PageTransition from './components/PageTransition'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Tranzactii from './pages/Tranzactii'
import Stocuri from './pages/Stocuri'
import Utilizatori from './pages/Utilizatori'
import AuditLog from './pages/AuditLog'
import Setari from './pages/Setari'
import ParticlesBackground from './components/ParticlesBackground'

function AnimatedRoutes() {
  const location = useLocation()
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/login" element={<PageTransition><Login /></PageTransition>} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        <Route path="/dashboard" element={
          <ProtectedRoute><PageTransition><Dashboard /></PageTransition></ProtectedRoute>
        } />
        <Route path="/tranzactii" element={
          <ProtectedRoute><PageTransition><Tranzactii /></PageTransition></ProtectedRoute>
        } />
        <Route path="/stocuri" element={
          <ProtectedRoute><PageTransition><Stocuri /></PageTransition></ProtectedRoute>
        } />
        <Route path="/utilizatori" element={
          <ProtectedRoute requiredRole="Manager"><PageTransition><Utilizatori /></PageTransition></ProtectedRoute>
        } />
        <Route path="/audit" element={
          <ProtectedRoute requiredRole="Manager"><PageTransition><AuditLog /></PageTransition></ProtectedRoute>
        } />
        <Route path="/configurare" element={
          <ProtectedRoute><PageTransition><Setari /></PageTransition></ProtectedRoute>
        } />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AnimatePresence>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div style={{ position: 'relative', minHeight: '100vh', background: 'transparent' }}>
          <MeshGradientBackground />
          <ParticlesBackground
  colors={['#5b4ad1', '#b48bd0', '#f0a4c4', '#6a63d4', '#f3c9dc']}
  size={3}
  countDesktop={55}
  countTablet={40}
  countMobile={25}
  zIndex={0}
/>
          <CursorGlow />
          <div style={{ position: 'relative', zIndex: 1 }}>
            <AnimatedRoutes />
          </div>
        </div>
      </BrowserRouter>
    </AuthProvider>
  )
}
