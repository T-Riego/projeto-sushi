import { describe, expect, it } from 'vitest'

import type { CartLine } from '../types/menu'
import {
  CART_STORAGE_KEY,
  createCartLine,
  getCartTotal,
  getLineUnitPrice,
  readCart,
  writeCart,
} from './cart'

describe('cart', () => {
  it('cria uma chave estável com opções únicas e ordenadas', () => {
    const optionIds = Object.freeze([
      'wasabi-extra',
      'picante-tradicional',
      'wasabi-extra',
    ])

    const line = createCartLine('atum-picante', optionIds)

    expect(line).toEqual({
      key: 'atum-picante::picante-tradicional|wasabi-extra',
      productId: 'atum-picante',
      quantity: 1,
      optionIds: ['picante-tradicional', 'wasabi-extra'],
    })
    expect(optionIds).toEqual([
      'wasabi-extra',
      'picante-tradicional',
      'wasabi-extra',
    ])
    expect(createCartLine('atum-picante', [], 140).quantity).toBe(99)
    expect(createCartLine('atum-picante', [], -4).quantity).toBe(1)
    expect(createCartLine('atum-picante', [], 2.9).quantity).toBe(2)
    expect(createCartLine('atum-picante', []).key).toBe('atum-picante::base')
  })

  it('descarta a chave legada e retorna vazio quando não há carrinho v2', () => {
    localStorage.setItem('ayorume-cart-v1', '[{"old":true}]')

    expect(readCart()).toEqual([])
    expect(localStorage.getItem('ayorume-cart-v1')).toBeNull()
  })

  it('descarta JSON ruim e sempre remove o carrinho legado', () => {
    localStorage.setItem('ayorume-cart-v1', 'legacy')
    localStorage.setItem(CART_STORAGE_KEY, '{not-json')

    expect(() => readCart()).not.toThrow()
    expect(readCart()).toEqual([])
    expect(localStorage.getItem('ayorume-cart-v1')).toBeNull()
  })

  it('mantém apenas linhas v2 com produto, chave, quantidade e opções válidos', () => {
    const valid = createCartLine(
      'atum-picante',
      ['wasabi-extra', 'picante-tradicional'],
      2,
    )
    localStorage.setItem(
      CART_STORAGE_KEY,
      JSON.stringify([
        valid,
        { ...valid, productId: 'produto-inexistente' },
        { ...valid, key: 'atum-picante::outra-chave' },
        { ...valid, quantity: 0 },
        { ...valid, quantity: 1.5 },
        {
          ...valid,
          key: 'atum-picante::opcao-inexistente',
          optionIds: ['opcao-inexistente'],
        },
      ]),
    )

    expect(readCart()).toEqual([valid])
  })

  it('calcula preço unitário e total usando somente opções válidas', () => {
    const line = createCartLine(
      'box-signature',
      ['shoyu-extra', 'opcao-inexistente'],
      2,
    )

    expect(getLineUnitPrice(line)).toBe(131)
    expect(getCartTotal([line])).toBe(262)
  })

  it('persiste linhas sem propagar falhas do Storage', () => {
    const line = createCartLine('garden-roll', [], 2)
    writeCart([line])

    expect(JSON.parse(localStorage.getItem(CART_STORAGE_KEY) ?? 'null')).toEqual([
      line,
    ])

    const failingStorage = {
      get length(): number {
        throw new Error('storage blocked')
      },
      clear(): void {
        throw new Error('storage blocked')
      },
      getItem(_key: string): string | null {
        throw new Error('storage blocked')
      },
      key(_index: number): string | null {
        throw new Error('storage blocked')
      },
      removeItem(_key: string): void {
        throw new Error('storage blocked')
      },
      setItem(_key: string, _value: string): void {
        throw new Error('storage blocked')
      },
    } satisfies Storage

    expect(() => writeCart([line], failingStorage)).not.toThrow()
    expect(() => readCart(failingStorage)).not.toThrow()
    expect(readCart(failingStorage)).toEqual([])
  })

  it('ignora produtos ausentes ao totalizar', () => {
    const unknownLine = {
      key: 'missing::base',
      productId: 'missing',
      quantity: 2,
      optionIds: [],
    } as unknown as CartLine

    expect(getLineUnitPrice(unknownLine)).toBe(0)
    expect(getCartTotal([unknownLine])).toBe(0)
  })
})
