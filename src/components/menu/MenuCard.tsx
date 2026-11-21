import type { SyntheticEvent } from 'react'
import { ArrowUpRight, Plus } from 'lucide-react'

import { menuCategories } from '../../data/menu'
import type { MenuItem } from '../../types/menu'

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

const tagLabels = {
  vegetariano: 'Vegetariano',
  'sem-cru': 'Sem itens crus',
  cru: 'Contém item cru',
  picante: 'Picante',
} as const

export function catalogAssetPath(path: string): string {
  return `${import.meta.env.BASE_URL}${path.replace(/^\/+/, '')}`
}

export function handleCatalogImageError(
  event: SyntheticEvent<HTMLImageElement>,
) {
  const image = event.currentTarget

  if (image.dataset.catalogFallback === 'true') {
    return
  }

  image.dataset.catalogFallback = 'true'
  image.src = catalogAssetPath('assets/sushi-0.png')
}

type MenuCardProps = {
  item: MenuItem
  onOpenDetails: (item: MenuItem, opener: HTMLButtonElement) => void
  onQuickAdd: (item: MenuItem, opener: HTMLButtonElement) => void
}

export function MenuCard({
  item,
  onOpenDetails,
  onQuickAdd,
}: MenuCardProps) {
  const category = menuCategories.find(({ id }) => id === item.categoryId)
  const badges = [
    !item.available ? 'Esgotado' : undefined,
    item.badge,
    item.featured ? 'Destaque' : undefined,
    ...item.tags.map((tag) => tagLabels[tag]),
  ]
    .filter((badge): badge is string => Boolean(badge))
    .filter((badge, index, values) => values.indexOf(badge) === index)
    .slice(0, 2)

  return (
    <article
      className={`catalog-card${item.available ? '' : ' catalog-card-unavailable'}`}
      aria-labelledby={`catalog-product-${item.id}`}
    >
      <div className="catalog-card-image-wrap">
        <img
          className="catalog-card-image"
          src={catalogAssetPath(item.image)}
          alt={item.alt}
          width="960"
          height="720"
          loading="lazy"
          decoding="async"
          onError={handleCatalogImageError}
        />
        {badges.length > 0 ? (
          <div className="catalog-card-badges" aria-label="Características do produto">
            {badges.map((badge) => (
              <span className="catalog-card-badge" key={badge}>
                {badge}
              </span>
            ))}
          </div>
        ) : null}
      </div>

      <div className="catalog-card-body">
        <p className="catalog-card-category">{category?.label}</p>
        <div className="catalog-card-title-row">
          <h3 id={`catalog-product-${item.id}`}>{item.name}</h3>
          <strong>{currencyFormatter.format(item.price)}</strong>
        </div>
        <p className="catalog-card-description">{item.description}</p>
        <p className="catalog-card-portion">{item.portionLabel}</p>

        <div className="catalog-card-actions">
          <button
            type="button"
            className="catalog-details-button"
            aria-label={`Ver detalhes de ${item.name}`}
            onClick={(event) => onOpenDetails(item, event.currentTarget)}
          >
            Ver detalhes
            <ArrowUpRight aria-hidden="true" size={16} />
          </button>

          {item.available ? (
            <button
              type="button"
              className="catalog-quick-add"
              aria-label={`Adicionar ${item.name} à sacola`}
              onClick={(event) => onQuickAdd(item, event.currentTarget)}
            >
              <Plus aria-hidden="true" size={20} />
            </button>
          ) : null}
        </div>
      </div>
    </article>
  )
}
