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

  it('fecha a sacola vazia, rola o menu e foca o título do catálogo', async () => {
    const user = userEvent.setup()
    render(<App />)
    const menu = document.getElementById('menu')
    const catalogTitle = document.getElementById('catalog-title')

    expect(menu).not.toBeNull()
    expect(catalogTitle).not.toBeNull()
    const scrollIntoView = vi.mocked(menu!.scrollIntoView)
    scrollIntoView.mockClear()

    await user.click(
      screen.getByRole('button', { name: /Abrir sacola, 0 itens/i }),
    )
    await user.click(
      screen.getByRole('button', { name: 'Explorar o cardápio' }),
    )

    await waitFor(() => expect(catalogTitle).toHaveFocus())
    expect(scrollIntoView).toHaveBeenCalledWith({
      behavior: 'smooth',
      block: 'start',
    })
  })

  it('fecha o checkout sem reabrir o drawer e devolve o foco à sacola', async () => {
    const user = userEvent.setup()
    render(<App />)
    const bagButton = screen.getByRole('button', {
      name: /Abrir sacola, 0 itens/i,
    })
    const bagFocus = vi.spyOn(bagButton, 'focus')

    await user.click(
      screen.getByRole('button', { name: 'Adicionar seleção do hero' }),
    )
    await user.click(
      screen.getByRole('button', { name: 'Continuar para checkout' }),
    )
    const checkout = screen.getByRole('dialog', {
      name: 'Checkout demonstrativo',
    })
    expect(bagButton).not.toHaveFocus()
    expect(bagFocus).not.toHaveBeenCalled()
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

  it('conclui a simulação e volta ao cardápio com rolagem e foco', async () => {
    const user = userEvent.setup()
    render(<App />)
    const menu = document.getElementById('menu')
    const catalogTitle = document.getElementById('catalog-title')

    expect(menu).not.toBeNull()
    expect(catalogTitle).not.toBeNull()
    const scrollIntoView = vi.mocked(menu!.scrollIntoView)
    scrollIntoView.mockClear()

    await user.click(
      screen.getByRole('button', { name: 'Adicionar seleção do hero' }),
    )
    await user.click(
      screen.getByRole('button', { name: 'Continuar para checkout' }),
    )
    const checkout = screen.getByRole('dialog', {
      name: 'Checkout demonstrativo',
    })
    await user.click(within(checkout).getByRole('radio', { name: 'Retirada' }))
    await user.click(within(checkout).getByRole('button', { name: 'Avançar' }))
    await user.type(within(checkout).getByRole('textbox', { name: 'Nome' }), 'Ana')
    await user.type(
      within(checkout).getByRole('textbox', { name: 'Telefone' }),
      '(31) 99999-1234',
    )
    await user.click(within(checkout).getByRole('radio', { name: 'Pix' }))
    await user.click(within(checkout).getByRole('button', { name: 'Avançar' }))
    await user.click(
      within(checkout).getByRole('button', {
        name: 'Confirmar pedido simulado',
      }),
    )

    expect(
      screen.queryByText('Checkout demonstrativo concluído. A sacola foi limpa.'),
    ).not.toBeInTheDocument()
    await user.click(
      within(checkout).getByRole('button', { name: 'Voltar ao cardápio' }),
    )

    await waitFor(() => expect(catalogTitle).toHaveFocus())
    expect(scrollIntoView).toHaveBeenCalledWith({
      behavior: 'smooth',
      block: 'start',
    })
  })

  it('expõe localização e reserva na navegação principal', () => {
    render(<App />)

    const navigation = screen.getByRole('navigation', {
      name: 'Navegação principal',
    })
    expect(within(navigation).getByRole('link', { name: 'Localização' })).toHaveAttribute(
      'href',
      '#localizacao',
    )
    expect(
      within(navigation).getByRole('button', { name: 'Reservar' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('region', { name: /AYORUME Savassi/i }),
    ).toHaveAttribute('id', 'localizacao')
    expect(screen.getByText('Endereço fictício')).toBeInTheDocument()
  })

  it('abre a reserva pela experiência e devolve o foco ao acionador', async () => {
    const user = userEvent.setup()
    render(<App />)
    const trigger = screen.getByRole('button', { name: 'Reservar mesa' })
    const focusSpy = vi.spyOn(trigger, 'focus')

    await user.click(trigger)
    const dialog = screen.getByRole('dialog', { name: 'Reserva demonstrativa' })
    expect(dialog).toBeInTheDocument()
    await user.click(
      within(dialog).getByRole('button', { name: 'Fechar reserva' }),
    )

    await waitFor(() => expect(trigger).toHaveFocus())
    expect(focusSpy).toHaveBeenLastCalledWith({ preventScroll: true })
  })

  it('leva o pedido móvel vazio ao catálogo e abre a sacola quando há item', async () => {
    const user = userEvent.setup()
    render(<App />)
    const actions = screen.getByRole('navigation', { name: 'Ações rápidas' })
    const menu = document.getElementById('menu')!
    const catalogTitle = document.getElementById('catalog-title')!
    const scrollIntoView = vi.mocked(menu.scrollIntoView)
    scrollIntoView.mockClear()

    await user.click(
      within(actions).getByRole('button', {
        name: 'Pedir, sacola com 0 itens',
      }),
    )

    await waitFor(() => expect(catalogTitle).toHaveFocus())
    expect(scrollIntoView).toHaveBeenCalledWith({
      behavior: 'smooth',
      block: 'start',
    })

    await user.click(
      screen.getByRole('button', {
        name: 'Adicionar Sunomono AYORUME à sacola',
      }),
    )
    await user.click(
      within(actions).getByRole('button', {
        name: 'Pedir, sacola com 1 item',
      }),
    )

    expect(screen.getByRole('dialog', { name: /Sua sacola/i })).toBeInTheDocument()
  })

  it('abre a reserva pela ação móvel', async () => {
    const user = userEvent.setup()
    render(<App />)
    const actions = screen.getByRole('navigation', { name: 'Ações rápidas' })

    await user.click(within(actions).getByRole('button', { name: 'Reservar' }))

    expect(
      screen.getByRole('dialog', { name: 'Reserva demonstrativa' }),
    ).toBeInTheDocument()
  })

  it('devolve o foco ao controle visível quando a reserva parte do menu móvel', async () => {
    const user = userEvent.setup()
    render(<App />)
    const matchMedia = vi.mocked(window.matchMedia)
    matchMedia.mockReturnValueOnce({
      matches: true,
      media: '(max-width: 640px)',
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })

    await user.click(
      screen.getByRole('button', { name: 'Abrir navegação' }),
    )
    const navigation = screen.getByRole('navigation', {
      name: 'Navegação principal',
    })
    await user.click(within(navigation).getByRole('button', { name: 'Reservar' }))
    const mobileToggle = screen.getByRole('button', {
      name: 'Abrir navegação',
    })
    const dialog = screen.getByRole('dialog', { name: 'Reserva demonstrativa' })

    await user.click(
      within(dialog).getByRole('button', { name: 'Fechar reserva' }),
    )

    await waitFor(() => expect(mobileToggle).toHaveFocus())
  })
})
