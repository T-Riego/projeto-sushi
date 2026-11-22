import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { useState } from 'react'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import type { CartLine } from '../../types/menu'
import { CartDrawer } from './CartDrawer'

const flowCss = readFileSync(resolve(process.cwd(), 'src/styles/flows.css'), 'utf8')

const signatureLine: CartLine = {
  key: 'box-signature::shoyu-extra',
  productId: 'box-signature',
  quantity: 2,
  optionIds: ['shoyu-extra'],
}

function renderDrawer(
  overrides: Partial<React.ComponentProps<typeof CartDrawer>> = {},
) {
  const props: React.ComponentProps<typeof CartDrawer> = {
    open: true,
    lines: [signatureLine],
    count: 2,
    total: 262,
    onClose: vi.fn(),
    onChangeQuantity: vi.fn(),
    onRemoveLine: vi.fn(),
    onClearCart: vi.fn(),
    onNotify: vi.fn(),
    ...overrides,
  }

  return { ...render(<CartDrawer {...props} />), props }
}

afterEach(() => {
  document.getElementById('menu')?.remove()
  document.body.style.overflow = ''
})

describe('CartDrawer', () => {
  it('bloqueia o scroll enquanto está aberto e restaura o valor anterior', () => {
    document.body.style.overflow = 'auto'
    const view = renderDrawer()

    expect(document.body.style.overflow).toBe('hidden')

    view.rerender(<CartDrawer {...view.props} open={false} />)

    expect(document.body.style.overflow).toBe('auto')
  })

  it('mostra a linha configurada, preços e aciona quantidade e remoção', async () => {
    const user = userEvent.setup()
    const { props } = renderDrawer()
    const dialog = screen.getByRole('dialog', { name: /Sua sacola/i })

    expect(within(dialog).getByText('Box Signature')).toBeInTheDocument()
    expect(
      within(dialog).getByText('18 peças · serve 2 pessoas'),
    ).toBeInTheDocument()
    expect(within(dialog).getByText('Shoyu da casa')).toBeInTheDocument()
    expect(within(dialog).getByText(/R\$\s*131,00/)).toBeInTheDocument()
    expect(within(dialog).getAllByText(/R\$\s*262,00/)).toHaveLength(2)
    expect(
      within(dialog).getByLabelText('Quantidade de Box Signature'),
    ).toHaveTextContent('2')

    await user.click(
      within(dialog).getByRole('button', {
        name: 'Diminuir quantidade de Box Signature',
      }),
    )
    await user.click(
      within(dialog).getByRole('button', {
        name: 'Aumentar quantidade de Box Signature',
      }),
    )
    await user.click(
      within(dialog).getByRole('button', { name: 'Remover Box Signature' }),
    )

    expect(props.onChangeQuantity).toHaveBeenNthCalledWith(
      1,
      signatureLine.key,
      -1,
    )
    expect(props.onChangeQuantity).toHaveBeenNthCalledWith(
      2,
      signatureLine.key,
      1,
    )
    expect(props.onRemoveLine).toHaveBeenCalledOnce()
    expect(props.onRemoveLine).toHaveBeenCalledWith(signatureLine.key)
  })

  it('fecha o estado vazio e leva ao cardápio', async () => {
    const user = userEvent.setup()
    const menuAnchor = document.createElement('section')
    menuAnchor.id = 'menu'
    menuAnchor.dataset.testid = 'menu-test-anchor'
    document.body.append(menuAnchor)
    const scrollIntoView = vi.mocked(menuAnchor.scrollIntoView)
    const { props } = renderDrawer({ lines: [], count: 0, total: 0 })

    await user.click(
      screen.getByRole('button', { name: 'Explorar o cardápio' }),
    )

    expect(props.onClose).toHaveBeenCalledOnce()
    expect(scrollIntoView).toHaveBeenCalledWith({
      behavior: 'smooth',
      block: 'start',
    })
    expect(
      screen.queryByRole('dialog', { name: /Sua sacola/i }),
    ).not.toBeInTheDocument()
  })

  it('abre o checkout como diálogo irmão e conclui com o snapshot da sacola', async () => {
    const user = userEvent.setup()
    const { props } = renderDrawer()

    await user.click(
      screen.getByRole('button', { name: 'Continuar para checkout' }),
    )

    expect(props.onClose).toHaveBeenCalledOnce()
    expect(
      screen.queryByRole('dialog', { name: /Sua sacola/i }),
    ).not.toBeInTheDocument()
    const checkout = screen.getByRole('dialog', {
      name: 'Checkout demonstrativo',
    })
    const drawer = document.querySelector('.cart-drawer-dialog')
    expect(drawer?.parentElement).toBe(checkout.parentElement)
    expect(drawer).not.toContainElement(checkout)

    await user.click(within(checkout).getByRole('radio', { name: 'Retirada' }))
    await user.click(within(checkout).getByRole('button', { name: 'Avançar' }))
    await user.type(within(checkout).getByRole('textbox', { name: 'Nome' }), 'Ana')
    await user.type(
      within(checkout).getByRole('textbox', { name: 'Telefone' }),
      '(31) 99999-1234',
    )
    await user.click(within(checkout).getByRole('radio', { name: 'Pix' }))
    await user.click(within(checkout).getByRole('button', { name: 'Avançar' }))

    expect(within(checkout).getByText('Box Signature')).toBeInTheDocument()
    expect(within(checkout).getByText('Shoyu da casa')).toBeInTheDocument()
    await user.click(
      within(checkout).getByRole('button', {
        name: 'Confirmar pedido simulado',
      }),
    )

    await waitFor(() => expect(props.onClearCart).toHaveBeenCalledOnce())
    expect(props.onNotify).toHaveBeenCalledOnce()
    expect(
      within(checkout).getByRole('heading', {
        name: 'Nenhum pedido foi realizado',
      }),
    ).toBeInTheDocument()
    expect(within(checkout).getByText(/R\$\s*262,00/)).toBeInTheDocument()
  })

  it('notifica o fechamento uma única vez por Escape e backdrop', () => {
    const first = renderDrawer()
    const escapeDialog = screen.getByRole('dialog', { name: /Sua sacola/i })

    fireEvent(escapeDialog, new Event('cancel', { cancelable: true }))
    fireEvent(escapeDialog, new Event('cancel', { cancelable: true }))

    expect(first.props.onClose).toHaveBeenCalledOnce()
    first.unmount()

    const second = renderDrawer()
    const backdropDialog = screen.getByRole('dialog', { name: /Sua sacola/i })
    fireEvent.click(backdropDialog)
    fireEvent.click(backdropDialog)

    expect(second.props.onClose).toHaveBeenCalledOnce()
  })

  it('anuncia a remoção e move o foco ao remover a última linha', async () => {
    const user = userEvent.setup()

    function RemovingLineHarness() {
      const [lines, setLines] = useState<CartLine[]>([signatureLine])

      return (
        <CartDrawer
          open
          lines={lines}
          count={lines.reduce((sum, line) => sum + line.quantity, 0)}
          total={lines.length > 0 ? 262 : 0}
          onClose={vi.fn()}
          onChangeQuantity={vi.fn()}
          onRemoveLine={() => setLines([])}
          onClearCart={vi.fn()}
        />
      )
    }

    render(<RemovingLineHarness />)
    const liveRegion = document.querySelector('.cart-live-region')
    await user.click(
      screen.getByRole('button', { name: 'Remover Box Signature' }),
    )

    expect(document.querySelector('.cart-live-region')).toBe(liveRegion)
    await waitFor(() =>
      expect(liveRegion).toHaveTextContent('Box Signature removido da sacola.'),
    )
    expect(
      screen.getByRole('button', { name: 'Explorar o cardápio' }),
    ).toHaveFocus()
  })

  it('move o foco para aumentar quando diminuir deixa o mínimo desabilitado', async () => {
    const user = userEvent.setup()

    function QuantityHarness() {
      const [line, setLine] = useState(signatureLine)

      return (
        <CartDrawer
          open
          lines={[line]}
          count={line.quantity}
          total={131 * line.quantity}
          onClose={vi.fn()}
          onChangeQuantity={(_, delta) =>
            setLine((current) => ({
              ...current,
              quantity: current.quantity + delta,
            }))
          }
          onRemoveLine={vi.fn()}
          onClearCart={vi.fn()}
        />
      )
    }

    render(<QuantityHarness />)
    const decrease = screen.getByRole('button', {
      name: 'Diminuir quantidade de Box Signature',
    })
    const increase = screen.getByRole('button', {
      name: 'Aumentar quantidade de Box Signature',
    })

    await user.click(decrease)

    expect(decrease).toBeDisabled()
    expect(increase).toHaveFocus()
  })

  it('mantém o contrato visual lateral, responsivo e acessível', () => {
    const undersizedText = [
      ...flowCss.matchAll(/font-size:\s*(\d+(?:\.\d+)?)px/g),
    ]
      .map(([, size]) => Number(size))
      .filter((size) => size < 12)

    expect(flowCss).toMatch(
      /\.cart-drawer-dialog\s*\{[^}]*z-index:\s*(?:1[7-9]\d|[2-9]\d{2,})[^}]*width:\s*min\(520px,\s*100%\)/s,
    )
    expect(flowCss).toMatch(/\.cart-drawer-header\s*\{[^}]*flex:\s*0\s+0\s+auto/s)
    expect(flowCss).toMatch(/\.cart-drawer-content\s*\{[^}]*overflow-y:\s*auto/s)
    expect(flowCss).toMatch(/\.cart-drawer-footer\s*\{[^}]*flex:\s*0\s+0\s+auto/s)
    expect(flowCss).toMatch(/\.cart-quantity-button\s*\{[^}]*min-width:\s*44px[^}]*min-height:\s*44px/s)
    expect(flowCss).toMatch(
      /\.cart-live-region\s*\{[^}]*position:\s*absolute[^}]*clip-path:\s*inset\(50%\)/s,
    )
    expect(flowCss).toMatch(
      /@media\s*\(max-width:\s*640px\)[\s\S]*\.cart-drawer-dialog\s*\{[^}]*width:\s*100%/,
    )
    expect(flowCss).toMatch(/@media\s*\(prefers-reduced-motion:\s*reduce\)/)
    expect(undersizedText).toEqual([])
  })
})
