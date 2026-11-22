import { describe, expect, it } from 'vitest'

import type { CheckoutDraft, ReservationDraft } from '../types/flows'
import {
  createDemoReservationCode,
  createDemoOrderCode,
  getReservationDateBounds,
  getReservationTimes,
  isDeliveryNeighborhood,
  sanitizeReservationAfterConfirmation,
  sanitizeCheckoutAfterConfirmation,
  validateReservation,
  validateCheckout,
} from './flowValidation'

function validPickupDraft(
  overrides: Partial<CheckoutDraft> = {},
): CheckoutDraft {
  return {
    mode: 'pickup',
    schedule: { kind: 'asap' },
    contact: { name: 'Ana Lima', phone: '(31) 99999-1234' },
    payment: 'pix',
    notes: '',
    ...overrides,
  }
}

function validReservationDraft(
  overrides: Partial<ReservationDraft> = {},
): ReservationDraft {
  return {
    partySize: 2,
    date: '2026-11-24',
    time: '19:30',
    name: 'Ana Lima',
    phone: '(31) 99999-1234',
    occasion: '',
    dietaryNotes: '',
    ...overrides,
  }
}

describe('flowValidation', () => {
  it('aceita retirada completa sem endereço', () => {
    expect(validateCheckout(validPickupDraft())).toEqual({})
  })

  it('exige endereço e bairro atendido somente para entrega', () => {
    const errors = validateCheckout(
      validPickupDraft({ mode: 'delivery', address: undefined }),
    )

    expect(errors).toMatchObject({
      street: expect.any(String),
      number: expect.any(String),
      neighborhood: expect.any(String),
    })

    expect(
      validateCheckout(
        validPickupDraft({
          mode: 'pickup',
          address: {
            street: '',
            number: '',
            neighborhood: 'Outro bairro',
          },
        }),
      ),
    ).toEqual({})
  })

  it('reconhece somente os sete bairros da área de entrega', () => {
    expect(isDeliveryNeighborhood('Savassi')).toBe(true)
    expect(isDeliveryNeighborhood('Funcionários')).toBe(true)
    expect(isDeliveryNeighborhood('Lourdes')).toBe(true)
    expect(isDeliveryNeighborhood('Santo Agostinho')).toBe(true)
    expect(isDeliveryNeighborhood('Serra')).toBe(true)
    expect(isDeliveryNeighborhood('Anchieta')).toBe(true)
    expect(isDeliveryNeighborhood('Sion')).toBe(true)
    expect(isDeliveryNeighborhood('Outro bairro')).toBe(false)
    expect(isDeliveryNeighborhood('')).toBe(false)
  })

  it('exige um horário quando a opção agendada é escolhida', () => {
    expect(
      validateCheckout(
        validPickupDraft({ schedule: { kind: 'scheduled', value: '' } }),
      ),
    ).toHaveProperty('schedule')

    expect(
      validateCheckout(
        validPickupDraft({
          schedule: { kind: 'scheduled', value: '19:30' },
        }),
      ),
    ).toEqual({})
  })

  it('valida modalidade, contato e pagamento', () => {
    const errors = validateCheckout({
      schedule: { kind: 'asap' },
      contact: { name: ' A ', phone: '31 9999-123' },
    })

    expect(errors).toMatchObject({
      mode: expect.any(String),
      name: expect.any(String),
      phone: expect.any(String),
      payment: expect.any(String),
    })

    expect(
      validateCheckout(
        validPickupDraft({
          contact: { name: ' Li ', phone: '(31) 3333-4444' },
          payment: 'cash',
        }),
      ),
    ).toEqual({})
  })

  it('limita a observação opcional a 400 caracteres', () => {
    expect(validateCheckout(validPickupDraft({ notes: 'a'.repeat(400) }))).toEqual(
      {},
    )
    expect(
      validateCheckout(validPickupDraft({ notes: 'a'.repeat(401) })),
    ).toHaveProperty('notes')
  })

  it('remove PII, endereço, observações e pagamento após a confirmação', () => {
    const draft: CheckoutDraft = {
      mode: 'delivery',
      schedule: { kind: 'scheduled', value: '20:30' },
      contact: { name: 'Ana Lima', phone: '(31) 99999-1234' },
      address: {
        street: 'Rua Confidencial',
        number: '99',
        complement: 'Apto 202',
        neighborhood: 'Savassi',
      },
      payment: 'card-on-delivery',
      notes: 'Alergia informada em caráter privado',
    }

    const sanitized = sanitizeCheckoutAfterConfirmation(draft)

    expect(sanitized).toEqual({
      mode: 'delivery',
      schedule: { kind: 'scheduled', value: '20:30' },
      contact: { name: '', phone: '' },
      notes: '',
    })
    expect(sanitized).not.toHaveProperty('address')
    expect(sanitized).not.toHaveProperty('payment')
    expect(draft.contact.name).toBe('Ana Lima')
    expect(draft.address?.street).toBe('Rua Confidencial')
  })

  it('cria um código demonstrativo determinístico no formato AYORUME', () => {
    expect(createDemoOrderCode(() => 0.0042)).toBe('AYO-BH-0042')
    expect(createDemoOrderCode(() => 0.9876)).toBe('AYO-BH-9876')
    expect(createDemoOrderCode()).toMatch(/^AYO-BH-\d{4}$/)
  })

  it('calcula uma janela inclusiva de 30 dias para reservas', () => {
    expect(getReservationDateBounds('2026-11-22')).toEqual({
      min: '2026-11-22',
      max: '2026-12-22',
    })
    expect(getReservationDateBounds('2026-12-15')).toEqual({
      min: '2026-12-15',
      max: '2027-01-14',
    })
  })

  it('gera horários de meia em meia hora conforme o expediente e fecha na segunda', () => {
    expect(getReservationTimes('2026-11-23')).toEqual([])
    expect(getReservationTimes('2026-11-24')).toEqual([
      '18:00',
      '18:30',
      '19:00',
      '19:30',
      '20:00',
      '20:30',
      '21:00',
      '21:30',
      '22:00',
    ])
    expect(getReservationTimes('2026-11-22')).toEqual([
      '12:00',
      '12:30',
      '13:00',
      '13:30',
      '14:00',
      '14:30',
      '15:00',
      '15:30',
      '16:00',
      '16:30',
      '17:00',
      '17:30',
      '18:00',
      '18:30',
      '19:00',
      '19:30',
      '20:00',
      '20:30',
      '21:00',
    ])
    expect(getReservationTimes('data-inválida')).toEqual([])
  })

  it('aceita uma reserva completa dentro dos limites', () => {
    expect(
      validateReservation(validReservationDraft(), '2026-11-22'),
    ).toEqual({})
    expect(
      validateReservation(
        validReservationDraft({
          partySize: 8,
          date: '2026-12-22',
          name: ' Li ',
          phone: '(31) 3333-4444',
          occasion: 'a'.repeat(100),
          dietaryNotes: 'b'.repeat(400),
        }),
        '2026-11-22',
      ),
    ).toEqual({})
  })

  it('rejeita um horário que não pertence ao expediente da data escolhida', () => {
    expect(
      validateReservation(
        validReservationDraft({ date: '2026-11-24', time: '12:00' }),
        '2026-11-22',
      ),
    ).toHaveProperty('time')
  })

  it('rejeita pessoas, data, horário e contato inválidos', () => {
    expect(
      validateReservation(
        validReservationDraft({
          partySize: 1.5,
          date: '2026-11-21',
          time: ' ',
          name: ' A ',
          phone: '31 9999-123',
          occasion: 'a'.repeat(101),
          dietaryNotes: 'b'.repeat(401),
        }),
        '2026-11-22',
      ),
    ).toMatchObject({
      partySize: expect.any(String),
      date: expect.any(String),
      time: expect.any(String),
      name: expect.any(String),
      phone: expect.any(String),
      occasion: expect.any(String),
      dietaryNotes: expect.any(String),
    })

    expect(
      validateReservation(
        validReservationDraft({ partySize: 9, date: '2026-12-23' }),
        '2026-11-22',
      ),
    ).toMatchObject({
      partySize: expect.any(String),
      date: expect.any(String),
    })
    expect(
      validateReservation(
        validReservationDraft({ date: '2026-02-30' }),
        '2026-02-01',
      ),
    ).toHaveProperty('date')
  })

  it('remove PII da reserva sem mutar o rascunho original', () => {
    const draft = validReservationDraft({
      occasion: 'Aniversário',
      dietaryNotes: 'Alergia confidencial',
    })

    const sanitized = sanitizeReservationAfterConfirmation(draft)

    expect(sanitized).toEqual({
      partySize: 2,
      date: '2026-11-24',
      time: '19:30',
      name: '',
      phone: '',
      occasion: '',
      dietaryNotes: '',
    })
    expect(draft).toEqual(
      expect.objectContaining({
        name: 'Ana Lima',
        phone: '(31) 99999-1234',
        occasion: 'Aniversário',
        dietaryNotes: 'Alergia confidencial',
      }),
    )
  })

  it('cria um código de reserva demonstrativo determinístico', () => {
    expect(createDemoReservationCode(() => 0.0042)).toBe('AYO-RES-0042')
    expect(createDemoReservationCode(() => 0.9876)).toBe('AYO-RES-9876')
    expect(createDemoReservationCode()).toMatch(/^AYO-RES-\d{4}$/)
  })
})
