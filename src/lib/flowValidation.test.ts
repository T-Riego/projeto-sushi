import { describe, expect, it } from 'vitest'

import type { CheckoutDraft } from '../types/flows'
import {
  createDemoOrderCode,
  isDeliveryNeighborhood,
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

  it('cria um código demonstrativo determinístico no formato AYORUME', () => {
    expect(createDemoOrderCode(() => 0.0042)).toBe('AYO-BH-0042')
    expect(createDemoOrderCode(() => 0.9876)).toBe('AYO-BH-9876')
    expect(createDemoOrderCode()).toMatch(/^AYO-BH-\d{4}$/)
  })
})
