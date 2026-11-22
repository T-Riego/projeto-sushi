import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowUpRight,
  Minus,
  Plus,
  ShoppingBag,
  Trash2,
  X,
} from 'lucide-react'

import { menuItems } from '../../data/menu'
import { getLineUnitPrice } from '../../lib/cart'
import type { CartLine } from '../../types/menu'
import { CheckoutDemo } from '../checkout/CheckoutDemo'
import {
  catalogAssetPath,
  handleCatalogImageError,
} from '../menu/MenuCard'

export type CartDrawerProps = {
  open: boolean
  lines: readonly CartLine[]
  count: number
  total: number
  onClose: () => void
  onChangeQuantity: (key: string, delta: number) => void
  onRemoveLine: (key: string) => void
  onClearCart: () => void
  onNotify?: (message: string) => void
}

type CheckoutSnapshot = {
  lines: readonly CartLine[]
  total: number
}

type PendingQuantityFocus = {
  key: string
  action: 'decrease' | 'increase'
}

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

export function CartDrawer({
  open,
  lines,
  count,
  total,
  onClose,
  onChangeQuantity,
  onRemoveLine,
  onClearCart,
  onNotify,
}: CartDrawerProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const emptyActionRef = useRef<HTMLButtonElement>(null)
  const closeNotifiedRef = useRef(false)
  const checkoutCompletedRef = useRef(false)
  const announcementTimerRef = useRef<number | undefined>(undefined)
  const pendingRemovalIndexRef = useRef<number | null>(null)
  const pendingQuantityFocusRef = useRef<PendingQuantityFocus | null>(null)
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const [checkoutSnapshot, setCheckoutSnapshot] = useState<CheckoutSnapshot>({
    lines: [],
    total: 0,
  })
  const [announcement, setAnnouncement] = useState('')
  const hasOpenDialog = open || checkoutOpen

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) {
      return
    }

    if (open) {
      closeNotifiedRef.current = false
      if (!dialog.open) {
        dialog.showModal()
      }
      closeButtonRef.current?.focus()
      return
    }

    if (dialog.open) {
      dialog.close()
    }
  }, [open])

  useEffect(() => {
    if (!hasOpenDialog) {
      return
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [hasOpenDialog])

  useEffect(
    () => () => {
      if (announcementTimerRef.current !== undefined) {
        window.clearTimeout(announcementTimerRef.current)
      }
    },
    [],
  )

  const resolvedLines = useMemo(
    () =>
      lines.flatMap((line) => {
        const item = menuItems.find(({ id }) => id === line.productId)
        if (!item) {
          return []
        }

        const selectedOptionIds = new Set(line.optionIds)
        const options = (item.optionGroups ?? [])
          .flatMap((group) => group.options)
          .filter(({ id }) => selectedOptionIds.has(id))

        return [
          {
            line,
            item,
            options,
            unitPrice: getLineUnitPrice(line),
          },
        ]
      }),
    [lines],
  )

  const requestClose = () => {
    if (closeNotifiedRef.current) {
      return
    }

    closeNotifiedRef.current = true
    if (dialogRef.current?.open) {
      dialogRef.current.close()
    }
    onClose()
  }

  useEffect(() => {
    const pendingQuantityFocus = pendingQuantityFocusRef.current
    if (pendingQuantityFocus) {
      pendingQuantityFocusRef.current = null
      const quantityButton = [
        ...(dialogRef.current?.querySelectorAll<HTMLButtonElement>(
          '[data-cart-quantity-action]',
        ) ?? []),
      ].find(
        (button) =>
          button.dataset.cartLineKey === pendingQuantityFocus.key &&
          button.dataset.cartQuantityAction === pendingQuantityFocus.action,
      )
      quantityButton?.focus({ preventScroll: true })
    }

    const pendingRemovalIndex = pendingRemovalIndexRef.current
    if (pendingRemovalIndex === null) {
      return
    }

    pendingRemovalIndexRef.current = null
    const removeButtons = [
      ...(dialogRef.current?.querySelectorAll<HTMLButtonElement>(
        '.cart-remove-line',
      ) ?? []),
    ]
    const nextRemoveButton =
      removeButtons[Math.min(pendingRemovalIndex, removeButtons.length - 1)]

    if (nextRemoveButton) {
      nextRemoveButton.focus({ preventScroll: true })
      return
    }

    emptyActionRef.current?.focus({ preventScroll: true })
  }, [resolvedLines])

  const exploreMenu = () => {
    requestClose()
    document.getElementById('menu')?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    })
  }

  const openCheckout = () => {
    checkoutCompletedRef.current = false
    setCheckoutSnapshot({
      lines: lines.map((line) => ({
        ...line,
        optionIds: [...line.optionIds],
      })),
      total,
    })
    requestClose()
    setCheckoutOpen(true)
  }

  const changeLineQuantity = (line: CartLine, delta: number) => {
    if (delta < 0 && line.quantity === 2) {
      pendingQuantityFocusRef.current = {
        key: line.key,
        action: 'increase',
      }
    } else if (delta > 0 && line.quantity === 98) {
      pendingQuantityFocusRef.current = {
        key: line.key,
        action: 'decrease',
      }
    }

    onChangeQuantity(line.key, delta)
  }

  const removeLine = (line: CartLine, name: string, index: number) => {
    pendingRemovalIndexRef.current = index
    if (announcementTimerRef.current !== undefined) {
      window.clearTimeout(announcementTimerRef.current)
    }
    setAnnouncement('')
    announcementTimerRef.current = window.setTimeout(() => {
      setAnnouncement(`${name} removido da sacola.`)
      announcementTimerRef.current = undefined
    }, 0)
    onRemoveLine(line.key)
  }

  const completeCheckout = () => {
    if (checkoutCompletedRef.current) {
      return
    }

    checkoutCompletedRef.current = true
    onClearCart()
    onNotify?.('Checkout demonstrativo concluído. A sacola foi limpa.')
  }

  return (
    <>
      <dialog
        ref={dialogRef}
        className="cart-drawer-dialog"
        aria-labelledby="cart-drawer-title"
        onCancel={(event) => {
          event.preventDefault()
          requestClose()
        }}
        onClick={(event) => {
          if (event.target === event.currentTarget) {
            requestClose()
          }
        }}
      >
        <div className="cart-drawer-panel">
          <header className="cart-drawer-header">
            <div>
              <p className="cart-drawer-kicker">Seu momento AYORUME</p>
              <h2 id="cart-drawer-title">
                Sua sacola <span>({count})</span>
              </h2>
            </div>
            <button
              ref={closeButtonRef}
              className="cart-drawer-close"
              type="button"
              aria-label="Fechar sacola"
              onClick={requestClose}
            >
              <X aria-hidden="true" size={20} />
            </button>
          </header>

          <p
            className="cart-live-region"
            role="status"
            aria-live="polite"
            aria-atomic="true"
          >
            {announcement}
          </p>

          {resolvedLines.length === 0 ? (
            <div className="cart-drawer-empty">
              <ShoppingBag aria-hidden="true" size={46} strokeWidth={1.25} />
              <h3>Uma boa escolha começa aqui.</h3>
              <p>Seu próximo favorito está no cardápio.</p>
              <button
                ref={emptyActionRef}
                className="cart-empty-action"
                type="button"
                onClick={exploreMenu}
              >
                Explorar o cardápio
                <ArrowUpRight aria-hidden="true" size={18} />
              </button>
            </div>
          ) : (
            <>
              <div className="cart-drawer-content">
                <ul className="cart-line-list">
                  {resolvedLines.map(({ line, item, options, unitPrice }, index) => (
                    <li className="cart-line" key={line.key}>
                      <img
                        className="cart-line-image"
                        src={catalogAssetPath(item.image)}
                        alt={item.alt}
                        width="176"
                        height="176"
                        loading="lazy"
                        decoding="async"
                        onError={handleCatalogImageError}
                      />
                      <div className="cart-line-main">
                        <div className="cart-line-heading">
                          <div>
                            <h3>{item.name}</h3>
                            <p>{item.portionLabel}</p>
                          </div>
                          <strong>{currencyFormatter.format(unitPrice)}</strong>
                        </div>

                        {options.length > 0 ? (
                          <ul
                            className="cart-line-options"
                            aria-label={`Opções de ${item.name}`}
                          >
                            {options.map((option) => (
                              <li key={option.id}>{option.label}</li>
                            ))}
                          </ul>
                        ) : (
                          <p className="cart-line-options-empty">Sem adicionais</p>
                        )}

                        <div className="cart-line-actions">
                          <div className="cart-quantity-control">
                            <button
                              className="cart-quantity-button"
                              type="button"
                              disabled={line.quantity <= 1}
                              data-cart-line-key={line.key}
                              data-cart-quantity-action="decrease"
                              aria-label={`Diminuir quantidade de ${item.name}`}
                              onClick={() => changeLineQuantity(line, -1)}
                            >
                              <Minus aria-hidden="true" size={15} />
                            </button>
                            <output
                              className="cart-quantity-value"
                              aria-label={`Quantidade de ${item.name}`}
                              aria-live="polite"
                              aria-atomic="true"
                            >
                              {line.quantity}
                            </output>
                            <button
                              className="cart-quantity-button"
                              type="button"
                              disabled={line.quantity >= 99}
                              data-cart-line-key={line.key}
                              data-cart-quantity-action="increase"
                              aria-label={`Aumentar quantidade de ${item.name}`}
                              onClick={() => changeLineQuantity(line, 1)}
                            >
                              <Plus aria-hidden="true" size={15} />
                            </button>
                          </div>
                          <button
                            className="cart-remove-line"
                            type="button"
                            aria-label={`Remover ${item.name}`}
                            onClick={() => removeLine(line, item.name, index)}
                          >
                            <Trash2 aria-hidden="true" size={15} />
                            Remover
                          </button>
                        </div>
                      </div>
                      <div className="cart-line-subtotal">
                        <span>Subtotal</span>
                        <strong>
                          {currencyFormatter.format(unitPrice * line.quantity)}
                        </strong>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              <footer className="cart-drawer-footer">
                <div className="cart-total-row">
                  <span>Total dos itens</span>
                  <strong>{currencyFormatter.format(total)}</strong>
                </div>
                <p className="cart-demo-warning">
                  Sacola e checkout demonstrativos. Nenhum pedido será enviado.
                </p>
                <button
                  className="cart-checkout-action"
                  type="button"
                  onClick={openCheckout}
                >
                  Continuar para checkout
                  <ArrowUpRight aria-hidden="true" size={18} />
                </button>
              </footer>
            </>
          )}
        </div>
      </dialog>

      <CheckoutDemo
        open={checkoutOpen}
        lines={checkoutSnapshot.lines}
        total={checkoutSnapshot.total}
        onClose={() => {
          setCheckoutOpen(false)
          onClose()
        }}
        onComplete={completeCheckout}
      />
    </>
  )
}
