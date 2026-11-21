import { useCallback, useEffect, useMemo, useState } from 'react'

import {
  createCartLine,
  getCartTotal,
  readCart,
  writeCart,
} from '../lib/cart'
import type { CartLine, MenuItemId } from '../types/menu'

export function useCart() {
  const [lines, setLines] = useState<CartLine[]>(() => readCart())

  useEffect(() => {
    writeCart(lines)
  }, [lines])

  const addLine = useCallback(
    (productId: MenuItemId, optionIds: readonly string[], quantity = 1) => {
      let incoming: CartLine
      try {
        incoming = createCartLine(productId, optionIds, quantity)
      } catch (error) {
        if (error instanceof RangeError) {
          return
        }
        throw error
      }

      setLines((current) => {
        const existingIndex = current.findIndex(({ key }) => key === incoming.key)
        if (existingIndex === -1) {
          return [...current, incoming]
        }

        return current.map((line, index) =>
          index === existingIndex
            ? {
                ...line,
                quantity: Math.min(99, line.quantity + incoming.quantity),
              }
            : line,
        )
      })
    },
    [],
  )

  const changeQuantity = useCallback((key: string, delta: number) => {
    if (!Number.isFinite(delta)) {
      return
    }

    setLines((current) =>
      current.flatMap((line) => {
        if (line.key !== key) {
          return [line]
        }

        const nextQuantity = line.quantity + Math.trunc(delta)
        return nextQuantity <= 0
          ? []
          : [{ ...line, quantity: Math.min(99, nextQuantity) }]
      }),
    )
  }, [])

  const removeLine = useCallback((key: string) => {
    setLines((current) => current.filter((line) => line.key !== key))
  }, [])

  const clearCart = useCallback(() => {
    setLines([])
  }, [])

  const count = useMemo(
    () => lines.reduce((total, { quantity }) => total + quantity, 0),
    [lines],
  )
  const total = useMemo(() => getCartTotal(lines), [lines])

  return {
    lines,
    count,
    total,
    addLine,
    changeQuantity,
    removeLine,
    clearCart,
  }
}
