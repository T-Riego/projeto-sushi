import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import App from './App'
import { CART_STORAGE_KEY } from './lib/cart'

vi.mock('./components/hero/HeroShowcase', () => ({
  HeroShowcase: ({
    onAddProduct,
  }: {
    onAddProduct: (productId: 'box-signature') => void
  }) => (
    <button type="button" onClick={() => onAddProduct('box-signature')}>
      Adicionar seleção do hero
    </button>
  ),
}))

describe('App', () => {
  it('conecta o hero ao carrinho v2, abre a nova sacola e devolve o foco', async () => {
    const user = userEvent.setup()
    render(<App />)

    expect(screen.getAllByRole('article')).toHaveLength(24)
    const bagButton = screen.getByRole('button', {
      name: /Abrir sacola, 0 itens/i,
    })
    const bagFocus = vi.spyOn(bagButton, 'focus')

    await user.click(
      screen.getByRole('button', { name: 'Adicionar seleção do hero' }),
    )

    expect(bagButton).toHaveAccessibleName(/Abrir sacola, 1 item/i)
    expect(bagButton).toHaveTextContent('01')
    const drawer = screen.getByRole('dialog', { name: /Sua sacola/i })
    expect(within(drawer).getByText('Box Signature')).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: /Copiar resumo do pedido/i }),
    ).not.toBeInTheDocument()

    await user.click(
      within(drawer).getByRole('button', { name: 'Fechar sacola' }),
    )

    await waitFor(() => expect(bagButton).toHaveFocus())
    expect(bagFocus).toHaveBeenLastCalledWith({ preventScroll: true })
    expect(
      screen.queryByRole('dialog', { name: /Sua sacola/i }),
    ).not.toBeInTheDocument()
  })

  it('persiste o quick add do DigitalMenu no carrinho v2 e atualiza a sacola', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(
      screen.getByRole('button', {
        name: 'Adicionar Sunomono AYORUME à sacola',
      }),
    )

    expect(
      screen.getByRole('button', { name: /Abrir sacola, 1 item/i }),
    ).toHaveTextContent('01')
    await waitFor(() => {
      expect(JSON.parse(localStorage.getItem(CART_STORAGE_KEY) ?? '[]')).toEqual([
        {
          key: 'sunomono-ayorume::base',
          productId: 'sunomono-ayorume',
          quantity: 1,
          optionIds: [],
        },
      ])
    })
  })

  it('fecha o checkout sem reabrir o drawer e devolve o foco à sacola', async () => {
    const user = userEvent.setup()
    render(<App />)
    const bagButton = screen.getByRole('button', {
      name: /Abrir sacola, 0 itens/i,
    })

    await user.click(
      screen.getByRole('button', { name: 'Adicionar seleção do hero' }),
    )
    await user.click(
      screen.getByRole('button', { name: 'Continuar para checkout' }),
    )
    const checkout = screen.getByRole('dialog', {
      name: 'Checkout demonstrativo',
    })
    await user.click(
      within(checkout).getByRole('button', { name: 'Fechar checkout' }),
    )

    await waitFor(() => expect(bagButton).toHaveFocus())
    expect(
      screen.queryByRole('dialog', { name: /Sua sacola/i }),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('dialog', { name: 'Checkout demonstrativo' }),
    ).not.toBeInTheDocument()
  })
})
