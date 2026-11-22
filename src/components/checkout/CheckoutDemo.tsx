import { useEffect, useMemo, useRef, useState } from 'react'

import { menuItems } from '../../data/menu'
import { restaurant } from '../../data/restaurant'
import { getLineUnitPrice } from '../../lib/cart'
import {
  createDemoOrderCode,
  sanitizeCheckoutAfterConfirmation,
  validateCheckout,
} from '../../lib/flowValidation'
import type {
  CheckoutAddress,
  CheckoutContact,
  CheckoutDraft,
  CheckoutSchedule,
  FieldErrors,
  FulfillmentMode,
  PaymentMethod,
} from '../../types/flows'
import type { CartLine } from '../../types/menu'
import { DemoNotice } from '../site/DemoNotice'

export type CheckoutDemoProps = {
  open: boolean
  lines: readonly CartLine[]
  total: number
  onClose: () => void
  onComplete: () => void
}

type CheckoutStep = 1 | 2 | 3 | 4

const scheduleTimes = ['18:30', '19:00', '19:30', '20:00', '20:30', '21:00']

const paymentLabels: Record<PaymentMethod, string> = {
  pix: 'Pix',
  'card-on-delivery': 'Cartão na entrega',
  cash: 'Dinheiro',
}

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

const emptyContact: CheckoutContact = { name: '', phone: '' }
const emptyAddress: CheckoutAddress = {
  street: '',
  number: '',
  complement: '',
  neighborhood: '',
}

const stepOneFields = new Set(['mode', 'schedule'])
const stepTwoFields = new Set([
  'name',
  'phone',
  'address',
  'street',
  'number',
  'neighborhood',
  'payment',
  'notes',
])

function selectErrors(errors: FieldErrors, fields: Set<string>): FieldErrors {
  return Object.fromEntries(
    Object.entries(errors).filter(([field]) => fields.has(field)),
  )
}

function modeLabel(mode: FulfillmentMode | undefined): string {
  if (mode === 'delivery') {
    return 'Entrega'
  }
  if (mode === 'pickup') {
    return 'Retirada'
  }
  return 'Não definida'
}

function ErrorMessage({ id, message }: { id: string; message?: string }) {
  return message ? (
    <p className="flow-field-error" id={id}>
      {message}
    </p>
  ) : null
}

