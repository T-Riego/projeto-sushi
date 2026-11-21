import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { createCartLine, readCart, writeCart } from '../lib/cart'
import { useCart } from './useCart'

describe('useCart', () => {
  it('inicializa com o carrinho persistido e calcula contagem e total', () => {
    writeCart([
      createCartLine('box-signature', ['shoyu-extra'], 2),
      createCartLine('garden-roll', [], 1),
    ])

    const { result } = renderHook(() => useCart())

    expect(result.current.lines).toHaveLength(2)
    expect(result.current.count).toBe(3)
    expect(result.current.total).toBe(304)
  })

  it('adiciona e mescla a mesma chave independentemente da ordem das opções', () => {
    const { result } = renderHook(() => useCart())

    act(() => {
      result.current.addLine(
        'atum-picante',
        ['wasabi-extra', 'picante-tradicional'],
        2,
      )
      result.current.addLine(
        'atum-picante',
        ['picante-tradicional', 'wasabi-extra'],
        3,
      )
    })

    expect(result.current.lines).toEqual([
      createCartLine(
        'atum-picante',
        ['picante-tradicional', 'wasabi-extra'],
        5,
      ),
    ])
    expect(result.current.count).toBe(5)
    expect(result.current.total).toBe(255)
    expect(readCart()).toEqual(result.current.lines)
  })

  it('limita a quantidade a 99 ao adicionar ou alterar', () => {
    const { result } = renderHook(() => useCart())

    act(() => {
      result.current.addLine('garden-roll', [], 98)
      result.current.addLine('garden-roll', [], 8)
    })
    expect(result.current.lines[0].quantity).toBe(99)

    act(() => result.current.changeQuantity('garden-roll::base', 20))
    expect(result.current.lines[0].quantity).toBe(99)
  })

  it('altera quantidades, remove ao chegar a zero e remove por chave', () => {
    const { result } = renderHook(() => useCart())

    act(() => {
      result.current.addLine('garden-roll', [], 2)
      result.current.addLine('box-signature', [], 1)
    })

    act(() => result.current.changeQuantity('garden-roll::base', -1))
    expect(result.current.lines.find(({ key }) => key === 'garden-roll::base')?.quantity).toBe(1)

    act(() => result.current.changeQuantity('garden-roll::base', -1))
    expect(result.current.lines.map(({ key }) => key)).toEqual(['box-signature::base'])

    act(() => result.current.removeLine('box-signature::base'))
    expect(result.current.lines).toEqual([])
    expect(readCart()).toEqual([])
  })

  it('limpa o estado e a persistência', () => {
    const { result } = renderHook(() => useCart())

    act(() => result.current.addLine('garden-roll', [], 2))
    expect(readCart()).toHaveLength(1)

    act(() => result.current.clearCart())

    expect(result.current.lines).toEqual([])
    expect(result.current.count).toBe(0)
    expect(result.current.total).toBe(0)
    expect(readCart()).toEqual([])
  })
})
