import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import MeshGradientBackground from './components/MeshGradientBackground'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Tranzactii from './pages/Tranzactii'
import Stocuri from './pages/Stocuri'
import Utilizatori from './pages/Utilizatori'
import AuditLog from './pages/AuditLog'
import Setari from './pages/Setari';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div style={{ position: 'relative', minHeight: '100vh', background: 'transparent' }}>

          {/* Mesh gradient background — visible on every page, reacts to cursor + clicks */}
          <MeshGradientBackground />

          <div style={{ position: 'relative', zIndex: 1 }}>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/" element={<Navigate to="/dashboard" replace />} />

              <Route path="/dashboard" element={
                <ProtectedRoute><Dashboard /></ProtectedRoute>
              } />

              <Route path="/tranzactii" element={
                <ProtectedRoute><Tranzactii /></ProtectedRoute>
              } />

              <Route path="/stocuri" element={
                <ProtectedRoute><Stocuri /></ProtectedRoute>
              } />

              <Route path="/utilizatori" element={
                <ProtectedRoute requiredRole="Manager"><Utilizatori /></ProtectedRoute>
              } />

              <Route path="/audit" element={
                <ProtectedRoute requiredRole="Manager"><AuditLog /></ProtectedRoute>
              } />

             {/* Înlocuiește vechea rută cu aceasta */}
<Route 
  path="/configurare" 
  element={
    <ProtectedRoute>
      <Setari />
    </ProtectedRoute>
  } 
/>

              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </div>

        </div>
      </BrowserRouter>
    </AuthProvider>
  )
}
