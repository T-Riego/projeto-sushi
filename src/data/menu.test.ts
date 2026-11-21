import { describe, expect, expectTypeOf, it } from 'vitest'

import { heroSelections, type HeroSelection } from './heroSelections'
import { menuCategories, menuItems } from './menu'
import { restaurant, type OpeningHours, type Restaurant } from './restaurant'
import type { CheckoutDraft, CheckoutSchedule } from '../types/flows'
import type { CartLine, MenuItem, MenuItemId, ProductOptionGroup } from '../types/menu'

type IsStrictReadonlyArray<T> = T extends readonly unknown[]
  ? T extends unknown[]
    ? false
    : true
  : false

type IfEquals<X, Y, Then = X, Else = never> =
  (<T>() => T extends X ? 1 : 2) extends
  (<T>() => T extends Y ? 1 : 2) ? Then : Else

type WritableKeys<T> = {
  [Key in keyof T]-?: IfEquals<
    { [Current in Key]: T[Key] },
    { -readonly [Current in Key]: T[Key] },
    Key
  >
}[keyof T]

const expectedProducts = {
  'sunomono-ayorume': 26,
  'edamame-citrico': 28,
  'guioza-legumes': 34,
  'tataki-salmao': 46,
  'dupla-salmao': 18,
  'dupla-atum': 24,
  'dupla-camarao': 26,
  'sashimi-chef': 68,
  'roll-ayorume': 52,
  'salmao-cebolinha': 44,
  'atum-picante': 48,
  'camarao-crocante': 54,
  'garden-roll': 42,
  'box-signature': 128,
  'garden-box': 84,
  'salmao-box': 98,
  'garden-para-dois': 72,
  'experiencia-ayorume': 118,
  'trio-mochi': 32,
  'chocolate-gergelim-caramelo': 36,
  'cheesecake-yuzu': 34,
  'cha-citrico': 16,
  'soda-frutas-amarelas': 22,
  'horizonte-tonica': 26,
} as const

