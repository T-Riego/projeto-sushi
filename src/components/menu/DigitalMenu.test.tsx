import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { menuItems } from '../../data/menu'
import { DigitalMenu } from './DigitalMenu'
import { ProductDetails } from './ProductDetails'

const atumPicante = menuItems.find(({ id }) => id === 'atum-picante')!

const catalogCss = readFileSync(
  resolve(process.cwd(), 'src/styles/catalog.css'),
  'utf8',
)

function renderMenu() {
  const onAddLine = vi.fn()
  const onNotify = vi.fn()

  render(<DigitalMenu onAddLine={onAddLine} onNotify={onNotify} />)

  return { onAddLine, onNotify }
}

function getProductCard(name: string): HTMLElement {
  const heading = screen.getByRole('heading', { name })
  const card = heading.closest('article')

  if (!card) {
    throw new Error(`Cartão de ${name} não encontrado`)
  }

  return card
}

describe('DigitalMenu', () => {
  it('renderiza os 24 produtos e anuncia o total sem filtros', () => {
    renderMenu()

    const menu = screen.getByRole('region', {
      name: /A cada escolha, uma nova descoberta/i,
    })
    const catalogTitle = within(menu).getByRole('heading', {
      name: /A cada escolha, uma nova descoberta/i,
    })

    expect(within(menu).getAllByRole('article')).toHaveLength(24)
    expect(catalogTitle).toHaveAttribute('tabindex', '-1')
    expect(screen.getByRole('status')).toHaveTextContent('24 itens encontrados')
  })

  it('busca por um termo único e atualiza o contador ao vivo', async () => {
    const user = userEvent.setup()
    renderMenu()

    await user.type(
      screen.getByRole('searchbox', { name: 'Buscar no cardápio' }),
      'limão-cravo',
    )

    expect(screen.getAllByRole('article')).toHaveLength(1)
    expect(screen.getByRole('heading', { name: 'Sunomono AYORUME' })).toBeVisible()
    expect(screen.getByRole('status')).toHaveTextContent('1 item encontrado')
  })

  it('mostra os três pratos editoriais ao selecionar Destaques', async () => {
    const user = userEvent.setup()
    renderMenu()

    await user.click(screen.getByRole('button', { name: 'Destaques' }))

    expect(screen.getAllByRole('article')).toHaveLength(3)
    expect(screen.getByRole('heading', { name: 'Box Signature' })).toBeVisible()
    expect(screen.getByRole('heading', { name: 'Garden Box' })).toBeVisible()
    expect(screen.getByRole('heading', { name: 'Salmão Box' })).toBeVisible()
    expect(screen.getByRole('status')).toHaveTextContent('3 itens encontrados')
  })

  it('combina categoria e Destaques como filtros independentes', async () => {
    const user = userEvent.setup()
    renderMenu()

    const combinados = screen.getByRole('button', { name: 'Combinados' })
    const rolls = screen.getByRole('button', { name: 'Rolls' })
    const destaques = screen.getByRole('button', { name: 'Destaques' })

    await user.click(combinados)
    expect(combinados).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getAllByRole('article')).toHaveLength(5)

    await user.click(destaques)
    expect(combinados).toHaveAttribute('aria-pressed', 'true')
    expect(destaques).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getAllByRole('article')).toHaveLength(3)

    await user.click(destaques)
    expect(combinados).toHaveAttribute('aria-pressed', 'true')
    expect(destaques).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getAllByRole('article')).toHaveLength(5)

    await user.click(destaques)
    await user.click(rolls)
    expect(rolls).toHaveAttribute('aria-pressed', 'true')
    expect(destaques).toHaveAttribute('aria-pressed', 'true')
    expect(screen.queryAllByRole('article')).toHaveLength(0)
  })

  it('mostra o estado vazio para Sobremesas picantes e limpa todos os filtros', async () => {
    const user = userEvent.setup()
    renderMenu()

    await user.click(screen.getByRole('button', { name: 'Sobremesas' }))
    await user.click(screen.getByRole('button', { name: 'Picante' }))

    expect(screen.queryAllByRole('article')).toHaveLength(0)
    expect(screen.getByText('Nenhum prato encontrado')).toBeVisible()
    expect(screen.getByRole('status')).toHaveTextContent('0 itens encontrados')

    await user.click(screen.getByRole('button', { name: 'Limpar filtros' }))

    expect(screen.getAllByRole('article')).toHaveLength(24)
    expect(screen.getByRole('status')).toHaveTextContent('24 itens encontrados')
  })

  it('configura o Atum picante, calcula quantidade e envia as opções escolhidas', async () => {
    const user = userEvent.setup()
    const { onAddLine, onNotify } = renderMenu()

    await user.click(
      screen.getByRole('button', { name: 'Ver detalhes de Atum picante' }),
    )

    const dialog = screen.getByRole('dialog', { name: 'Atum picante' })
    const suave = within(dialog).getByRole('radio', { name: 'Suave' })
    const tradicional = within(dialog).getByRole('radio', {
      name: 'Tradicional',
    })
    expect(suave).toBeChecked()

    await user.click(tradicional)
    expect(suave).not.toBeChecked()
    expect(tradicional).toBeChecked()
    await user.click(
      within(dialog).getByRole('checkbox', {
        name: /Wasabi\s*\+\s*R\$\s*3,00/,
      }),
    )
    await user.click(
      within(dialog).getByRole('button', { name: 'Aumentar quantidade' }),
    )
    expect(within(dialog).getByText(/R\$\s*102,00/)).toBeVisible()
    await user.click(
      within(dialog).getByRole('button', { name: 'Adicionar à sacola' }),
    )

    expect(onAddLine).toHaveBeenCalledOnce()
    expect(onAddLine).toHaveBeenCalledWith(
      'atum-picante',
      ['picante-tradicional', 'wasabi-extra'],
      2,
    )
    expect(onNotify).toHaveBeenCalledWith('Atum picante adicionado à sacola.')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('abre os detalhes em vez de adicionar rapidamente quando há opção obrigatória', async () => {
    const user = userEvent.setup()
    const { onAddLine } = renderMenu()

    await user.click(
      screen.getByRole('button', { name: 'Adicionar Atum picante à sacola' }),
    )

    expect(onAddLine).not.toHaveBeenCalled()
    expect(screen.getByRole('dialog', { name: 'Atum picante' })).toBeVisible()
  })

  it('limita a quantidade configurada ao intervalo de 1 a 99', async () => {
    const user = userEvent.setup()
    renderMenu()

    await user.click(
      screen.getByRole('button', { name: 'Ver detalhes de Atum picante' }),
    )

    const dialog = screen.getByRole('dialog', { name: 'Atum picante' })
    const quantity = within(dialog).getByRole('spinbutton', {
      name: 'Quantidade',
    })
    const decrease = within(dialog).getByRole('button', {
      name: 'Diminuir quantidade',
    })
    const increase = within(dialog).getByRole('button', {
      name: 'Aumentar quantidade',
    })

    expect(quantity).toHaveAttribute('min', '1')
    expect(quantity).toHaveAttribute('max', '99')
    expect(decrease).toBeDisabled()

    fireEvent.change(quantity, { target: { value: '99' } })
    expect(quantity).toHaveValue(99)
    expect(increase).toBeDisabled()

    fireEvent.change(quantity, { target: { value: '100' } })
    expect(quantity).toHaveValue(99)
    fireEvent.change(quantity, { target: { value: '0' } })
    expect(quantity).toHaveValue(1)
  })

  it('mantém a Dupla de camarão visível e esgotada, sem permitir adição', () => {
    const { onAddLine } = renderMenu()
    const card = getProductCard('Dupla de camarão')

    expect(within(card).getByText('Esgotado')).toBeVisible()
    expect(
      within(card).queryByRole('button', {
        name: 'Adicionar Dupla de camarão à sacola',
      }),
    ).not.toBeInTheDocument()
    expect(onAddLine).not.toHaveBeenCalled()
  })

  it('exclui os produtos que contêm o alergênico selecionado', async () => {
    const user = userEvent.setup()
    renderMenu()

    await user.click(screen.getByRole('checkbox', { name: 'Peixe' }))

    expect(screen.queryByRole('heading', { name: 'Atum picante' })).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Sunomono AYORUME' })).toBeVisible()
    expect(screen.getByRole('status')).not.toHaveTextContent('24 itens encontrados')
  })

  it('fecha o diálogo pelo botão, preserva nome acessível e devolve o foco', async () => {
    const user = userEvent.setup()
    renderMenu()

    const opener = screen.getByRole('button', {
      name: 'Ver detalhes de Atum picante',
    })
    await user.click(opener)

    const dialog = screen.getByRole('dialog', { name: 'Atum picante' })
    expect(dialog).toHaveAccessibleDescription(
      /Atum picado, maionese de pimenta e pepino crocante/i,
    )

    await user.click(within(dialog).getByRole('button', { name: 'Fechar detalhes' }))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(opener).toHaveFocus()
  })

  it('notifica o fechamento exatamente uma vez em cada fluxo do diálogo', async () => {
    const user = userEvent.setup()
    const onAddLine = vi.fn()
    const onClose = vi.fn()
    const renderDetails = (product: typeof atumPicante | null) => (
      <ProductDetails
        product={product}
        onAddLine={onAddLine}
        onClose={onClose}
      />
    )
    const { rerender } = render(renderDetails(atumPicante))
    const dialog = screen.getByRole('dialog', { name: 'Atum picante' })
    const emitNativeClose = () =>
      fireEvent(dialog, new Event('close'))
    const reopen = () => {
      rerender(renderDetails(null))
      rerender(renderDetails(atumPicante))
      expect(dialog).toHaveAttribute('open')
    }
    const expectSingleClose = async (
      closeAction: () => void | Promise<void>,
    ) => {
      onClose.mockClear()
      await closeAction()
      emitNativeClose()
      expect(onClose).toHaveBeenCalledOnce()
    }

    await expectSingleClose(() =>
      user.click(within(dialog).getByRole('button', { name: 'Fechar detalhes' })),
    )

    reopen()
    await expectSingleClose(() => {
      fireEvent(
        dialog,
        new Event('cancel', { bubbles: true, cancelable: true }),
      )
    })

    reopen()
    await expectSingleClose(() =>
      user.click(within(dialog).getByRole('button', { name: 'Adicionar à sacola' })),
    )
  })

  it('troca imagens ausentes pelo fallback local sem repetir a troca', () => {
    renderMenu()

    const image = screen.getByRole('img', {
      name: 'Sunomono de pepino com gergelim em tigela clara',
    }) as HTMLImageElement

    fireEvent.error(image)
    const fallbackSource = image.src
    expect(image).toHaveAttribute(
      'alt',
      'Imagem ilustrativa de sushi AYORUME',
    )
    image.src = '/assets/teste-sem-fallback.png'
    fireEvent.error(image)

    expect(fallbackSource).toMatch(/\/assets\/sushi-0\.png$/)
    expect(image.src).toMatch(/\/assets\/teste-sem-fallback\.png$/)
  })

  it('mantém todo texto funcional em pelo menos 12px', () => {
    const decorativeSelectors = [
      '.catalog-eyebrow',
      '.catalog-editorial-jp',
    ]
    const undersizedFunctionalText = [
      ...catalogCss.matchAll(/([^{}]+)\{([^{}]*)\}/g),
    ].flatMap(([, selectorSource, declarations]) => {
      const selector = selectorSource.trim()

      if (decorativeSelectors.some((allowed) => selector.includes(allowed))) {
        return []
      }

      return [...declarations.matchAll(/font-size:\s*(\d+(?:\.\d+)?)px/g)]
        .map(([, size]) => Number(size))
        .filter((size) => size < 12)
        .map((size) => `${selector} = ${size}px`)
    })

    expect(undersizedFunctionalText).toEqual([])
  })

  it('alinha o bleed dos filtros ao gutter de 15px em telas compactas', () => {
    expect(catalogCss).toMatch(
      /@media\s*\(max-width:\s*360px\)\s*\{\s*\.catalog-filter-row\s*\{\s*margin-inline:\s*-15px;\s*padding-inline:\s*15px;\s*scroll-padding-inline:\s*15px;\s*\}\s*\}/,
    )
  })
})
