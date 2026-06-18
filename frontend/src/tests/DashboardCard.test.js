import React from 'react'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import DashboardCard from '../components/DashboardCard'

describe('DashboardCard', () => {

  test('afișează valoarea corect', () => {
    render(<DashboardCard label="Venituri" value="12.500 RON" />)
    expect(screen.getByText('12.500 RON')).toBeInTheDocument()
  })

  test('afișează eticheta (label) corect', () => {
    render(<DashboardCard label="Cheltuieli" value="5.000 RON" />)
    expect(screen.getByText('Cheltuieli')).toBeInTheDocument()
  })

  test('afișează tag-ul dacă este furnizat', () => {
    render(<DashboardCard label="Profit" value="3.000 RON" tag="Luna curentă" />)
    expect(screen.getByText('Luna curentă')).toBeInTheDocument()
  })

})