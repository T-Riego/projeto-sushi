import { describe, expect, it } from 'vitest'

import { menuItems } from '../data/menu'
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
    expect(createCartLine('garden-roll', [], 140).quantity).toBe(99)
    expect(createCartLine('garden-roll', [], -4).quantity).toBe(1)
    expect(createCartLine('garden-roll', [], 2.9).quantity).toBe(2)
    expect(createCartLine('garden-roll', []).key).toBe('garden-roll::base')
  })

  it('mantém IDs de opção seguros e únicos dentro de cada produto', () => {
    const safeOptionId = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

    for (const item of menuItems) {
      const optionIds = item.optionGroups?.flatMap(({ options }) =>
        options.map(({ id }) => id),
      ) ?? []

      for (const optionId of optionIds) {
        expect(optionId, `${item.id}: ${optionId}`).toMatch(safeOptionId)
        expect(optionId, item.id).not.toBe('base')
        expect(optionId, item.id).not.toContain('|')
      }

      expect(new Set(optionIds).size, item.id).toBe(optionIds.length)
    }
  })

  it('rejeita opções desconhecidas e seleções impossíveis dos grupos', () => {
    expect(() => createCartLine('garden-roll', ['opcao-inexistente'])).toThrow(
      RangeError,
    )
    expect(() => createCartLine('cha-citrico', [])).toThrow(RangeError)
    expect(() =>
      createCartLine('cha-citrico', ['com-gelo', 'sem-gelo']),
    ).toThrow(RangeError)
    expect(() => createCartLine('atum-picante', ['wasabi-extra'])).toThrow(
      RangeError,
    )

    expect(createCartLine('cha-citrico', ['com-gelo'])).toEqual({
      key: 'cha-citrico::com-gelo',
      productId: 'cha-citrico',
      quantity: 1,
      optionIds: ['com-gelo'],
    })
    expect(
      createCartLine('atum-picante', [
        'wasabi-extra',
        'picante-tradicional',
      ]),
    ).toMatchObject({
      key: 'atum-picante::picante-tradicional|wasabi-extra',
    })
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

  it('descarta linhas v2 com seleções semanticamente inválidas', () => {
    const valid = {
      key: 'cha-citrico::com-gelo',
      productId: 'cha-citrico',
      quantity: 1,
      optionIds: ['com-gelo'],
    } satisfies CartLine

    localStorage.setItem(
      CART_STORAGE_KEY,
      JSON.stringify([
        {
          key: 'cha-citrico::base',
          productId: 'cha-citrico',
          quantity: 1,
          optionIds: [],
        },
        {
          key: 'cha-citrico::com-gelo|sem-gelo',
          productId: 'cha-citrico',
          quantity: 1,
          optionIds: ['com-gelo', 'sem-gelo'],
        },
        {
          key: 'atum-picante::wasabi-extra',
          productId: 'atum-picante',
          quantity: 1,
          optionIds: ['wasabi-extra'],
        },
        valid,
      ]),
    )

    expect(readCart()).toEqual([valid])
  })

  it('canonicaliza chaves duplicadas somando quantidades com limite de 99', () => {
    const line = createCartLine('garden-roll', ['shoyu-extra'], 60)
    localStorage.setItem(
      CART_STORAGE_KEY,
      JSON.stringify([line, { ...line, quantity: 50 }]),
    )

    expect(readCart()).toEqual([{ ...line, quantity: 99 }])
  })

  it('calcula preço unitário e total usando somente opções válidas', () => {
    const line = {
      ...createCartLine('box-signature', ['shoyu-extra'], 2),
      optionIds: ['shoyu-extra', 'opcao-inexistente'],
    }

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
