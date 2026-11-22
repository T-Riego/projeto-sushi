import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { MobileActionBar } from './MobileActionBar'

const flowCss = readFileSync(resolve(process.cwd(), 'src/styles/flows.css'), 'utf8')

describe('MobileActionBar', () => {
  it('expõe as três ações e uma contagem acessível', async () => {
    const user = userEvent.setup()
    const onMenu = vi.fn()
    const onOrder = vi.fn()
    const onReservation = vi.fn()

    render(
      <MobileActionBar
        count={2}
        onMenu={onMenu}
        onOrder={onOrder}
        onReservation={onReservation}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Cardápio' }))
    await user.click(
      screen.getByRole('button', { name: 'Pedir, sacola com 2 itens' }),
    )
    await user.click(screen.getByRole('button', { name: 'Reservar' }))

    expect(onMenu).toHaveBeenCalledTimes(1)
    expect(onOrder).toHaveBeenCalledTimes(1)
    expect(onReservation).toHaveBeenCalledTimes(1)
    expect(screen.getByText('02')).toHaveAttribute('aria-hidden', 'true')
  })

  it('mantém o contrato móvel, a área segura e alvos de toque', () => {
    expect(flowCss).toMatch(
      /\.flow-mobile-action-bar\s*\{[^}]*display:\s*none/s,
    )
    expect(flowCss).toMatch(
      /@media\s*\(max-width:\s*640px\)[\s\S]*\.flow-mobile-action-bar\s*\{[^}]*position:\s*fixed[^}]*grid-template-columns:\s*repeat\(3,\s*minmax\(0,\s*1fr\)\)/,
    )
    expect(flowCss).toMatch(/env\(safe-area-inset-bottom\)/)
    expect(flowCss).toMatch(
      /\.flow-mobile-action-button\s*\{[^}]*min-height:\s*44px[^}]*font-size:\s*(?:1[2-9]|[2-9]\d)px/s,
    )
    expect(flowCss).toMatch(
      /\.flow-mobile-action-bar\s*~\s*\[role='status'\]\s*\{[^}]*bottom:\s*calc\(80px\s*\+\s*env\(safe-area-inset-bottom\)\)[^}]*z-index:\s*100/s,
    )
  })
})
