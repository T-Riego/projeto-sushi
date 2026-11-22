import { CalendarDays, ShoppingBag, Utensils } from 'lucide-react'

export type MobileActionBarProps = {
  count: number
  onMenu: () => void
  onOrder: () => void
  onReservation: () => void
}

export function MobileActionBar({
  count,
  onMenu,
  onOrder,
  onReservation,
}: MobileActionBarProps) {
  const itemLabel = `${count} ${count === 1 ? 'item' : 'itens'}`

  return (
    <nav className="flow-mobile-action-bar" aria-label="Ações rápidas">
      <button
        className="flow-mobile-action-button"
        type="button"
        onClick={onMenu}
      >
        <Utensils size={18} aria-hidden="true" />
        <span>Cardápio</span>
      </button>
      <button
        className="flow-mobile-action-button"
        type="button"
        aria-label={`Pedir, sacola com ${itemLabel}`}
        onClick={onOrder}
      >
        <ShoppingBag size={18} aria-hidden="true" />
        <span>Pedir</span>
        <span className="flow-mobile-action-count" aria-hidden="true">
          {count.toString().padStart(2, '0')}
        </span>
      </button>
      <button
        className="flow-mobile-action-button"
        type="button"
        onClick={onReservation}
      >
        <CalendarDays size={18} aria-hidden="true" />
        <span>Reservar</span>
      </button>
    </nav>
  )
}
