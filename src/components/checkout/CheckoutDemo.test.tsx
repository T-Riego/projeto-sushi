import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { useState } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { createCartLine, getCartTotal } from '../../lib/cart'
import { CheckoutDemo } from './CheckoutDemo'

const signatureLine = createCartLine('box-signature', ['shoyu-extra'], 2)
const checkoutLines = [signatureLine] as const
const checkoutTotal = getCartTotal(checkoutLines)
const flowCss = readFileSync(resolve(process.cwd(), 'src/styles/flows.css'), 'utf8')
const mainSource = readFileSync(resolve(process.cwd(), 'src/main.tsx'), 'utf8')

function ClearingCartHarness({ onComplete }: { onComplete: () => void }) {
  const [lines, setLines] = useState(() => [...checkoutLines])

  return (
    <CheckoutDemo
      open
      lines={lines}
      total={getCartTotal(lines)}
      onClose={vi.fn()}
      onComplete={() => {
        setLines([])
        onComplete()
      }}
    />
  )
}

type RenderCheckoutOptions = {
  open?: boolean
  onClose?: () => void
  onComplete?: () => void
  onReturnToMenu?: () => void
}

function renderCheckout({
  open = true,
  onClose = vi.fn(),
  onComplete = vi.fn(),
  onReturnToMenu,
}: RenderCheckoutOptions = {}) {
  const view = render(
    <CheckoutDemo
      open={open}
      lines={checkoutLines}
      total={checkoutTotal}
      onClose={onClose}
      onComplete={onComplete}
      onReturnToMenu={onReturnToMenu}
    />,
  )

  return {
    ...view,
    rerenderCheckout(nextOpen: boolean) {
      view.rerender(
        <CheckoutDemo
          open={nextOpen}
          lines={checkoutLines}
          total={checkoutTotal}
          onClose={onClose}
          onComplete={onComplete}
          onReturnToMenu={onReturnToMenu}
        />,
      )
    },
  }
}

async function choosePickupAndAdvance(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('radio', { name: 'Retirada' }))
  await user.click(screen.getByRole('button', { name: 'Avançar' }))
}