export function CheckoutDemo({
  open,
  lines,
  total,
  onClose,
  onComplete,
}: CheckoutDemoProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const stepHeadingRef = useRef<HTMLHeadingElement>(null)
  const errorSummaryRef = useRef<HTMLDivElement>(null)
  const previousStepRef = useRef<CheckoutStep>(1)
  const validationAttemptRef = useRef(0)
  const focusedValidationAttemptRef = useRef(0)
  const closeNotifiedRef = useRef(false)
  const completedRef = useRef(false)
  const completionPendingRef = useRef(false)

  const [step, setStep] = useState<CheckoutStep>(1)
  const [mode, setMode] = useState<FulfillmentMode>()
  const [schedule, setSchedule] = useState<CheckoutSchedule>({ kind: 'asap' })
  const [contact, setContact] = useState<CheckoutContact>(emptyContact)
  const [address, setAddress] = useState<CheckoutAddress>(emptyAddress)
  const [payment, setPayment] = useState<PaymentMethod>()
  const [notes, setNotes] = useState('')
  const [errors, setErrors] = useState<FieldErrors>({})
  const [orderCode, setOrderCode] = useState('')
  const [confirmedTotal, setConfirmedTotal] = useState<number | null>(null)
  const [pickupNotice, setPickupNotice] = useState('')

  const resetState = () => {
    previousStepRef.current = 1
    validationAttemptRef.current = 0
    focusedValidationAttemptRef.current = 0
    completionPendingRef.current = false
    setStep(1)
    setMode(undefined)
    setSchedule({ kind: 'asap' })
    setContact({ ...emptyContact })
    setAddress({ ...emptyAddress })
    setPayment(undefined)
    setNotes('')
    setErrors({})
    setOrderCode('')
    setConfirmedTotal(null)
    setPickupNotice('')
  }

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) {
      return
    }

    if (open) {
      closeNotifiedRef.current = false
      completedRef.current = false
      resetState()
      if (!dialog.open) {
        dialog.showModal()
      }
      closeButtonRef.current?.focus()
      return
    }

    if (dialog.open) {
      dialog.close()
    }
    resetState()
  }, [open])

  useEffect(() => {
    if (step !== 4 || !completionPendingRef.current) {
      return
    }

    completionPendingRef.current = false
    onComplete()
  }, [onComplete, step])

  const reviewLines = useMemo(
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

  const clearErrors = (...fields: string[]) => {
    setErrors((current) => {
      if (!fields.some((field) => current[field])) {
        return current
      }

      const next = { ...current }
      for (const field of fields) {
        delete next[field]
      }
      return next
    })
  }

  const checkoutDraft = (): CheckoutDraft => ({
    mode,
    schedule,
    contact,
    address: mode === 'delivery' ? address : undefined,
    payment,
    notes,
  })

  const validateStep = (fields: Set<string>): boolean => {
    const stepErrors = selectErrors(validateCheckout(checkoutDraft()), fields)
    if (Object.keys(stepErrors).length > 0) {
      validationAttemptRef.current += 1
    }
    setErrors(stepErrors)
    return Object.keys(stepErrors).length === 0
  }

  const advance = () => {
    if (step === 1 && validateStep(stepOneFields)) {
      setErrors({})
      setStep(2)
      return
    }

    if (step === 2 && validateStep(stepTwoFields)) {
      setErrors({})
      setStep(3)
    }
  }

  const completeDemo = () => {
    if (completedRef.current) {
      return
    }

    completedRef.current = true
    const sanitizedDraft = sanitizeCheckoutAfterConfirmation(checkoutDraft())
    setMode(sanitizedDraft.mode)
    setSchedule(sanitizedDraft.schedule)
    setContact(sanitizedDraft.contact)
    setAddress(sanitizedDraft.address ?? { ...emptyAddress })
    setPayment(sanitizedDraft.payment)
    setNotes(sanitizedDraft.notes ?? '')
    setErrors({})
    setPickupNotice('')
    setOrderCode(createDemoOrderCode())
    setConfirmedTotal(total)
    completionPendingRef.current = true
    setStep(4)
  }

  const requestClose = () => {
    if (closeNotifiedRef.current) {
      return
    }

    closeNotifiedRef.current = true
    resetState()
    if (dialogRef.current?.open) {
      dialogRef.current.close()
    }
    onClose()
  }

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (step === 1 || step === 2) {
      advance()
      return
    }
    if (step === 3) {
      completeDemo()
      return
    }
    requestClose()
  }

  const chooseMode = (nextMode: FulfillmentMode) => {
    setMode(nextMode)
    setPickupNotice('')
    clearErrors('mode')
    if (nextMode === 'pickup') {
      clearErrors('address', 'street', 'number', 'neighborhood')
    }
  }

  const choosePickupFromOutsideArea = () => {
    setMode('pickup')
    setAddress({ ...emptyAddress })
    setPickupNotice('Retirada selecionada. Você pode continuar sem endereço.')
    clearErrors('address', 'street', 'number', 'neighborhood')
  }

  const errorEntries = Object.entries(errors)
  const reviewSchedule =
    schedule.kind === 'scheduled' ? schedule.value : 'Mais rápido'

  useEffect(() => {
    if (!open || !dialogRef.current?.open) {
      return
    }

    if (
      errorEntries.length > 0 &&
      validationAttemptRef.current !== focusedValidationAttemptRef.current
    ) {
      focusedValidationAttemptRef.current = validationAttemptRef.current
      errorSummaryRef.current?.focus()
      return
    }

    if (previousStepRef.current !== step) {
      stepHeadingRef.current?.focus()
      previousStepRef.current = step
    }
  }, [errors, open, step])

  return (
    <dialog
      ref={dialogRef}
      className="checkout-dialog"
      aria-labelledby="checkout-demo-title"
      onCancel={(event) => {
        event.preventDefault()
        requestClose()
      }}
    >
      <form className="checkout-panel" autoComplete="off" onSubmit={handleSubmit}>
        <header className="checkout-header">
          <div>
            <span className="flow-kicker">Pedido demonstrativo</span>
            <h2 id="checkout-demo-title">Checkout demonstrativo</h2>
          </div>
          <button
            ref={closeButtonRef}
            className="checkout-close"
            type="button"
            aria-label="Fechar checkout"
            onClick={requestClose}
          >
            <span aria-hidden="true">×</span>
          </button>
        </header>

        <div className="checkout-stepper" aria-live="polite">
          {step < 4 ? (
            <>
              <span>Etapa {step} de 3</span>
              <strong>
                {step === 1
                  ? 'Modalidade'
                  : step === 2
                    ? 'Dados'
                    : 'Revisão'}
              </strong>
            </>
          ) : (
            <strong>Simulação concluída</strong>
          )}
        </div>

        <div className="checkout-content">
          {errorEntries.length > 0 ? (
            <div
              ref={errorSummaryRef}
              className="flow-error-summary"
              role="alert"
              tabIndex={-1}
            >
              <strong>Revise os campos destacados antes de continuar.</strong>
              <ul>
                {errorEntries.map(([field, message]) => (
                  <li key={field}>{message}</li>
                ))}
              </ul>
            </div>
          ) : null}

          {step === 1 ? (
            <section className="checkout-step" aria-labelledby="checkout-step-one-title">
              <div className="checkout-step-heading">
                <span>01</span>
                <div>
                  <h3
                    ref={stepHeadingRef}
                    id="checkout-step-one-title"
                    tabIndex={-1}
                  >
                    Modalidade e horário
                  </h3>
                  <p>Escolha como e quando deseja receber a simulação.</p>
                </div>
              </div>

              <fieldset
                className="flow-choice-fieldset"
                aria-describedby={errors.mode ? 'checkout-mode-error' : undefined}
              >
                <legend>Modalidade</legend>
                <div className="flow-choice-grid">
                  <label className="flow-choice-card">
                    <input
                      type="radio"
                      name="checkout-mode"
                      value="delivery"
                      aria-label="Entrega"
                      checked={mode === 'delivery'}
                      onChange={() => chooseMode('delivery')}
                    />
                    <span>Entrega</span>
                    <small>Nos bairros atendidos</small>
                  </label>
                  <label className="flow-choice-card">
                    <input
                      type="radio"
                      name="checkout-mode"
                      value="pickup"
                      aria-label="Retirada"
                      checked={mode === 'pickup'}
                      onChange={() => chooseMode('pickup')}
                    />
                    <span>Retirada</span>
                    <small>Na unidade Savassi</small>
                  </label>
                </div>
                <ErrorMessage id="checkout-mode-error" message={errors.mode} />
              </fieldset>

              <fieldset className="flow-choice-fieldset">
                <legend>Horário</legend>
                <div className="flow-choice-grid">
                  <label className="flow-choice-card">
                    <input
                      type="radio"
                      name="checkout-schedule-kind"
                      value="asap"
                      aria-label="Mais rápido"
                      checked={schedule.kind === 'asap'}
                      onChange={() => {
                        setSchedule({ kind: 'asap' })
                        clearErrors('schedule')
                      }}
                    />
                    <span>Mais rápido</span>
                    <small>Assim que estiver pronto</small>
                  </label>
                  <label className="flow-choice-card">
                    <input
                      type="radio"
                      name="checkout-schedule-kind"
                      value="scheduled"
                      aria-label="Agendar"
                      checked={schedule.kind === 'scheduled'}
                      onChange={() => {
                        setSchedule({ kind: 'scheduled', value: '' })
                        clearErrors('schedule')
                      }}
                    />
                    <span>Agendar</span>
                    <small>Entre 18:30 e 21:00</small>
                  </label>
                </div>
              </fieldset>

              {schedule.kind === 'scheduled' ? (
                <div className="flow-field">
                  <label htmlFor="checkout-schedule-time">Horário agendado</label>
                  <select
                    id="checkout-schedule-time"
                    value={schedule.value}
                    aria-invalid={Boolean(errors.schedule)}
                    aria-describedby={
                      errors.schedule ? 'checkout-schedule-error' : undefined
                    }
                    onChange={(event) => {
                      setSchedule({
                        kind: 'scheduled',
                        value: event.currentTarget.value,
                      })
                      clearErrors('schedule')
                    }}
                  >
                    <option value="">Selecione um horário</option>
                    {scheduleTimes.map((time) => (
                      <option key={time} value={time}>
                        {time}
                      </option>
                    ))}
                  </select>
                  <ErrorMessage
                    id="checkout-schedule-error"
                    message={errors.schedule}
                  />
                </div>
              ) : null}
            </section>
          ) : null}

          {step === 2 ? (
            <section className="checkout-step" aria-labelledby="checkout-step-two-title">
              <div className="checkout-step-heading">
                <span>02</span>
                <div>
                  <h3
                    ref={stepHeadingRef}
                    id="checkout-step-two-title"
                    tabIndex={-1}
                  >
                    Seus dados
                  </h3>
                  <p>Usados apenas nesta simulação e descartados ao fechar.</p>
                </div>
              </div>

              {pickupNotice ? (
                <p className="flow-status" role="status">
                  {pickupNotice}
                </p>
              ) : null}

              <div className="flow-field-grid">
                <div className="flow-field">
                  <label htmlFor="checkout-name">Nome</label>
                  <input
                    id="checkout-name"
                    type="text"
                    value={contact.name}
                    autoComplete="off"
                    aria-invalid={Boolean(errors.name)}
                    aria-describedby={errors.name ? 'checkout-name-error' : undefined}
                    onChange={(event) => {
                      const value = event.currentTarget.value
                      setContact((current) => ({
                        ...current,
                        name: value,
                      }))
                      clearErrors('name')
                    }}
                  />
                  <ErrorMessage id="checkout-name-error" message={errors.name} />
                </div>

                <div className="flow-field">
                  <label htmlFor="checkout-phone">Telefone</label>
                  <input
                    id="checkout-phone"
                    type="tel"
                    inputMode="tel"
                    value={contact.phone}
                    autoComplete="off"
                    placeholder="(31) 99999-9999"
                    aria-invalid={Boolean(errors.phone)}
                    aria-describedby={errors.phone ? 'checkout-phone-error' : undefined}
                    onChange={(event) => {
                      const value = event.currentTarget.value
                      setContact((current) => ({
                        ...current,
                        phone: value,
                      }))
                      clearErrors('phone')
                    }}
                  />
                  <ErrorMessage id="checkout-phone-error" message={errors.phone} />
                </div>
              </div>

              {mode === 'delivery' ? (
                <fieldset className="checkout-address">
                  <legend>Endereço de entrega</legend>
                  <div className="flow-field-grid">
                    <div className="flow-field flow-field-wide">
                      <label htmlFor="checkout-street">Rua ou avenida</label>
                      <input
                        id="checkout-street"
                        type="text"
                        value={address.street}
                        autoComplete="off"
                        aria-invalid={Boolean(errors.street)}
                        aria-describedby={
                          errors.street ? 'checkout-street-error' : undefined
                        }
                        onChange={(event) => {
                          const value = event.currentTarget.value
                          setAddress((current) => ({
                            ...current,
                            street: value,
                          }))
                          clearErrors('address', 'street')
                        }}
                      />
                      <ErrorMessage
                        id="checkout-street-error"
                        message={errors.street}
                      />
                    </div>

                    <div className="flow-field">
                      <label htmlFor="checkout-number">Número</label>
                      <input
                        id="checkout-number"
                        type="text"
                        value={address.number}
                        autoComplete="off"
                        inputMode="numeric"
                        aria-invalid={Boolean(errors.number)}
                        aria-describedby={
                          errors.number ? 'checkout-number-error' : undefined
                        }
                        onChange={(event) => {
                          const value = event.currentTarget.value
                          setAddress((current) => ({
                            ...current,
                            number: value,
                          }))
                          clearErrors('address', 'number')
                        }}
                      />
                      <ErrorMessage
                        id="checkout-number-error"
                        message={errors.number}
                      />
                    </div>

                    <div className="flow-field">
                      <label htmlFor="checkout-complement">Complemento</label>
                      <input
                        id="checkout-complement"
                        type="text"
                        value={address.complement ?? ''}
                        autoComplete="off"
                        onChange={(event) => {
                          const value = event.currentTarget.value
                          setAddress((current) => ({
                            ...current,
                            complement: value,
                          }))
                        }}
                      />
                    </div>

                    <div className="flow-field flow-field-wide">
                      <label htmlFor="checkout-neighborhood">Bairro</label>
                      <select
                        id="checkout-neighborhood"
                        value={address.neighborhood}
                        aria-invalid={Boolean(errors.neighborhood)}
                        aria-describedby={
                          errors.neighborhood
                            ? 'checkout-neighborhood-error'
                            : undefined
                        }
                        onChange={(event) => {
                          const value = event.currentTarget.value
                          setAddress((current) => ({
                            ...current,
                            neighborhood: value,
                          }))
                          clearErrors('address', 'neighborhood')
                        }}
                      >
                        <option value="">Selecione um bairro</option>
                        {restaurant.deliveryNeighborhoods.map((neighborhood) => (
                          <option key={neighborhood} value={neighborhood}>
                            {neighborhood}
                          </option>
                        ))}
                        <option value="Outro bairro">Outro bairro</option>
                      </select>
                      <ErrorMessage
                        id="checkout-neighborhood-error"
                        message={errors.neighborhood}
                      />
                    </div>
                  </div>

                  {address.neighborhood === 'Outro bairro' ? (
                    <div className="checkout-outside-area">
                      <p role="status">
                        Este bairro está fora da área de entrega demonstrativa.
                      </p>
                      <button type="button" onClick={choosePickupFromOutsideArea}>
                        Escolher retirada
                      </button>
                    </div>
                  ) : null}
                </fieldset>
              ) : null}

              <fieldset
                className="flow-choice-fieldset checkout-payment"
                aria-describedby={
                  errors.payment ? 'checkout-payment-error' : undefined
                }
              >
                <legend>Pagamento</legend>
                <p className="flow-field-hint">
                  Apenas uma escolha. Não solicitamos cartão, chave ou documento.
                </p>
                <div className="flow-choice-list">
                  {(Object.entries(paymentLabels) as [PaymentMethod, string][]).map(
                    ([value, label]) => (
                      <label className="flow-choice-row" key={value}>
                        <input
                          type="radio"
                          name="checkout-payment"
                          value={value}
                          checked={payment === value}
                          onChange={() => {
                            setPayment(value)
                            clearErrors('payment')
                          }}
                        />
                        <span>{label}</span>
                      </label>
                    ),
                  )}
                </div>
                <ErrorMessage
                  id="checkout-payment-error"
                  message={errors.payment}
                />
              </fieldset>

              <div className="flow-field checkout-notes">
                <div className="flow-label-row">
                  <label htmlFor="checkout-notes">Observação opcional</label>
                  <span>{notes.length}/400</span>
                </div>
                <textarea
                  id="checkout-notes"
                  value={notes}
                  maxLength={400}
                  rows={4}
                  aria-invalid={Boolean(errors.notes)}
                  aria-describedby={errors.notes ? 'checkout-notes-error' : undefined}
                  onChange={(event) => {
                    setNotes(event.currentTarget.value)
                    clearErrors('notes')
                  }}
                />
                <ErrorMessage id="checkout-notes-error" message={errors.notes} />
              </div>
            </section>
          ) : null}

          {step === 3 ? (
            <section
              className="checkout-step checkout-review"
              aria-labelledby="checkout-step-three-title"
            >
              <div className="checkout-step-heading">
                <span>03</span>
                <div>
                  <h3
                    ref={stepHeadingRef}
                    id="checkout-step-three-title"
                    tabIndex={-1}
                  >
                    Revise seu pedido
                  </h3>
                  <p>Confira a simulação antes da confirmação final.</p>
                </div>
              </div>

              <div className="checkout-review-section">
                <div className="checkout-review-title-row">
                  <h4>Itens</h4>
                  <button type="button" onClick={() => setStep(2)}>
                    Editar dados
                  </button>
                </div>
                <ul className="checkout-review-lines">
                  {reviewLines.map(({ line, item, options, unitPrice }) => (
                    <li key={line.key}>
                      <div>
                        <strong>{item.name}</strong>
                        <span>
                          {options.length > 0
                            ? options.map(({ label }) => label).join(', ')
                            : 'Sem adicionais'}
                        </span>
                        <small>
                          {line.quantity} × {currencyFormatter.format(unitPrice)}
                        </small>
                      </div>
                      <strong>
                        {currencyFormatter.format(unitPrice * line.quantity)}
                      </strong>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="checkout-review-section">
                <h4>Entrega e pagamento</h4>
                <dl className="checkout-review-details">
                  <div>
                    <dt>Modalidade</dt>
                    <dd>{modeLabel(mode)}</dd>
                  </div>
                  <div>
                    <dt>Horário</dt>
                    <dd>{reviewSchedule}</dd>
                  </div>
                  <div>
                    <dt>Pagamento</dt>
                    <dd>{payment ? paymentLabels[payment] : 'Não definido'}</dd>
                  </div>
                  {mode === 'delivery' ? (
                    <div>
                      <dt>Endereço</dt>
                      <dd>
                        {address.street}, {address.number}
                        {address.complement ? ` · ${address.complement}` : ''} ·{' '}
                        {address.neighborhood}
                      </dd>
                    </div>
                  ) : null}
                </dl>
              </div>

              <dl className="checkout-totals">
                <div>
                  <dt>Subtotal</dt>
                  <dd>{currencyFormatter.format(total)}</dd>
                </div>
                <div>
                  <dt>Taxa demonstrativa</dt>
                  <dd>{currencyFormatter.format(0)}</dd>
                </div>
                <div className="checkout-total-final">
                  <dt>Total</dt>
                  <dd>{currencyFormatter.format(total)}</dd>
                </div>
              </dl>
            </section>
          ) : null}

          {step === 4 ? (
            <section
              className="checkout-step checkout-confirmation"
              aria-labelledby="checkout-confirmation-title"
            >
              <span className="flow-kicker">Código demonstrativo</span>
              <p className="checkout-order-code">{orderCode}</p>
              <h3
                ref={stepHeadingRef}
                id="checkout-confirmation-title"
                tabIndex={-1}
              >
                Nenhum pedido foi realizado
              </h3>
              <p>
                Esta confirmação existe apenas para demonstrar a experiência do
                checkout.
              </p>
              <dl className="checkout-confirmation-summary">
                <div>
                  <dt>Modalidade</dt>
                  <dd>{modeLabel(mode)}</dd>
                </div>
                <div>
                  <dt>Total simulado</dt>
                  <dd>{currencyFormatter.format(confirmedTotal ?? total)}</dd>
                </div>
              </dl>
            </section>
          ) : null}
        </div>

        <footer className="checkout-footer">
          {step === 1 ? (
            <button className="flow-primary-action" type="submit">
              Avançar
            </button>
          ) : null}

          {step === 2 ? (
            <>
              <button
                className="flow-secondary-action"
                type="button"
                onClick={() => {
                  setErrors({})
                  setStep(1)
                }}
              >
                Voltar
              </button>
              <button className="flow-primary-action" type="submit">
                Avançar
              </button>
            </>
          ) : null}

          {step === 3 ? (
            <>
              <button
                className="flow-secondary-action"
                type="button"
                onClick={() => setStep(2)}
              >
                Voltar
              </button>
              <div className="checkout-confirm-action">
                <DemoNotice className="demo-notice-checkout" />
                <button className="flow-primary-action" type="submit">
                  Confirmar pedido simulado
                </button>
              </div>
            </>
          ) : null}

          {step === 4 ? (
            <button className="flow-primary-action" type="submit">
              Voltar ao cardápio
            </button>
          ) : null}
        </footer>
      </form>
    </dialog>
  )
}
