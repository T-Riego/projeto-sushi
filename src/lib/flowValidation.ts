import { restaurant } from '../data/restaurant'
import type { CheckoutDraft, FieldErrors } from '../types/flows'

export function isDeliveryNeighborhood(value: string): boolean {
  return restaurant.deliveryNeighborhoods.some(
    (neighborhood) => neighborhood === value.trim(),
  )
}

export function validateCheckout(draft: CheckoutDraft): FieldErrors {
  const errors: FieldErrors = {}

  if (!draft.mode) {
    errors.mode = 'Escolha entrega ou retirada.'
  }

  if (draft.schedule.kind === 'scheduled' && !draft.schedule.value.trim()) {
    errors.schedule = 'Escolha um horário para o pedido.'
  }

  if (draft.contact.name.trim().length < 2) {
    errors.name = 'Informe um nome com pelo menos 2 caracteres.'
  }

  const phoneDigits = draft.contact.phone.replace(/\D/g, '')
  if (phoneDigits.length !== 10 && phoneDigits.length !== 11) {
    errors.phone = 'Informe um telefone com DDD.'
  }

  if (!draft.payment) {
    errors.payment = 'Escolha uma forma de pagamento.'
  }

  if (draft.mode === 'delivery') {
    if (!draft.address) {
      errors.address = 'Informe o endereço de entrega.'
    }
    if (!draft.address?.street.trim()) {
      errors.street = 'Informe a rua ou avenida.'
    }
    if (!draft.address?.number.trim()) {
      errors.number = 'Informe o número.'
    }
    if (!isDeliveryNeighborhood(draft.address?.neighborhood ?? '')) {
      errors.neighborhood = 'Escolha um bairro dentro da área de entrega.'
    }
  }

  if ((draft.notes?.length ?? 0) > 400) {
    errors.notes = 'A observação deve ter no máximo 400 caracteres.'
  }

  return errors
}

export function createDemoOrderCode(random: () => number = Math.random): string {
  const sample = random()
  const normalized = Number.isFinite(sample)
    ? Math.min(0.9999, Math.max(0, sample))
    : 0
  const suffix = Math.floor(normalized * 10_000)
    .toString()
    .padStart(4, '0')

  return `AYO-BH-${suffix}`
}