describe('menu AYORUME', () => {
  it('organiza exatamente 24 produtos únicos nas seis categorias editoriais', () => {
    expect(menuCategories.map(({ id }) => id)).toEqual([
      'entradas',
      'niguiris-sashimis',
      'rolls',
      'combinados',
      'sobremesas',
      'bebidas',
    ])
    expect(menuItems).toHaveLength(24)
    expect(new Set(menuItems.map(({ id }) => id)).size).toBe(24)
    expect(menuItems.map(({ id, price }) => [id, price])).toEqual(
      Object.entries(expectedProducts),
    )
  })

  it('mapeia os três destaques para as cenas e pôsteres aprovados', () => {
    expect(heroSelections).toEqual([
      {
        productId: 'box-signature',
        sceneIndex: 0,
        poster: 'assets/sushi-0.png',
      },
      {
        productId: 'garden-box',
        sceneIndex: 1,
        poster: 'assets/sushi-1.png',
      },
      {
        productId: 'salmao-box',
        sceneIndex: 2,
        poster: 'assets/sushi-2.png',
      },
    ])
  })

  it('mantém todos os destaques vinculados a produtos do catálogo', () => {
    const productIds = new Set(menuItems.map(({ id }) => id))

    for (const selection of heroSelections) {
      expect(productIds.has(selection.productId), selection.productId).toBe(true)
    }
  })

  it('mantém conteúdo comercial completo e imagens locais em todos os produtos', () => {
    for (const item of menuItems) {
      expect(item.description.length, item.id).toBeGreaterThan(20)
      expect(item.ingredients.length, item.id).toBeGreaterThan(0)
      expect(item.portionLabel.length, item.id).toBeGreaterThan(0)
      expect(item.price, item.id).toBeGreaterThan(0)
      expect(item.image, item.id).toMatch(/^assets\/menu\/.+\.(?:png|webp|jpg)$/)
      expect(item.alt.length, item.id).toBeGreaterThan(10)
    }
  })

  it('oferece personalizações coerentes e sinaliza o item esgotado', () => {
    const find = (id: string) => menuItems.find((item) => item.id === id)

    expect(find('dupla-camarao')?.available).toBe(false)
    expect(
      find('atum-picante')?.optionGroups?.find(({ id }) => id === 'intensidade')?.options,
    ).toHaveLength(2)

    for (const id of [
      'roll-ayorume',
      'salmao-cebolinha',
      'atum-picante',
      'camarao-crocante',
      'garden-roll',
      'box-signature',
      'garden-box',
      'salmao-box',
      'garden-para-dois',
      'experiencia-ayorume',
    ]) {
      expect(find(id)?.optionGroups?.[0].id, id).toBe('extras')
    }

    for (const id of ['cha-citrico', 'soda-frutas-amarelas', 'horizonte-tonica']) {
      expect(find(id)?.optionGroups?.[0].id, id).toBe('gelo')
    }
  })

  it('cobra os extras de rolls e combinados conforme a especificação', () => {
    const extras = menuItems
      .find(({ id }) => id === 'box-signature')
      ?.optionGroups?.find(({ id }) => id === 'extras')

    expect(extras?.options).toEqual([
      { id: 'shoyu-extra', label: 'Shoyu da casa', priceDelta: 3 },
      { id: 'gengibre-extra', label: 'Gengibre em conserva', priceDelta: 4 },
      { id: 'wasabi-extra', label: 'Wasabi', priceDelta: 3 },
    ])
  })

  it('usa IDs de intensidade estáveis e opções únicas em cada produto', () => {
    const spicyOptions = menuItems
      .find(({ id }) => id === 'atum-picante')
      ?.optionGroups?.find(({ id }) => id === 'intensidade')
      ?.options.map(({ id }) => id)

    expect(spicyOptions).toEqual(['picante-suave', 'picante-tradicional'])

    for (const item of menuItems) {
      const optionIds = item.optionGroups?.flatMap(({ options }) =>
        options.map(({ id }) => id),
      ) ?? []

      expect(new Set(optionIds).size, item.id).toBe(optionIds.length)
    }
  })

  it('mantém nomes e porções operacionais aprovados', () => {
    const summary = Object.fromEntries(
      menuItems.map(({ id, name, portionLabel }) => [id, { name, portionLabel }]),
    )

    expect(summary['guioza-legumes'].portionLabel).toBe('6 unidades')
    expect(menuItems.find(({ id }) => id === 'guioza-legumes')?.alt).toContain('Seis guiozas')
    expect(summary['sashimi-chef'].portionLabel).toBe('8 cortes')
    expect(summary['cha-citrico']).toEqual({
      name: 'Chá cítrico da casa',
      portionLabel: 'Copo · 300 ml',
    })
  })

  it('expõe IDs, metadados e coleções readonly no contrato de domínio', () => {
    expectTypeOf<MenuItemId>().toEqualTypeOf<keyof typeof expectedProducts>()
    expectTypeOf<MenuItem['id']>().toEqualTypeOf<MenuItemId>()
    expectTypeOf<CartLine['productId']>().toEqualTypeOf<MenuItemId>()
    expectTypeOf<HeroSelection['productId']>().toEqualTypeOf<MenuItemId>()
    expectTypeOf<MenuItem['badge']>().toEqualTypeOf<string | undefined>()
    expectTypeOf<MenuItem['featured']>().toEqualTypeOf<boolean | undefined>()
    expectTypeOf<CheckoutDraft['schedule']>().toEqualTypeOf<CheckoutSchedule>()
    expectTypeOf<IsStrictReadonlyArray<typeof menuItems>>().toEqualTypeOf<true>()
    expectTypeOf<IsStrictReadonlyArray<typeof menuCategories>>().toEqualTypeOf<true>()
    expectTypeOf<IsStrictReadonlyArray<typeof heroSelections>>().toEqualTypeOf<true>()
    expectTypeOf<IsStrictReadonlyArray<MenuItem['ingredients']>>().toEqualTypeOf<true>()
    expectTypeOf<IsStrictReadonlyArray<MenuItem['tags']>>().toEqualTypeOf<true>()
    expectTypeOf<IsStrictReadonlyArray<MenuItem['allergens']>>().toEqualTypeOf<true>()
    expectTypeOf<
      IsStrictReadonlyArray<NonNullable<MenuItem['optionGroups']>>
    >().toEqualTypeOf<true>()
    expectTypeOf<
      IsStrictReadonlyArray<ProductOptionGroup['options']>
    >().toEqualTypeOf<true>()
  })

  it('descreve a unidade fictícia e sua operação semanal', () => {
    expect(restaurant).toMatchObject({
      name: 'AYORUME Savassi',
      address: 'Alameda do Horizonte, 118 — Savassi, Belo Horizonte — MG',
      fictional: true,
      timezone: 'America/Sao_Paulo',
      reservationWindowDays: 30,
      maxPartySize: 8,
    })
    expect(restaurant.deliveryNeighborhoods).toEqual([
      'Savassi',
      'Funcionários',
      'Lourdes',
      'Santo Agostinho',
      'Serra',
      'Anchieta',
      'Sion',
    ])
    expect(restaurant.openingHours).toEqual([
      { day: 'segunda', closed: true },
      { day: 'terça', opens: '18:00', closes: '22:30' },
      { day: 'quarta', opens: '18:00', closes: '22:30' },
      { day: 'quinta', opens: '18:00', closes: '22:30' },
      { day: 'sexta', opens: '18:00', closes: '23:30' },
      { day: 'sábado', opens: '18:00', closes: '23:30' },
      { day: 'domingo', opens: '12:00', closes: '21:30' },
    ])
  })

  it('expõe a unidade e seus horários como dados readonly', () => {
    expectTypeOf<WritableKeys<Restaurant>>().toEqualTypeOf<never>()
    expectTypeOf<
      WritableKeys<Extract<OpeningHours, { closed: true }>>
    >().toEqualTypeOf<never>()
    expectTypeOf<
      WritableKeys<Extract<OpeningHours, { opens: string }>>
    >().toEqualTypeOf<never>()
    expectTypeOf<
      IsStrictReadonlyArray<Restaurant['deliveryNeighborhoods']>
    >().toEqualTypeOf<true>()
    expectTypeOf<
      IsStrictReadonlyArray<Restaurant['openingHours']>
    >().toEqualTypeOf<true>()
  })
})
