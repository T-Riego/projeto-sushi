import { menuItems } from '../data/menu'
import type { CartLine, MenuItem, MenuItemId } from '../types/menu'

export const CART_STORAGE_KEY = 'ayorume-cart-v2'

const LEGACY_CART_STORAGE_KEY = 'ayorume-cart-v1'

function normalizeQuantity(quantity: number): number {
  const integer = Number.isFinite(quantity) ? Math.trunc(quantity) : 1
  return Math.min(99, Math.max(1, integer))
}

export function createCartLine(
  productId: MenuItemId,
  optionIds: readonly string[],
  quantity = 1,
): CartLine {
  const normalizedOptionIds = [...new Set(optionIds)].sort()

  return {
    key: `${productId}::${normalizedOptionIds.join('|') || 'base'}`,
    productId,
    quantity: normalizeQuantity(quantity),
    optionIds: normalizedOptionIds,
  }
}

function resolveStorage(storage?: Storage): Storage | undefined {
  if (storage) {
    return storage
  }

  try {
    return globalThis.localStorage
  } catch {
    return undefined
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function parseCartLine(value: unknown): CartLine | undefined {
  if (!isRecord(value)) {
    return undefined
  }

  const item = menuItems.find(({ id }) => id === value.productId)
  if (
    !item ||
    typeof value.key !== 'string' ||
    !Number.isInteger(value.quantity) ||
    (value.quantity as number) < 1 ||
    (value.quantity as number) > 99 ||
    !Array.isArray(value.optionIds) ||
    !value.optionIds.every((optionId) => typeof optionId === 'string')
  ) {
    return undefined
  }

  const validOptionIds = new Set(
    item.optionGroups?.flatMap(({ options }) => options.map(({ id }) => id)) ?? [],
  )
  if (!value.optionIds.every((optionId) => validOptionIds.has(optionId))) {
    return undefined
  }

  const normalized = createCartLine(
    item.id,
    value.optionIds,
    value.quantity as number,
  )
  return normalized.key === value.key ? normalized : undefined
}

export function readCart(storage?: Storage): CartLine[] {
  const target = resolveStorage(storage)
  if (!target) {
    return []
  }

  try {
    target.removeItem(LEGACY_CART_STORAGE_KEY)
  } catch {
    // Storage can be unavailable in private or restricted browser contexts.
  }

  try {
    const serialized = target.getItem(CART_STORAGE_KEY)
    if (!serialized) {
      return []
    }

    const parsed: unknown = JSON.parse(serialized)
    return Array.isArray(parsed)
      ? parsed.flatMap((value) => {
          const line = parseCartLine(value)
          return line ? [line] : []
        })
      : []
  } catch {
    return []
  }
}

export function writeCart(lines: readonly CartLine[], storage?: Storage): void {
  const target = resolveStorage(storage)
  if (!target) {
    return
  }

  try {
    target.setItem(CART_STORAGE_KEY, JSON.stringify(lines))
  } catch {
    // Persistence failure must not interrupt cart interactions.
  }
}

export function getLineUnitPrice(
  line: CartLine,
  items: readonly MenuItem[] = menuItems,
): number {
  const item = items.find(({ id }) => id === line.productId)
  if (!item) {
    return 0
  }

  const selectedOptionIds = new Set(line.optionIds)
  const optionTotal = item.optionGroups
    ?.flatMap(({ options }) => options)
    .filter(({ id }) => selectedOptionIds.has(id))
    .reduce((total, { priceDelta }) => total + priceDelta, 0) ?? 0

  return item.price + optionTotal
}

export function getCartTotal(
  lines: readonly CartLine[],
  items: readonly MenuItem[] = menuItems,
): number {
  return lines.reduce(
    (total, line) => total + getLineUnitPrice(line, items) * line.quantity,
    0,
  )
}
