import React from 'react'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import '@testing-library/jest-dom'

jest.mock('../hooks/useAuth', () => ({
  useAuth: jest.fn(),
}))

import { useAuth } from '../hooks/useAuth'
import ProtectedRoute from '../components/ProtectedRoute'

describe('ProtectedRoute', () => {

  test('afișează conținutul protejat când utilizatorul este autentificat', () => {
    useAuth.mockReturnValue({ user: { role: 'Manager' }, loading: false })
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <Routes>
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <div>Dashboard secret</div>
            </ProtectedRoute>
          } />
        </Routes>
      </MemoryRouter>
    )
    expect(screen.getByText('Dashboard secret')).toBeInTheDocument()
  })

  test('redirecționează la login când utilizatorul nu este autentificat', () => {
    useAuth.mockReturnValue({ user: null, loading: false })
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <Routes>
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <div>Dashboard secret</div>
            </ProtectedRoute>
          } />
          <Route path="/login" element={<div>Pagina de login</div>} />
        </Routes>
      </MemoryRouter>
    )
    expect(screen.getByText('Pagina de login')).toBeInTheDocument()
  })

  test('afișează spinner când autentificarea se încarcă', () => {
    useAuth.mockReturnValue({ user: null, loading: true })
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <Routes>
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <div>Dashboard secret</div>
            </ProtectedRoute>
          } />
        </Routes>
      </MemoryRouter>
    )
    expect(screen.getByText('Se încarcă...')).toBeInTheDocument()
  })

})