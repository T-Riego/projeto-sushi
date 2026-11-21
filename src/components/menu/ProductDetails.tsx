import { useEffect, useMemo, useRef, useState } from 'react'
import { Minus, Plus, X } from 'lucide-react'

import type {
  Allergen,
  MenuItem,
  MenuItemId,
  ProductOptionGroup,
} from '../../types/menu'
import { catalogAssetPath, handleCatalogImageError } from './MenuCard'

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

const allergenLabels: Record<Allergen, string> = {
  gluten: 'glúten',
  crustaceos: 'crustáceos',
  peixe: 'peixe',
  soja: 'soja',
  gergelim: 'gergelim',
  leite: 'leite',
  castanhas: 'castanhas',
}

type ProductDetailsProps = {
  product: MenuItem | null
  onAddLine: (
    productId: MenuItemId,
    optionIds: readonly string[],
    quantity: number,
  ) => void
  onNotify?: (message: string) => void
  onClose: () => void
}

function getDefaultOptions(product: MenuItem): string[] {
  return (product.optionGroups ?? []).flatMap((group) =>
    group.required && group.options[0] ? [group.options[0].id] : [],
  )
}

function clampQuantity(value: number): number {
  if (!Number.isFinite(value)) {
    return 1
  }

  return Math.min(99, Math.max(1, Math.trunc(value)))
}

