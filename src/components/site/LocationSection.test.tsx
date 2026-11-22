import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { restaurant } from '../../data/restaurant'
import { LocationSection } from './LocationSection'

describe('LocationSection', () => {
  it('apresenta a unidade fictícia, horários, bairros e raio demonstrativo', () => {
    const { container } = render(<LocationSection />)
    const section = container.querySelector<HTMLElement>('#localizacao')

    expect(section).not.toBeNull()
    expect(
      within(section!).getByRole('heading', { name: /AYORUME Savassi/i }),
    ).toBeInTheDocument()
    expect(within(section!).getByText(restaurant.address)).toBeInTheDocument()
    expect(within(section!).getByText('Endereço fictício')).toBeInTheDocument()

    for (const day of [
      'Segunda',
      'Terça',
      'Quarta',
      'Quinta',
      'Sexta',
      'Sábado',
      'Domingo',
    ]) {
      expect(within(section!).getByText(day)).toBeInTheDocument()
    }
    expect(within(section!).getByText('Fechado')).toBeInTheDocument()
    expect(within(section!).getAllByText('18:00 — 22:30')).toHaveLength(3)
    expect(within(section!).getAllByText('18:00 — 23:30')).toHaveLength(2)
    expect(within(section!).getByText('12:00 — 21:30')).toBeInTheDocument()

    for (const neighborhood of restaurant.deliveryNeighborhoods) {
      expect(within(section!).getByText(neighborhood)).toBeInTheDocument()
    }
    expect(within(section!).getByText(/raio demonstrativo de 8 km/i)).toBeInTheDocument()
  })

  it('usa apenas um mapa gráfico e mantém o japonês decorativo fora da leitura', () => {
    const { container } = render(<LocationSection />)
    const section = container.querySelector<HTMLElement>('#localizacao')!
    const decorativeJapanese = section.querySelector('[lang="ja"]')

    expect(section.querySelector('a')).toBeNull()
    expect(section.querySelector('iframe')).toBeNull()
    expect(section.textContent).not.toMatch(/-?\d{2}\.\d{3,}/)
    expect(section.querySelector('[data-graphic-map]')).toBeInTheDocument()
    expect(decorativeJapanese).toHaveAttribute('aria-hidden', 'true')
  })
})
