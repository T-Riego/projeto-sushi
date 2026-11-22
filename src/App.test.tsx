import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import App from './App'
import { CART_STORAGE_KEY } from './lib/cart'

const flowCss = readFileSync(resolve(process.cwd(), 'src/styles/flows.css'), 'utf8')
const readme = readFileSync(resolve(process.cwd(), 'README.md'), 'utf8')

function cssRuleBody(source: string, selector: string): string {
  const ruleStart = source.lastIndexOf(`${selector} {`)
  if (ruleStart < 0) {
    throw new Error(`Regra CSS ausente: ${selector}`)
  }

  const bodyStart = source.indexOf('{', ruleStart) + 1
  const bodyEnd = source.indexOf('}', bodyStart)
  return source.slice(bodyStart, bodyEnd)
}

function numericCssValue(
  source: string,
  selector: string,
  property: string,
): number {
  const ruleNeedle = `${selector} {`
  const declarationPattern = new RegExp(`${property}:\\s*(\\d+)`)
  let searchFrom = 0
  let value: number | undefined

  while (searchFrom < source.length) {
    const ruleStart = source.indexOf(ruleNeedle, searchFrom)
    if (ruleStart < 0) {
      break
    }
    const bodyStart = source.indexOf('{', ruleStart) + 1
    const bodyEnd = source.indexOf('}', bodyStart)
    const declaration = source
      .slice(bodyStart, bodyEnd)
      .match(declarationPattern)
    if (declaration) {
      value = Number(declaration[1])
    }
    searchFrom = bodyEnd + 1
  }

  if (value === undefined) {
    throw new Error(`Declaração CSS ausente: ${selector} { ${property} }`)
  }

  return value
}

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
  it('oferece um salto de teclado que leva foco ao conteúdo principal', async () => {
    const user = userEvent.setup()
    render(<App />)

    const skipLink = screen.getByRole('link', {
      name: 'Pular para o conteúdo',
    })
    const main = screen.getByRole('main')

    expect(skipLink).toHaveAttribute('href', '#main-content')
    expect(skipLink).toHaveClass('flow-skip-link')
    expect(main).toHaveAttribute('id', 'main-content')
    expect(main).toHaveAttribute('tabindex', '-1')

    await user.tab()
    expect(skipLink).toHaveFocus()
    await user.keyboard('{Enter}')
    expect(main).toHaveFocus()

    const baseRule = cssRuleBody(flowCss, '.flow-skip-link')
    const focusRule = cssRuleBody(flowCss, '.flow-skip-link:focus-visible')
    expect(baseRule).toContain('position: fixed')
    expect(baseRule).toContain('transform: translateY(')
    expect(focusRule).toContain('transform: translateY(0)')
    expect(focusRule).toContain('outline: 2px solid')
  })

  it('anuncia a contagem da sacola sem duplicar o número visual', async () => {
    const user = userEvent.setup()
    const { container } = render(<App />)
    const bagButton = screen.getByRole('button', {
      name: 'Abrir sacola, 0 itens',
    })
    const visualCount = bagButton.querySelector('.bag-count')
    const announcement = container.querySelector(
      '.flow-cart-count-announcement',
    )

    expect(visualCount).toHaveAttribute('aria-hidden', 'true')
    expect(announcement).toHaveAttribute('aria-live', 'polite')
    expect(announcement).toHaveAttribute('aria-atomic', 'true')
    expect(announcement).toHaveClass('flow-sr-only')
    expect(announcement).toHaveTextContent('Sacola vazia')

    await user.click(
      screen.getByRole('button', {
        name: 'Adicionar Sunomono AYORUME à sacola',
      }),
    )

    expect(announcement).toHaveTextContent('Sacola atualizada: 1 item')
    expect(visualCount).toHaveTextContent('01')
  })

  it('mantém toda expressão japonesa apenas em conteúdo decorativo', () => {
    const { container } = render(<App />)
    const japaneseCharacters = /[\u3040-\u30ff\u3400-\u9fff]/
    const walker = document.createTreeWalker(
      container,
      window.NodeFilter.SHOW_TEXT,
    )
    const japaneseTextNodes: Text[] = []

    let node = walker.nextNode()
    while (node) {
      if (japaneseCharacters.test(node.textContent ?? '')) {
        japaneseTextNodes.push(node as Text)
      }
      node = walker.nextNode()
    }

    expect(japaneseTextNodes.length).toBeGreaterThanOrEqual(3)
    for (const textNode of japaneseTextNodes) {
      expect(
        textNode.parentElement?.closest('[aria-hidden="true"]'),
      ).not.toBeNull()
    }
  })

  it('preserva foco, alvos móveis e a ordem das camadas essenciais', () => {
    render(<App />)

    const navigation = screen.getByRole('navigation', {
      name: 'Navegação principal',
    })
    const essentialControls = [
      ...within(navigation).getAllByRole('link'),
      within(navigation).getByRole('button', { name: 'Reservar' }),
      screen.getByRole('button', { name: /Abrir sacola/i }),
      screen.getByRole('link', { name: /Fazer pedido/i }),
      screen.getByRole('button', { name: /Abrir navegação/i }),
    ]

    for (const control of essentialControls) {
      expect(control).toHaveClass('flow-essential-control')
    }

    const focusRule = cssRuleBody(
      flowCss,
      '.flow-essential-control:focus-visible',
    )
    const mobileTargetRule = cssRuleBody(flowCss, '.flow-essential-control')
    expect(focusRule).toContain('outline: 2px solid')
    expect(mobileTargetRule).toContain('min-width: 44px')
    expect(mobileTargetRule).toContain('min-height: 44px')

    const barLayer = numericCssValue(
      flowCss,
      '.flow-mobile-action-bar',
      'z-index',
    )
    const toastLayer = numericCssValue(
      flowCss,
      ".flow-mobile-action-bar ~ [role='status']",
      'z-index',
    )
    expect(toastLayer).toBeGreaterThan(barLayer)
    for (const dialogSelector of [
      '.checkout-dialog',
      '.flow-reservation-dialog',
      '.cart-drawer-dialog',
    ]) {
      expect(numericCssValue(flowCss, dialogSelector, 'z-index')).toBeGreaterThan(
        toastLayer,
      )
    }
  })

  it('documenta execução, privacidade, publicação relativa e créditos', () => {
    const documentation = readme.toLocaleLowerCase('pt-BR')

    expect(documentation).toContain('restaurante fictício')
    expect(documentation).toContain('projeto de portfólio')
    expect(documentation).toContain('npm test')
    expect(documentation).toContain('npm run typecheck')
    expect(documentation).toContain('sem transmitir')
    expect(documentation).toContain('dados pessoais')
    expect(documentation).toContain('caminhos relativos')
    expect(documentation).toContain('18 imagens gastronômicas geradas')
    expect(documentation).toContain('6 fotografias externas')
  })

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

  it('protege o aviso obrigatório e o alvo móvel de localização', () => {
    render(<App />)

    const navigation = screen.getByRole('navigation', {
      name: 'Navegação principal',
    })
    const locationLink = within(navigation).getByRole('link', {
      name: 'Localização',
    })
    const disclaimer = within(screen.getByRole('contentinfo')).getByText(
      /Endereço fictício · Nenhuma transação real/i,
    )

    expect(locationLink).toHaveClass('flow-nav-location-link')
    expect(disclaimer).toHaveClass('flow-footer-disclaimer')
    expect(flowCss).toMatch(
      /footer\s*>\s*\.flow-footer-disclaimer\s*\{(?=[^}]*font-size:\s*12px)(?=[^}]*color:\s*var\(--ink\))[^}]*\}/s,
    )
    expect(flowCss).toMatch(
      /@media\s*\(max-width:\s*640px\)[\s\S]*?\.flow-nav-location-link\s*\{(?=[^}]*display:\s*flex)(?=[^}]*min-height:\s*44px)(?=[^}]*padding(?:-block)?:\s*[^;}]+)[^}]*\}/s,
    )
    expect(flowCss).toMatch(
      /\.flow-nav-location-link:focus-visible\s*\{[^}]*outline:\s*2px\s+solid[^}]*\}/s,
    )
    expect(flowCss).toMatch(
      /@media\s*\(max-width:\s*640px\)[\s\S]*?footer\s*>\s*\.flow-footer-disclaimer\s*\{(?=[^}]*font-size:\s*12px)(?=[^}]*color:\s*var\(--ink\))[^}]*\}/s,
    )
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
