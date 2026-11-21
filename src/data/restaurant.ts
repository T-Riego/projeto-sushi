export type Weekday =
  | 'segunda'
  | 'terça'
  | 'quarta'
  | 'quinta'
  | 'sexta'
  | 'sábado'
  | 'domingo'

export type OpeningHours =
  | { readonly day: Weekday; readonly closed: true }
  | { readonly day: Weekday; readonly opens: string; readonly closes: string }

export interface Restaurant {
  readonly name: string
  readonly address: string
  readonly fictional: boolean
  readonly timezone: string
  readonly deliveryNeighborhoods: readonly string[]
  readonly reservationWindowDays: number
  readonly maxPartySize: number
  readonly openingHours: readonly OpeningHours[]
}

export const restaurant = {
  name: 'AYORUME Savassi',
  address: 'Alameda do Horizonte, 118 — Savassi, Belo Horizonte — MG',
  fictional: true,
  timezone: 'America/Sao_Paulo',
  deliveryNeighborhoods: [
    'Savassi',
    'Funcionários',
    'Lourdes',
    'Santo Agostinho',
    'Serra',
    'Anchieta',
    'Sion',
  ],
  reservationWindowDays: 30,
  maxPartySize: 8,
  openingHours: [
    { day: 'segunda', closed: true },
    { day: 'terça', opens: '18:00', closes: '22:30' },
    { day: 'quarta', opens: '18:00', closes: '22:30' },
    { day: 'quinta', opens: '18:00', closes: '22:30' },
    { day: 'sexta', opens: '18:00', closes: '23:30' },
    { day: 'sábado', opens: '18:00', closes: '23:30' },
    { day: 'domingo', opens: '12:00', closes: '21:30' },
  ],
} as const satisfies Restaurant
