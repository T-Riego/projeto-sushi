import { describe, expect, it } from 'vitest'

import { menuItems } from '../data/menu'
import type { MenuItem } from '../types/menu'
import { filterMenuItems, type MenuFilterState } from './menuFilters'

const defaultFilters: MenuFilterState = {
  query: '',
  categoryId: 'todos',
  featuredOnly: false,
  tags: [],
  avoidAllergens: [],
}

describe('filterMenuItems', () => {
  it('normaliza caixa e diacríticos ao buscar nome, descrição e ingredientes', () => {
    const byName = filterMenuItems(menuItems, {
      ...defaultFilters,
      query: 'SALMAO',
    })

    expect(byName.map(({ id }) => id)).toContain('dupla-salmao')

    const byDescription = filterMenuItems(menuItems, {
      ...defaultFilters,
      query: 'selecao diaria',
    })
    expect(byDescription.map(({ id }) => id)).toContain('sashimi-chef')

    const byIngredient = filterMenuItems(menuItems, {
      ...defaultFilters,
      query: 'limao cravo',
    })
    expect(byIngredient.map(({ id }) => id)).toEqual(['sunomono-ayorume'])
  })

  it('combina categoria, todas as tags selecionadas e alergênicos evitados', () => {
    const result = filterMenuItems(menuItems, {
      ...defaultFilters,
      categoryId: 'rolls',
      tags: ['vegetariano', 'sem-cru'],
      avoidAllergens: ['crustaceos'],
    })

    expect(result.map(({ id }) => id)).toEqual(['garden-roll'])
  })

  it('exige todos os tags selecionados sem depender do filtro de alergênicos', () => {
    const items = [
      {
        ...menuItems[0],
        tags: ['vegetariano'],
        allergens: [],
      },
      {
        ...menuItems[1],
        tags: ['vegetariano', 'sem-cru'],
        allergens: [],
      },
    ] satisfies readonly MenuItem[]

    const result = filterMenuItems(items, {
      ...defaultFilters,
      tags: ['vegetariano', 'sem-cru'],
      avoidAllergens: [],
    })

    expect(result.map(({ id }) => id)).toEqual(['edamame-citrico'])
  })

  it('retorna somente itens em destaque quando solicitado', () => {
    const items = [
      { ...menuItems[0], featured: false },
      { ...menuItems[1], featured: true },
      { ...menuItems[2], featured: true },
    ] satisfies readonly MenuItem[]

    expect(
      filterMenuItems(items, { ...defaultFilters, featuredOnly: true }).map(
        ({ id }) => id,
      ),
    ).toEqual(['edamame-citrico', 'guioza-legumes'])
  })

  it('exclui a união de múltiplos alergênicos e preserva a ordem editorial', () => {
    const result = filterMenuItems(menuItems, {
      ...defaultFilters,
      avoidAllergens: ['crustaceos', 'leite'],
    })

    expect(result.some(({ allergens }) => allergens.includes('crustaceos'))).toBe(false)
    expect(result.some(({ allergens }) => allergens.includes('leite'))).toBe(false)
    expect(result.map(({ id }) => id)).toEqual(
      menuItems
        .filter(
          ({ allergens }) =>
            !allergens.includes('crustaceos') && !allergens.includes('leite'),
        )
        .map(({ id }) => id),
    )
  })

  it('não muta a coleção nem os itens recebidos', () => {
    const items = menuItems.slice(0, 4)
    const snapshot = structuredClone(items)

    const result = filterMenuItems(items, { ...defaultFilters, query: 'salmao' })

    expect(items).toEqual(snapshot)
    expect(result.every((item) => items.includes(item))).toBe(true)
  })
})
