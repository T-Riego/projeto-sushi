import { Search } from 'lucide-react'

import { menuCategories } from '../../data/menu'
import type {
  Allergen,
  DietaryTag,
  MenuCategoryId,
} from '../../types/menu'

const dietaryFilters = [
  { id: 'vegetariano', label: 'Vegetarianos' },
  { id: 'sem-cru', label: 'Sem itens crus' },
  { id: 'picante', label: 'Picante' },
] as const satisfies readonly { id: DietaryTag; label: string }[]

const allergenFilters = [
  { id: 'gluten', label: 'Glúten' },
  { id: 'crustaceos', label: 'Crustáceos' },
  { id: 'peixe', label: 'Peixe' },
  { id: 'soja', label: 'Soja' },
  { id: 'gergelim', label: 'Gergelim' },
  { id: 'leite', label: 'Leite' },
  { id: 'castanhas', label: 'Castanhas' },
] as const satisfies readonly { id: Allergen; label: string }[]

type MenuFiltersProps = {
  query: string
  categoryId: 'todos' | MenuCategoryId
  featuredOnly: boolean
  tags: readonly DietaryTag[]
  avoidAllergens: readonly Allergen[]
  hasActiveFilters: boolean
  onQueryChange: (query: string) => void
  onCategoryChange: (categoryId: 'todos' | MenuCategoryId) => void
  onFeaturedOnlyChange: (featuredOnly: boolean) => void
  onTagToggle: (tag: DietaryTag) => void
  onAllergenToggle: (allergen: Allergen) => void
  onClear: () => void
}

export function MenuFilters({
  query,
  categoryId,
  featuredOnly,
  tags,
  avoidAllergens,
  hasActiveFilters,
  onQueryChange,
  onCategoryChange,
  onFeaturedOnlyChange,
  onTagToggle,
  onAllergenToggle,
  onClear,
}: MenuFiltersProps) {
  const selectCategory = (nextCategoryId: 'todos' | MenuCategoryId) => {
    onCategoryChange(nextCategoryId)
  }

  const selectFeatured = () => {
    onFeaturedOnlyChange(!featuredOnly)
  }

  return (
    <div className="catalog-filters" aria-label="Filtros do cardápio">
      <label className="catalog-search">
        <Search aria-hidden="true" size={18} />
        <input
          type="search"
          value={query}
          onChange={(event) => onQueryChange(event.currentTarget.value)}
          aria-label="Buscar no cardápio"
          placeholder="Busque por nome ou ingrediente"
        />
      </label>

      <div
        className="catalog-filter-row catalog-filter-row-categories"
        role="group"
        aria-label="Categorias do cardápio"
      >
        <button
          type="button"
          className="catalog-filter-chip"
          aria-pressed={categoryId === 'todos'}
          onClick={() => selectCategory('todos')}
        >
          Todos
        </button>
        <button
          type="button"
          className="catalog-filter-chip"
          aria-pressed={featuredOnly}
          onClick={selectFeatured}
        >
          Destaques
        </button>
        {menuCategories.map((category) => (
          <button
            type="button"
            className="catalog-filter-chip"
            aria-pressed={categoryId === category.id}
            onClick={() => selectCategory(category.id)}
            key={category.id}
          >
            {category.label}
          </button>
        ))}
      </div>

      <div className="catalog-filter-groups">
        <fieldset className="catalog-filter-fieldset">
          <legend>Preferências</legend>
          <div className="catalog-filter-row" role="group">
            {dietaryFilters.map((filter) => (
              <button
                type="button"
                className="catalog-filter-chip catalog-filter-chip-secondary"
                aria-pressed={tags.includes(filter.id)}
                onClick={() => onTagToggle(filter.id)}
                key={filter.id}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset className="catalog-filter-fieldset catalog-allergen-fieldset">
          <legend>Alergênicos a evitar</legend>
          <div className="catalog-filter-row catalog-allergen-row">
            {allergenFilters.map((filter) => (
              <label className="catalog-allergen-option" key={filter.id}>
                <input
                  type="checkbox"
                  checked={avoidAllergens.includes(filter.id)}
                  onChange={() => onAllergenToggle(filter.id)}
                />
                <span>{filter.label}</span>
              </label>
            ))}
          </div>
        </fieldset>
      </div>

      {hasActiveFilters ? (
        <button type="button" className="catalog-clear-filters" onClick={onClear}>
          Limpar filtros
        </button>
      ) : null}
    </div>
  )
}
