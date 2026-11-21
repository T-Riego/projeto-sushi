import type {
  Allergen,
  DietaryTag,
  MenuCategoryId,
  MenuItem,
} from '../types/menu'

export interface MenuFilterState {
  query: string
  categoryId: 'todos' | MenuCategoryId
  featuredOnly: boolean
  tags: readonly DietaryTag[]
  avoidAllergens: readonly Allergen[]
}

function normalizeSearchText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLocaleLowerCase('pt-BR')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

export function filterMenuItems(
  items: readonly MenuItem[],
  filters: MenuFilterState,
): MenuItem[] {
  const query = normalizeSearchText(filters.query)

  return items.filter((item) => {
    const searchableText = normalizeSearchText(
      [item.name, item.description, ...item.ingredients].join(' '),
    )

    return (
      (!query || searchableText.includes(query)) &&
      (filters.categoryId === 'todos' || item.categoryId === filters.categoryId) &&
      (!filters.featuredOnly || item.featured === true) &&
      filters.tags.every((tag) => item.tags.includes(tag)) &&
      !filters.avoidAllergens.some((allergen) => item.allergens.includes(allergen))
    )
  })
}