export function ProductDetails({
  product,
  onAddLine,
  onNotify,
  onClose,
}: ProductDetailsProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const [selectedOptionIds, setSelectedOptionIds] = useState<string[]>([])
  const [quantity, setQuantity] = useState(1)

  useEffect(() => {
    const dialog = dialogRef.current

    if (!dialog) {
      return
    }

    if (!product) {
      if (dialog.open) {
        dialog.close()
      }
      return
    }

    setSelectedOptionIds(getDefaultOptions(product))
    setQuantity(1)

    if (!dialog.open) {
      dialog.showModal()
    }

    closeButtonRef.current?.focus()
  }, [product])

  const selectedOptions = useMemo(
    () =>
      (product?.optionGroups ?? [])
        .flatMap((group) => group.options)
        .filter((option) => selectedOptionIds.includes(option.id)),
    [product, selectedOptionIds],
  )

  const optionsAreValid = (product?.optionGroups ?? []).every(
    (group) =>
      !group.required ||
      group.options.some((option) => selectedOptionIds.includes(option.id)),
  )

  const subtotal = product
    ? (product.price +
        selectedOptions.reduce((sum, option) => sum + option.priceDelta, 0)) *
      quantity
    : 0

  const requestClose = () => {
    if (dialogRef.current?.open) {
      dialogRef.current.close()
    }
    onClose()
  }

  const selectOption = (group: ProductOptionGroup, optionId: string) => {
    setSelectedOptionIds((current) => {
      if (group.selection === 'single') {
        const groupOptionIds = new Set(group.options.map(({ id }) => id))
        return [...current.filter((id) => !groupOptionIds.has(id)), optionId]
      }

      return current.includes(optionId)
        ? current.filter((id) => id !== optionId)
        : [...current, optionId]
    })
  }

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!product || !product.available || !optionsAreValid) {
      return
    }

    onAddLine(product.id, selectedOptionIds, quantity)
    onNotify?.(`${product.name} adicionado à sacola.`)
    requestClose()
  }

  return (
    <dialog
      ref={dialogRef}
      className="product-dialog"
      aria-labelledby={product ? `product-title-${product.id}` : undefined}
      aria-describedby={
        product ? `product-description-${product.id}` : undefined
      }
      onClose={onClose}
      onCancel={(event) => {
        event.preventDefault()
        requestClose()
      }}
    >
      {product ? (
        <form className="product-panel" onSubmit={handleSubmit}>
          <header className="product-header">
            <div>
              <span className="product-kicker">Detalhes do prato</span>
              <h2 id={`product-title-${product.id}`}>{product.name}</h2>
            </div>
            <button
              ref={closeButtonRef}
              type="button"
              className="product-close"
              aria-label="Fechar detalhes"
              onClick={requestClose}
            >
              <X aria-hidden="true" size={22} />
            </button>
          </header>

          <div className="product-scroll-area">
            <div className="product-image-wrap">
              <img
                src={catalogAssetPath(product.image)}
                alt={product.alt}
                width="960"
                height="720"
                onError={handleCatalogImageError}
              />
              {!product.available ? (
                <span className="product-sold-out">Esgotado</span>
              ) : null}
            </div>

            <div className="product-summary">
              <p
                className="product-description"
                id={`product-description-${product.id}`}
              >
                {product.description}
              </p>
              <div className="product-meta">
                <span>{product.portionLabel}</span>
                <strong>{currencyFormatter.format(product.price)}</strong>
              </div>
            </div>

            <section className="product-facts" aria-labelledby="product-ingredients">
              <h3 id="product-ingredients">Ingredientes</h3>
              <p>{product.ingredients.join(', ')}.</p>
              <h3>Alergênicos declarados</h3>
              <p>
                {product.allergens.length > 0
                  ? product.allergens
                      .map((allergen) => allergenLabels[allergen])
                      .join(', ')
                  : 'Nenhum para este item.'}
              </p>
            </section>

            {(product.optionGroups ?? []).map((group) => (
              <fieldset className="product-option-group" key={group.id}>
                <legend>
                  {group.label}
                  {group.required ? <span>Obrigatório</span> : <span>Opcional</span>}
                </legend>
                <div className="product-option-list">
                  {group.options.map((option) => {
                    const checked = selectedOptionIds.includes(option.id)
                    return (
                      <label className="product-option" key={option.id}>
                        <input
                          type={
                            group.selection === 'single' ? 'radio' : 'checkbox'
                          }
                          name={`product-${product.id}-${group.id}`}
                          checked={checked}
                          onChange={() => selectOption(group, option.id)}
                        />
                        <span>{option.label}</span>
                        {option.priceDelta > 0 ? (
                          <small>
                            + {currencyFormatter.format(option.priceDelta)}
                          </small>
                        ) : null}
                      </label>
                    )
                  })}
                </div>
              </fieldset>
            ))}

            <div className="product-quantity-row">
              <div>
                <label htmlFor={`product-quantity-${product.id}`}>Quantidade</label>
                <span>De 1 a 99 unidades</span>
              </div>
              <div className="product-quantity-control">
                <button
                  type="button"
                  aria-label="Diminuir quantidade"
                  disabled={quantity === 1}
                  onClick={() => setQuantity((current) => clampQuantity(current - 1))}
                >
                  <Minus aria-hidden="true" size={17} />
                </button>
                <input
                  id={`product-quantity-${product.id}`}
                  type="number"
                  min="1"
                  max="99"
                  inputMode="numeric"
                  value={quantity}
                  onChange={(event) =>
                    setQuantity(clampQuantity(Number(event.currentTarget.value)))
                  }
                />
                <button
                  type="button"
                  aria-label="Aumentar quantidade"
                  disabled={quantity === 99}
                  onClick={() => setQuantity((current) => clampQuantity(current + 1))}
                >
                  <Plus aria-hidden="true" size={17} />
                </button>
              </div>
            </div>

            <aside className="product-notice">
              <strong>Cozinha compartilhada.</strong> Pode haver contato cruzado com
              os alergênicos listados no cardápio. Restaurante, cardápio e valores
              são dados demonstrativos.
            </aside>
          </div>

          <footer className="product-footer">
            <div>
              <span>Subtotal</span>
              <strong>{currencyFormatter.format(subtotal)}</strong>
            </div>
            <button
              type="submit"
              className="product-add-button"
              disabled={!product.available || !optionsAreValid}
            >
              {product.available ? 'Adicionar à sacola' : 'Esgotado'}
            </button>
          </footer>
        </form>
      ) : null}
    </dialog>
  )
}