async function completeContactAndPayment(
  user: ReturnType<typeof userEvent.setup>,
  payment = 'Pix',
) {
  await user.type(screen.getByRole('textbox', { name: 'Nome' }), 'Ana Lima')
  await user.type(
    screen.getByRole('textbox', { name: 'Telefone' }),
    '(31) 99999-1234',
  )
  await user.click(screen.getByRole('radio', { name: payment }))
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('CheckoutDemo', () => {
  it('conclui uma retirada sem campos de endereço e revisa os itens reais', async () => {
    const user = userEvent.setup()
    const onComplete = vi.fn()
    const fetchSpy = vi.fn()
    vi.stubGlobal('fetch', fetchSpy)
    renderCheckout({ onComplete })

    await choosePickupAndAdvance(user)

    expect(screen.getByRole('heading', { name: 'Seus dados' })).toBeInTheDocument()
    expect(screen.queryByRole('textbox', { name: 'Rua ou avenida' })).not.toBeInTheDocument()
    expect(screen.queryByRole('combobox', { name: 'Bairro' })).not.toBeInTheDocument()

    await completeContactAndPayment(user)
    await user.click(screen.getByRole('button', { name: 'Avançar' }))

    expect(screen.getByRole('heading', { name: 'Revise seu pedido' })).toBeInTheDocument()
    expect(screen.getByText('Box Signature')).toBeInTheDocument()
    expect(screen.getByText('Shoyu da casa')).toBeInTheDocument()
    expect(screen.getByText(/2 ×/)).toBeInTheDocument()
    expect(screen.getByText('Retirada')).toBeInTheDocument()
    expect(screen.getByText('Mais rápido')).toBeInTheDocument()
    expect(screen.getByText('Subtotal')).toBeInTheDocument()
    expect(screen.getByText('Taxa demonstrativa')).toBeInTheDocument()
    expect(screen.getByText('Total')).toBeInTheDocument()

    const confirmButton = screen.getByRole('button', {
      name: 'Confirmar pedido simulado',
    })
    const notice = screen.getByRole('note')
    expect(confirmButton.previousElementSibling).toBe(notice)

    await user.click(confirmButton)

    expect(
      screen.getByRole('heading', { name: 'Nenhum pedido foi realizado' }),
    ).toBeInTheDocument()
    expect(screen.getByText(/^AYO-BH-\d{4}$/)).toBeInTheDocument()
    expect(screen.getByText('Retirada')).toBeInTheDocument()
    expect(screen.queryByText('Box Signature')).not.toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Voltar ao cardápio' }),
    ).toBeInTheDocument()
    expect(onComplete).toHaveBeenCalledTimes(1)
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('preserva o total confirmado quando a conclusão limpa a sacola no componente pai', async () => {
    const user = userEvent.setup()
    const onComplete = vi.fn()
    render(<ClearingCartHarness onComplete={onComplete} />)

    await choosePickupAndAdvance(user)
    await completeContactAndPayment(user)
    await user.click(screen.getByRole('button', { name: 'Avançar' }))
    await user.click(
      screen.getByRole('button', { name: 'Confirmar pedido simulado' }),
    )

    expect(
      screen.getByRole('heading', { name: 'Nenhum pedido foi realizado' }),
    ).toBeInTheDocument()
    expect(screen.getByText(/262,00/)).toBeInTheDocument()
    expect(onComplete).toHaveBeenCalledTimes(1)
  })

  it('mostra endereço na entrega e permite trocar bairro fora da área por retirada', async () => {
    const user = userEvent.setup()
    renderCheckout()

    await user.click(screen.getByRole('radio', { name: 'Entrega' }))
    await user.click(screen.getByRole('button', { name: 'Avançar' }))

    expect(screen.getByRole('textbox', { name: 'Rua ou avenida' })).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: 'Número' })).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: 'Complemento' })).toBeInTheDocument()

    await user.selectOptions(
      screen.getByRole('combobox', { name: 'Bairro' }),
      'Outro bairro',
    )

    const outsideStatus = screen.getByRole('status')
    const choosePickupButton = screen.getByRole('button', {
      name: 'Escolher retirada',
    })
    expect(outsideStatus).toHaveTextContent(/fora da área de entrega/i)
    expect(within(outsideStatus).queryByRole('button')).not.toBeInTheDocument()
    expect(outsideStatus.nextElementSibling).toBe(choosePickupButton)

    await user.click(choosePickupButton)

    expect(screen.queryByRole('textbox', { name: 'Rua ou avenida' })).not.toBeInTheDocument()
    expect(screen.getByText(/retirada selecionada/i)).toBeInTheDocument()
  })

  it('conclui uma entrega válida até a confirmação demonstrativa', async () => {
    const user = userEvent.setup()
    let addressWasVisibleOnComplete: boolean | undefined
    const onComplete = vi.fn(() => {
      addressWasVisibleOnComplete = document.body.textContent?.includes(
        'Rua das Acácias',
      )
    })
    renderCheckout({ onComplete })

    await user.click(screen.getByRole('radio', { name: 'Entrega' }))
    await user.click(screen.getByRole('button', { name: 'Avançar' }))
    await completeContactAndPayment(user)
    await user.type(
      screen.getByRole('textbox', { name: 'Rua ou avenida' }),
      'Rua das Acácias',
    )
    await user.type(screen.getByRole('textbox', { name: 'Número' }), '120')
    await user.selectOptions(
      screen.getByRole('combobox', { name: 'Bairro' }),
      'Savassi',
    )
    await user.click(screen.getByRole('button', { name: 'Avançar' }))

    expect(screen.getByRole('heading', { name: 'Revise seu pedido' })).toBeInTheDocument()
    expect(screen.getByText(/Rua das Acácias, 120/)).toBeInTheDocument()
    expect(screen.getByText('Entrega')).toBeInTheDocument()

    await user.click(
      screen.getByRole('button', { name: 'Confirmar pedido simulado' }),
    )

    expect(
      screen.getByRole('heading', { name: 'Nenhum pedido foi realizado' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Entrega')).toBeInTheDocument()
    expect(screen.queryByText(/Rua das Acácias/)).not.toBeInTheDocument()
    expect(addressWasVisibleOnComplete).toBe(false)
    expect(onComplete).toHaveBeenCalledTimes(1)
  })

  it('confirma apenas uma vez quando o formulário recebe submissão duplicada', async () => {
    const user = userEvent.setup()
    const onComplete = vi.fn()
    renderCheckout({ onComplete })

    await choosePickupAndAdvance(user)
    await completeContactAndPayment(user)
    await user.click(screen.getByRole('button', { name: 'Avançar' }))

    const confirmButton = screen.getByRole('button', {
      name: 'Confirmar pedido simulado',
    })
    act(() => {
      confirmButton.click()
      confirmButton.click()
    })

    expect(onComplete).toHaveBeenCalledTimes(1)
    expect(
      screen.getByRole('heading', { name: 'Nenhum pedido foi realizado' }),
    ).toBeInTheDocument()
  })

  it('exige horário ao agendar e mantém o erro próximo ao campo', async () => {
    const user = userEvent.setup()
    renderCheckout()

    await user.click(screen.getByRole('radio', { name: 'Retirada' }))
    await user.click(screen.getByRole('radio', { name: 'Agendar' }))
    await user.click(screen.getByRole('button', { name: 'Avançar' }))

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Revise os campos destacados antes de continuar.',
    )
    const schedule = screen.getByRole('combobox', {
      name: 'Horário agendado',
    })
    expect(schedule).toHaveAccessibleDescription(/escolha um horário/i)

    await user.selectOptions(schedule, '19:30')
    await user.click(screen.getByRole('button', { name: 'Avançar' }))

    expect(screen.getByRole('heading', { name: 'Seus dados' })).toBeInTheDocument()
  })

  it('move o foco para o heading da nova etapa após avançar', async () => {
    const user = userEvent.setup()
    renderCheckout()

    await choosePickupAndAdvance(user)

    const heading = screen.getByRole('heading', { name: 'Seus dados' })
    expect(heading).toHaveAttribute('tabindex', '-1')
    expect(heading).toHaveFocus()
  })

  it('move o foco para o resumo quando a etapa contém erros', async () => {
    const user = userEvent.setup()
    renderCheckout()

    await user.click(screen.getByRole('button', { name: 'Avançar' }))

    const summary = screen.getByRole('alert')
    expect(summary).toHaveAttribute('tabindex', '-1')
    expect(summary).toHaveFocus()
  })

  it('mantém o foco no campo enquanto a pessoa corrige múltiplos erros', async () => {
    const user = userEvent.setup()
    renderCheckout()

    await choosePickupAndAdvance(user)
    await user.click(screen.getByRole('button', { name: 'Avançar' }))
    const nameInput = screen.getByRole('textbox', { name: 'Nome' })

    await user.type(nameInput, 'Ana')

    expect(nameInput).toHaveValue('Ana')
    expect(nameInput).toHaveFocus()
  })

  it('oferece apenas escolhas textuais de pagamento sem coletar cartão ou documento', async () => {
    const user = userEvent.setup()
    renderCheckout()

    await choosePickupAndAdvance(user)

    expect(screen.getByRole('radio', { name: 'Pix' })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: 'Cartão na entrega' })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: 'Dinheiro' })).toBeInTheDocument()

    await user.click(screen.getByRole('radio', { name: 'Cartão na entrega' }))

    expect(
      screen.queryByRole('textbox', { name: /cartão|chave|documento/i }),
    ).not.toBeInTheDocument()
    expect(document.querySelector('input[type="password"]')).toBeNull()
  })

  it('limpa dados pessoais e volta ao primeiro passo ao fechar e reabrir', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    const view = renderCheckout({ onClose })

    await choosePickupAndAdvance(user)
    await user.type(screen.getByRole('textbox', { name: 'Nome' }), 'Ana Lima')
    await user.type(
      screen.getByRole('textbox', { name: 'Telefone' }),
      '(31) 99999-1234',
    )
    await user.type(
      screen.getByRole('textbox', { name: 'Observação opcional' }),
      'Sem gengibre',
    )

    await user.click(screen.getByRole('button', { name: 'Fechar checkout' }))
    expect(onClose).toHaveBeenCalledTimes(1)

    view.rerenderCheckout(false)
    view.rerenderCheckout(true)

    expect(
      screen.getByRole('heading', { name: 'Modalidade e horário' }),
    ).toBeInTheDocument()
    await choosePickupAndAdvance(user)

    expect(screen.getByRole('textbox', { name: 'Nome' })).toHaveValue('')
    expect(screen.getByRole('textbox', { name: 'Telefone' })).toHaveValue('')
    expect(screen.getByRole('textbox', { name: 'Observação opcional' })).toHaveValue(
      '',
    )
  })

  it('não mantém PII visível na confirmação e reabre com os campos vazios', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    const onReturnToMenu = vi.fn()
    const view = renderCheckout({ onClose, onReturnToMenu })

    await user.click(screen.getByRole('radio', { name: 'Entrega' }))
    await user.click(screen.getByRole('button', { name: 'Avançar' }))
    await user.type(
      screen.getByRole('textbox', { name: 'Nome' }),
      'Pessoa Confidencial',
    )
    await user.type(
      screen.getByRole('textbox', { name: 'Telefone' }),
      '(31) 98888-7777',
    )
    await user.type(
      screen.getByRole('textbox', { name: 'Rua ou avenida' }),
      'Rua Confidencial',
    )
    await user.type(screen.getByRole('textbox', { name: 'Número' }), '99')
    await user.selectOptions(
      screen.getByRole('combobox', { name: 'Bairro' }),
      'Savassi',
    )
    await user.click(screen.getByRole('radio', { name: 'Pix' }))
    await user.type(
      screen.getByRole('textbox', { name: 'Observação opcional' }),
      'Observação sigilosa',
    )
    await user.click(screen.getByRole('button', { name: 'Avançar' }))
    await user.click(
      screen.getByRole('button', { name: 'Confirmar pedido simulado' }),
    )

    expect(screen.queryByText('Pessoa Confidencial')).not.toBeInTheDocument()
    expect(screen.queryByText('(31) 98888-7777')).not.toBeInTheDocument()
    expect(screen.queryByText(/Rua Confidencial/)).not.toBeInTheDocument()
    expect(screen.queryByText('Observação sigilosa')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Voltar ao cardápio' }))
    expect(onReturnToMenu).toHaveBeenCalledTimes(1)
    expect(onClose).not.toHaveBeenCalled()
    view.rerenderCheckout(false)
    view.rerenderCheckout(true)
    await user.click(screen.getByRole('radio', { name: 'Entrega' }))
    await user.click(screen.getByRole('button', { name: 'Avançar' }))

    expect(screen.getByRole('textbox', { name: 'Nome' })).toHaveValue('')
    expect(screen.getByRole('textbox', { name: 'Telefone' })).toHaveValue('')
    expect(screen.getByRole('textbox', { name: 'Rua ou avenida' })).toHaveValue('')
    expect(screen.getByRole('textbox', { name: 'Número' })).toHaveValue('')
    expect(screen.getByRole('combobox', { name: 'Bairro' })).toHaveValue('')
    expect(screen.getByRole('textbox', { name: 'Observação opcional' })).toHaveValue(
      '',
    )
    expect(screen.getByRole('radio', { name: 'Pix' })).not.toBeChecked()
    expect(screen.getByRole('radio', { name: 'Cartão na entrega' })).not.toBeChecked()
    expect(screen.getByRole('radio', { name: 'Dinheiro' })).not.toBeChecked()
  })

  it('notifica o fechamento uma vez quando Escape dispara cancel repetido', () => {
    const onClose = vi.fn()
    renderCheckout({ onClose })
    const dialog = screen.getByRole('dialog', { name: 'Checkout demonstrativo' })

    fireEvent(dialog, new Event('cancel', { cancelable: true }))
    fireEvent(dialog, new Event('cancel', { cancelable: true }))

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('abre como diálogo rotulado, foca o fechamento e mantém controles navegáveis', async () => {
    const user = userEvent.setup()
    renderCheckout()

    const dialog = screen.getByRole('dialog', { name: 'Checkout demonstrativo' })
    const closeButton = within(dialog).getByRole('button', {
      name: 'Fechar checkout',
    })
    expect(closeButton).toHaveFocus()
    expect(within(dialog).getByRole('radio', { name: 'Entrega' })).toBeInTheDocument()
    expect(within(dialog).getByRole('radio', { name: 'Mais rápido' })).toBeInTheDocument()

    await user.tab()
    expect(within(dialog).getByRole('radio', { name: 'Entrega' })).toHaveFocus()
  })

  it('mantém o contrato visual responsivo, isolado e sem ornamentos pesados', () => {
    const classNames = [...flowCss.matchAll(/\.([a-z][a-z0-9-]*)/g)].map(
      ([, className]) => className,
    )
    const undersizedText = [...flowCss.matchAll(/font-size:\s*(\d+(?:\.\d+)?)px/g)]
      .map(([, size]) => Number(size))
      .filter((size) => size < 12)

    expect(classNames.length).toBeGreaterThan(0)
    expect(
      classNames.every(
        (className) =>
          className.startsWith('flow-') ||
          className.startsWith('checkout-') ||
          className.startsWith('demo-') ||
          className.startsWith('cart-'),
      ),
    ).toBe(true)
    expect(flowCss).toMatch(
      /\.checkout-dialog\s*\{[^}]*z-index:\s*(?:1[1-9]\d|[2-9]\d{2,})[^}]*width:\s*min\(640px,\s*100%\)/s,
    )
    expect(flowCss).toMatch(
      /\.checkout-dialog\s*\{[^}]*--flow-control-border:\s*color-mix\(in srgb,\s*var\(--line\) 50%,\s*var\(--ink\)\)/s,
    )
    expect(flowCss).toMatch(
      /\.checkout-header\s*\{[^}]*flex:\s*0\s+0\s+auto/s,
    )
    expect(flowCss).toMatch(
      /\.checkout-content\s*\{[^}]*overflow-y:\s*auto/s,
    )
    expect(flowCss).toMatch(
      /\.checkout-footer\s*\{[^}]*flex:\s*0\s+0\s+auto/s,
    )
    expect(flowCss).toMatch(
      /\.flow-field\s+:is\(input,\s*select,\s*textarea\)\s*\{[^}]*min-height:\s*44px[^}]*border:\s*1px solid var\(--flow-control-border\)/s,
    )
    expect(flowCss).toMatch(/\.demo-notice\s*\{[^}]*color:\s*var\(--ink\)/s)
    expect(flowCss).toMatch(
      /@media\s*\(max-width:\s*640px\)[\s\S]*\.checkout-dialog\s*\{[^}]*inset:\s*auto\s+0\s+0[^}]*width:\s*100%/,
    )
    expect(flowCss).toMatch(/@media\s*\(prefers-reduced-motion:\s*reduce\)/)
    expect(flowCss).not.toMatch(/gradient\(/)
    expect(flowCss).not.toMatch(/box-shadow\s*:/)
    expect(flowCss).not.toContain('color: var(--muted);')
    expect(flowCss).toContain(
      'color: color-mix(in srgb, var(--muted) 80%, var(--ink));',
    )
    expect(undersizedText).toEqual([])
    expect(mainSource).toMatch(
      /import '\.\/styles\/catalog\.css'\s*;?\s*import '\.\/styles\/flows\.css'/,
    )
  })
})
