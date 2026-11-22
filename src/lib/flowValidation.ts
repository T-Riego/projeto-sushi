import { restaurant } from '../data/restaurant'
import type {
  CheckoutDraft,
  FieldErrors,
  ReservationDraft,
} from '../types/flows'

const isoDatePattern = /^\d{4}-\d{2}-\d{2}$/
const weekdays = [
  'domingo',
  'segunda',
  'terça',
  'quarta',
  'quinta',
  'sexta',
  'sábado',
] as const

function parseIsoDate(value: string): Date | null {
  if (!isoDatePattern.test(value)) {
    return null
  }

  const parsed = new Date(`${value}T00:00:00.000Z`)
  if (Number.isNaN(parsed.getTime()) || formatIsoDate(parsed) !== value) {
    return null
  }

  return parsed
}

function formatIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10)
}

function formatMinutes(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  return `${hours.toString().padStart(2, '0')}:${minutes
    .toString()
    .padStart(2, '0')}`
}

function timeToMinutes(value: string): number {
  const [hours, minutes] = value.split(':').map(Number)
  return hours * 60 + minutes
}

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

export function sanitizeCheckoutAfterConfirmation(
  draft: CheckoutDraft,
): CheckoutDraft {
  return {
    mode: draft.mode,
    schedule:
      draft.schedule.kind === 'scheduled'
        ? { kind: 'scheduled', value: draft.schedule.value }
        : { kind: 'asap' },
    contact: { name: '', phone: '' },
    notes: '',
  }
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

export function getReservationDateBounds(todayIso: string): {
  min: string
  max: string
} {
  const today = parseIsoDate(todayIso)
  if (!today) {
    throw new RangeError('todayIso deve usar o formato YYYY-MM-DD.')
  }

  const maxDate = new Date(today)
  maxDate.setUTCDate(maxDate.getUTCDate() + restaurant.reservationWindowDays)

  return { min: todayIso, max: formatIsoDate(maxDate) }
}

export function getReservationTimes(dateIso: string): string[] {
  const date = parseIsoDate(dateIso)
  if (!date) {
    return []
  }

  const weekday = weekdays[date.getUTCDay()]
  const openingHours = restaurant.openingHours.find(
    ({ day }) => day === weekday,
  )
  if (!openingHours || 'closed' in openingHours) {
    return []
  }

  const opens = timeToMinutes(openingHours.opens)
  const closes = timeToMinutes(openingHours.closes)
  const slots: string[] = []
  for (let time = opens; time < closes; time += 30) {
    slots.push(formatMinutes(time))
  }

  return slots
}

export function validateReservation(
  draft: ReservationDraft,
  todayIso: string,
): FieldErrors {
  const errors: FieldErrors = {}

  if (
    !Number.isInteger(draft.partySize) ||
    draft.partySize < 1 ||
    draft.partySize > restaurant.maxPartySize
  ) {
    errors.partySize = `Escolha de 1 a ${restaurant.maxPartySize} pessoas.`
  }

  const selectedDate = parseIsoDate(draft.date)
  const today = parseIsoDate(todayIso)
  if (!selectedDate || !today) {
    errors.date = 'Escolha uma data válida nos próximos 30 dias.'
  } else {
    const { min, max } = getReservationDateBounds(todayIso)
    if (draft.date < min || draft.date > max) {
      errors.date = 'Escolha uma data válida nos próximos 30 dias.'
    }
  }

  if (
    !draft.time.trim() ||
    !getReservationTimes(draft.date).includes(draft.time)
  ) {
    errors.time = 'Escolha um horário para a reserva.'
  }

  if (draft.name.trim().length < 2) {
    errors.name = 'Informe um nome com pelo menos 2 caracteres.'
  }

  const phoneDigits = draft.phone.replace(/\D/g, '')
  if (phoneDigits.length !== 10 && phoneDigits.length !== 11) {
    errors.phone = 'Informe um telefone com DDD.'
  }

  if ((draft.occasion?.length ?? 0) > 100) {
    errors.occasion = 'A ocasião deve ter no máximo 100 caracteres.'
  }

  if ((draft.dietaryNotes?.length ?? 0) > 400) {
    errors.dietaryNotes =
      'As restrições alimentares devem ter no máximo 400 caracteres.'
  }

  return errors
}

export function sanitizeReservationAfterConfirmation(
  draft: ReservationDraft,
): ReservationDraft {
  return {
    partySize: draft.partySize,
    date: draft.date,
    time: draft.time,
    name: '',
    phone: '',
    occasion: '',
    dietaryNotes: '',
  }
}

export function createDemoReservationCode(
  random: () => number = Math.random,
): string {
  const sample = random()
  const normalized = Number.isFinite(sample)
    ? Math.min(0.9999, Math.max(0, sample))
    : 0
  const suffix = Math.floor(normalized * 10_000)
    .toString()
    .padStart(4, '0')

  return `AYO-RES-${suffix}`
}
