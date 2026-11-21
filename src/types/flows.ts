export type FulfillmentMode = 'delivery' | 'pickup'

export type PaymentMethod = 'pix' | 'card-on-delivery' | 'cash'

export interface CheckoutContact {
  name: string
  phone: string
}

export interface CheckoutAddress {
  street: string
  number: string
  complement?: string
  neighborhood: string
}

export interface CheckoutDraft {
  mode?: FulfillmentMode
  schedule: 'asap' | string
  contact: CheckoutContact
  address?: CheckoutAddress
  payment?: PaymentMethod
  notes?: string
}

export interface ReservationDraft {
  partySize: number
  date: string
  time: string
  name: string
  phone: string
  occasion?: string
  dietaryNotes?: string
}

export type FieldErrors = Record<string, string>
