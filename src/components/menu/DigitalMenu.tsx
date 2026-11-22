import { useMemo, useRef, useState } from 'react'

import { heroSelections } from '../../data/heroSelections'
import { menuItems } from '../../data/menu'
import { filterMenuItems } from '../../lib/menuFilters'
import type {
  Allergen,
  DietaryTag,
  MenuCategoryId,
  MenuItem,
  MenuItemId,
} from '../../types/menu'
import { MenuCard } from './MenuCard'
import { MenuFilters } from './MenuFilters'
import { ProductDetails } from './ProductDetails'

const editorialFeaturedIds = new Set<MenuItemId>(
  heroSelections.map(({ productId }) => productId),
)

const catalogItems: readonly MenuItem[] = menuItems.map((item) =>
  item.featured || !editorialFeaturedIds.has(item.id)
    ? item
    : { ...item, featured: true },
)

export type DigitalMenuProps = {
  onAddLine: (
    productId: MenuItemId,
    optionIds: readonly string[],
    quantity: number,
  ) => void
  onNotify?: (message: string) => void
}

function toggleValue<T>(values: readonly T[], value: T): T[] {
  return values.includes(value)
    ? values.filter((current) => current !== value)
    : [...values, value]
}

export function DigitalMenu({ onAddLine, onNotify }: DigitalMenuProps) {
  const [query, setQuery] = useState('')
  const [categoryId, setCategoryId] = useState<'todos' | MenuCategoryId>('todos')
  const [featuredOnly, setFeaturedOnly] = useState(false)
  const [tags, setTags] = useState<DietaryTag[]>([])
  const [avoidAllergens, setAvoidAllergens] = useState<Allergen[]>([])
  const [selectedProductId, setSelectedProductId] = useState<MenuItemId | null>(
    null,
  )
  const openerRef = useRef<HTMLButtonElement | null>(null)

  const filteredItems = useMemo(
    () =>
      filterMenuItems(catalogItems, {
        query,
        categoryId,
        featuredOnly,
        tags,
        avoidAllergens,
      }),
    [avoidAllergens, categoryId, featuredOnly, query, tags],
  )

  const selectedProduct =
    catalogItems.find(({ id }) => id === selectedProductId) ?? null
  const hasActiveFilters =
    query.trim().length > 0 ||
    categoryId !== 'todos' ||
    featuredOnly ||
    tags.length > 0 ||
    avoidAllergens.length > 0

  const openDetails = (item: MenuItem, opener: HTMLButtonElement) => {
    openerRef.current = opener
    setSelectedProductId(item.id)
  }

  const closeDetails = () => {
    setSelectedProductId(null)
    const opener = openerRef.current
    openerRef.current = null
    opener?.focus()
  }

  const quickAdd = (item: MenuItem, opener: HTMLButtonElement) => {
    const requiresConfiguration = item.optionGroups?.some(
      (group) => group.required,
    )

    if (requiresConfiguration) {
      openDetails(item, opener)
      return
    }

    onAddLine(item.id, [], 1)
    onNotify?.(`${item.name} adicionado à sacola.`)
  }

  const clearFilters = () => {
    setQuery('')
    setCategoryId('todos')
    setFeaturedOnly(false)
    setTags([])
    setAvoidAllergens([])
  }

  const resultLabel = `${filteredItems.length} ${
    filteredItems.length === 1 ? 'item encontrado' : 'itens encontrados'
  }`

  return (
    <section
      id="menu"
      className="catalog-section wrap"
      aria-labelledby="catalog-title"
    >
      <header className="catalog-heading">
        <div>
          <p className="catalog-eyebrow">01 — ENCONTRE O SEU FAVORITO</p>
          <h2 id="catalog-title" tabIndex={-1}>
            A cada escolha,
            <br /> uma nova <em>descoberta.</em>
          </h2>
        </div>
        <div className="catalog-heading-note">
          <span className="catalog-editorial-jp editorial-jp" aria-hidden="true">
            いただきます
          </span>
          <p>
            Dos clássicos que abraçam aos encontros que surpreendem. Escolha seu
            momento.
          </p>
        </div>
      </header>

      <MenuFilters
        query={query}
        categoryId={categoryId}
        featuredOnly={featuredOnly}
        tags={tags}
        avoidAllergens={avoidAllergens}
        hasActiveFilters={hasActiveFilters}
        onQueryChange={setQuery}
        onCategoryChange={setCategoryId}
        onFeaturedOnlyChange={setFeaturedOnly}
        onTagToggle={(tag) => setTags((current) => toggleValue(current, tag))}
        onAllergenToggle={(allergen) =>
          setAvoidAllergens((current) => toggleValue(current, allergen))
        }
        onClear={clearFilters}
      />

      <div className="catalog-results-meta">
        <p role="status" aria-live="polite" aria-atomic="true">
          {resultLabel}
        </p>
        <span aria-hidden="true">旬</span>
      </div>

      {filteredItems.length > 0 ? (
        <div className="catalog-grid">
          {filteredItems.map((item) => (
            <MenuCard
              item={item}
              onOpenDetails={openDetails}
              onQuickAdd={quickAdd}
              key={item.id}
            />
          ))}
        </div>
      ) : (
        <div className="catalog-empty">
          <span className="catalog-editorial-jp editorial-jp" aria-hidden="true">
            余白
          </span>
          <h3>Nenhum prato encontrado</h3>
          <p>Ajuste sua busca ou use “Limpar filtros” para ver o cardápio completo.</p>
        </div>
      )}

      <ProductDetails
        product={selectedProduct}
        onAddLine={onAddLine}
        onNotify={onNotify}
        onClose={closeDetails}
      />
    </section>
  )
}
