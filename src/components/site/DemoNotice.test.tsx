import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { DemoNotice } from './DemoNotice'

describe('DemoNotice', () => {
  it('expõe o aviso demonstrativo completo com semântica de nota', () => {
    render(<DemoNotice className="demo-notice-review" />)

    const notice = screen.getByRole('note')
    expect(notice).toHaveTextContent(
      'Simulação para portfólio — nenhum pedido ou reserva será realizado e nenhum dado será enviado.',
    )
    expect(notice).toHaveClass('demo-notice', 'demo-notice-review')
  })
})
