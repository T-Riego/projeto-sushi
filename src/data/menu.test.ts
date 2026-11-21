import { describe, expect, it } from 'vitest'

import { heroSelections } from './heroSelections'
import { menuCategories, menuItems } from './menu'
import { restaurant } from './restaurant'
import type { MenuItem } from '../types/menu'

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

  it('aceita metadados editoriais opcionais no produto', () => {
    const editorialItem: MenuItem = {
      ...menuItems[0],
      badge: 'Escolha da casa',
      featured: true,
    }

    expect(editorialItem).toMatchObject({
      badge: 'Escolha da casa',
      featured: true,
    })
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
})
