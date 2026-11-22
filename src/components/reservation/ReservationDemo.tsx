import { useEffect, useMemo, useRef, useState } from 'react'

import { restaurant } from '../../data/restaurant'
import {
  createDemoReservationCode,
  getReservationDateBounds,
  getReservationTimes,
  sanitizeReservationAfterConfirmation,
  validateReservation,
} from '../../lib/flowValidation'
import type { FieldErrors, ReservationDraft } from '../../types/flows'
import { DemoNotice } from '../site/DemoNotice'

export type ReservationDemoProps = {
  open: boolean
  onClose: () => void
  todayIso?: string
}

type ReservationStep = 'form' | 'review' | 'confirmation'

const emptyReservation: ReservationDraft = {
  partySize: 0,
  date: '',
  time: '',
  name: '',
  phone: '',
  occasion: '',
  dietaryNotes: '',
}

function currentRestaurantDate(): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: restaurant.timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date())
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]))

  return `${values.year}-${values.month}-${values.day}`
}

function formatReservationDate(dateIso: string): string {
  const [year, month, day] = dateIso.split('-')
  return `${day}/${month}/${year}`
}

function ErrorMessage({ id, message }: { id: string; message?: string }) {
  return message ? (
    <p className="flow-field-error" id={id}>
      {message}
    </p>
  ) : null
}

export function ReservationDemo({
  open,
  onClose,
  todayIso = currentRestaurantDate(),
}: ReservationDemoProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const stepHeadingRef = useRef<HTMLHeadingElement>(null)
  const errorSummaryRef = useRef<HTMLDivElement>(null)
  const closeNotifiedRef = useRef(false)
  const confirmationHandledRef = useRef(false)
  const validationAttemptRef = useRef(0)
  const focusedValidationAttemptRef = useRef(0)
  const previousStepRef = useRef<ReservationStep>('form')
  const previousBodyOverflowRef = useRef<string | null>(null)

  const [step, setStep] = useState<ReservationStep>('form')
  const [draft, setDraft] = useState<ReservationDraft>(() => ({
    ...emptyReservation,
  }))
  const [errors, setErrors] = useState<FieldErrors>({})
  const [reservationCode, setReservationCode] = useState('')

  const dateBounds = useMemo(
    () => getReservationDateBounds(todayIso),
    [todayIso],
  )
  const availableTimes = useMemo(
    () => getReservationTimes(draft.date),
    [draft.date],
  )
  const isClosedMonday =
    draft.date.length > 0 && availableTimes.length === 0

  const resetState = () => {
    validationAttemptRef.current = 0
    focusedValidationAttemptRef.current = 0
    previousStepRef.current = 'form'
    confirmationHandledRef.current = false
    setStep('form')
    setDraft({ ...emptyReservation })
    setErrors({})
    setReservationCode('')
  }

  const restoreBodyScroll = () => {
    if (previousBodyOverflowRef.current === null) {
      return
    }

    document.body.style.overflow = previousBodyOverflowRef.current
    previousBodyOverflowRef.current = null
  }

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) {
      return
    }

    if (!open) {
      if (dialog.open) {
        dialog.close()
      }
      restoreBodyScroll()
      resetState()
      return
    }

    closeNotifiedRef.current = false
    resetState()
    if (!dialog.open) {
      dialog.showModal()
    }
    closeButtonRef.current?.focus()

    previousBodyOverflowRef.current = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return restoreBodyScroll
  }, [open])

  const clearError = (...fields: string[]) => {
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

  const updateDraft = <Field extends keyof ReservationDraft>(
    field: Field,
    value: ReservationDraft[Field],
  ) => {
    setDraft((current) => ({ ...current, [field]: value }))
    clearError(field)
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
    restoreBodyScroll()
    onClose()
  }

  const advanceToReview = () => {
    const nextErrors = validateReservation(draft, todayIso)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) {
      validationAttemptRef.current += 1
      return
    }

    setStep('review')
  }

  const confirmReservation = () => {
    if (confirmationHandledRef.current) {
      return
    }

    confirmationHandledRef.current = true
    setDraft(sanitizeReservationAfterConfirmation(draft))
    setErrors({})
    setReservationCode(createDemoReservationCode())
    setStep('confirmation')
  }

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (step === 'form') {
      advanceToReview()
      return
    }
    if (step === 'review') {
      confirmReservation()
      return
    }
    requestClose()
  }

  const errorEntries = Object.entries(errors)

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
      className="flow-reservation-dialog"
      aria-labelledby="reservation-demo-title"
      onCancel={(event) => {
        event.preventDefault()
        requestClose()
      }}
    >
      <form
        className="flow-reservation-panel"
        autoComplete="off"
        noValidate
        onSubmit={handleSubmit}
      >
        <header className="flow-reservation-header">
          <div>
            <span className="flow-kicker">Mesa demonstrativa</span>
            <h2 id="reservation-demo-title">Reserva demonstrativa</h2>
          </div>
          <button
            ref={closeButtonRef}
            className="flow-reservation-close"
            type="button"
            aria-label="Fechar reserva"
            onClick={requestClose}
          >
            <span aria-hidden="true">×</span>
          </button>
        </header>

        <div className="flow-reservation-stepper" aria-live="polite">
          {step === 'confirmation' ? (
            <strong>Simulação concluída</strong>
          ) : (
            <>
              <span>Etapa {step === 'form' ? '1' : '2'} de 2</span>
              <strong>{step === 'form' ? 'Dados da mesa' : 'Revisão'}</strong>
            </>
          )}
        </div>

        <div className="flow-reservation-content">
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

          {step === 'form' ? (
            <section
              className="flow-reservation-step"
              aria-labelledby="reservation-form-title"
            >
              <div className="flow-reservation-step-heading">
                <span>01</span>
                <div>
                  <h3
                    ref={stepHeadingRef}
                    id="reservation-form-title"
                    tabIndex={-1}
                  >
                    Escolha seu momento
                  </h3>
                  <p>
                    Selecione a mesa e deixe os dados usados apenas nesta
                    simulação.
                  </p>
                </div>
              </div>

              <div className="flow-field-grid">
                <div className="flow-field">
                  <label htmlFor="reservation-party-size">Pessoas</label>
                  <input
                    id="reservation-party-size"
                    type="number"
                    min="1"
                    max={restaurant.maxPartySize}
                    step="1"
                    value={draft.partySize || ''}
                    aria-invalid={Boolean(errors.partySize)}
                    aria-describedby={
                      errors.partySize
                        ? 'reservation-party-size-error'
                        : undefined
                    }
                    onChange={(event) =>
                      updateDraft(
                        'partySize',
                        Number(event.currentTarget.value),
                      )
                    }
                  />
                  <ErrorMessage
                    id="reservation-party-size-error"
                    message={errors.partySize}
                  />
                </div>

                <div className="flow-field">
                  <label htmlFor="reservation-date">Data</label>
                  <input
                    id="reservation-date"
                    type="date"
                    min={dateBounds.min}
                    max={dateBounds.max}
                    value={draft.date}
                    aria-invalid={Boolean(errors.date)}
                    aria-describedby={
                      errors.date ? 'reservation-date-error' : undefined
                    }
                    onChange={(event) => {
                      const value = event.currentTarget.value
                      setDraft((current) => ({
                        ...current,
                        date: value,
                        time: '',
                      }))
                      clearError('date', 'time')
                    }}
                  />
                  <ErrorMessage
                    id="reservation-date-error"
                    message={errors.date}
                  />
                </div>

                <div className="flow-field flow-field-wide">
                  <label htmlFor="reservation-time">Horário</label>
                  <select
                    id="reservation-time"
                    value={draft.time}
                    disabled={!draft.date || availableTimes.length === 0}
                    aria-invalid={Boolean(errors.time)}
                    aria-describedby={
                      errors.time ? 'reservation-time-error' : undefined
                    }
                    onChange={(event) =>
                      updateDraft('time', event.currentTarget.value)
                    }
                  >
                    <option value="">Selecione um horário</option>
                    {availableTimes.map((time) => (
                      <option key={time} value={time}>
                        {time}
                      </option>
                    ))}
                  </select>
                  {isClosedMonday ? (
                    <p className="flow-status" role="status">
                      Fechamos às segundas-feiras. Escolha outra data.
                    </p>
                  ) : null}
                  <ErrorMessage
                    id="reservation-time-error"
                    message={errors.time}
                  />
                </div>

                <div className="flow-field">
                  <label htmlFor="reservation-name">Nome</label>
                  <input
                    id="reservation-name"
                    type="text"
                    value={draft.name}
                    autoComplete="off"
                    aria-invalid={Boolean(errors.name)}
                    aria-describedby={
                      errors.name ? 'reservation-name-error' : undefined
                    }
                    onChange={(event) =>
                      updateDraft('name', event.currentTarget.value)
                    }
                  />
                  <ErrorMessage
                    id="reservation-name-error"
                    message={errors.name}
                  />
                </div>

                <div className="flow-field">
                  <label htmlFor="reservation-phone">Telefone</label>
                  <input
                    id="reservation-phone"
                    type="tel"
                    inputMode="tel"
                    value={draft.phone}
                    autoComplete="off"
                    placeholder="(31) 99999-9999"
                    aria-invalid={Boolean(errors.phone)}
                    aria-describedby={
                      errors.phone ? 'reservation-phone-error' : undefined
                    }
                    onChange={(event) =>
                      updateDraft('phone', event.currentTarget.value)
                    }
                  />
                  <ErrorMessage
                    id="reservation-phone-error"
                    message={errors.phone}
                  />
                </div>

                <div className="flow-field flow-field-wide">
                  <div className="flow-label-row">
                    <label htmlFor="reservation-occasion">Ocasião opcional</label>
                    <span>{draft.occasion?.length ?? 0}/100</span>
                  </div>
                  <input
                    id="reservation-occasion"
                    type="text"
                    maxLength={100}
                    value={draft.occasion ?? ''}
                    autoComplete="off"
                    aria-invalid={Boolean(errors.occasion)}
                    aria-describedby={
                      errors.occasion ? 'reservation-occasion-error' : undefined
                    }
                    onChange={(event) =>
                      updateDraft('occasion', event.currentTarget.value)
                    }
                  />
                  <ErrorMessage
                    id="reservation-occasion-error"
                    message={errors.occasion}
                  />
                </div>

                <div className="flow-field flow-field-wide">
                  <div className="flow-label-row">
                    <label htmlFor="reservation-dietary-notes">
                      Restrições alimentares opcionais
                    </label>
                    <span>{draft.dietaryNotes?.length ?? 0}/400</span>
                  </div>
                  <textarea
                    id="reservation-dietary-notes"
                    maxLength={400}
                    value={draft.dietaryNotes ?? ''}
                    autoComplete="off"
                    aria-invalid={Boolean(errors.dietaryNotes)}
                    aria-describedby={
                      errors.dietaryNotes
                        ? 'reservation-dietary-notes-error'
                        : undefined
                    }
                    onChange={(event) =>
                      updateDraft('dietaryNotes', event.currentTarget.value)
                    }
                  />
                  <ErrorMessage
                    id="reservation-dietary-notes-error"
                    message={errors.dietaryNotes}
                  />
                </div>
              </div>
            </section>
          ) : null}

          {step === 'review' ? (
            <section
              className="flow-reservation-step flow-reservation-review"
              aria-labelledby="reservation-review-title"
            >
              <div className="flow-reservation-step-heading">
                <span>02</span>
                <div>
                  <h3
                    ref={stepHeadingRef}
                    id="reservation-review-title"
                    tabIndex={-1}
                  >
                    Revise sua reserva
                  </h3>
                  <p>Confira os dados antes de concluir a simulação.</p>
                </div>
              </div>

              <dl className="flow-reservation-review-details">
                <div>
                  <dt>Pessoas</dt>
                  <dd>{draft.partySize}</dd>
                </div>
                <div>
                  <dt>Data</dt>
                  <dd>{formatReservationDate(draft.date)}</dd>
                </div>
                <div>
                  <dt>Horário</dt>
                  <dd>{draft.time}</dd>
                </div>
                <div>
                  <dt>Nome</dt>
                  <dd>{draft.name}</dd>
                </div>
                <div>
                  <dt>Telefone</dt>
                  <dd>{draft.phone}</dd>
                </div>
                {draft.occasion ? (
                  <div>
                    <dt>Ocasião</dt>
                    <dd>{draft.occasion}</dd>
                  </div>
                ) : null}
                {draft.dietaryNotes ? (
                  <div>
                    <dt>Restrições</dt>
                    <dd>{draft.dietaryNotes}</dd>
                  </div>
                ) : null}
              </dl>

              <div className="flow-reservation-confirm-action">
                <DemoNotice className="flow-reservation-demo-notice" />
                <button className="flow-primary-action" type="submit">
                  Confirmar reserva simulada
                </button>
              </div>
            </section>
          ) : null}

          {step === 'confirmation' ? (
            <section
              className="flow-reservation-step flow-reservation-confirmation"
              aria-labelledby="reservation-confirmation-title"
            >
              <p className="flow-reservation-code">{reservationCode}</p>
              <h3
                ref={stepHeadingRef}
                id="reservation-confirmation-title"
                tabIndex={-1}
              >
                Simulação de reserva concluída
              </h3>
              <p>Nenhuma reserva foi enviada</p>
              <dl className="flow-reservation-confirmation-summary">
                <div>
                  <dt>Pessoas</dt>
                  <dd>
                    {draft.partySize}{' '}
                    {draft.partySize === 1 ? 'pessoa' : 'pessoas'}
                  </dd>
                </div>
                <div>
                  <dt>Data</dt>
                  <dd>{formatReservationDate(draft.date)}</dd>
                </div>
                <div>
                  <dt>Horário</dt>
                  <dd>{draft.time}</dd>
                </div>
              </dl>
            </section>
          ) : null}
        </div>

        <footer className="flow-reservation-footer">
          {step === 'form' ? (
            <button className="flow-primary-action" type="submit">
              Avançar
            </button>
          ) : null}
          {step === 'review' ? (
            <button
              className="flow-secondary-action"
              type="button"
              onClick={() => {
                setErrors({})
                setStep('form')
              }}
            >
              Editar dados
            </button>
          ) : null}
          {step === 'confirmation' ? (
            <button className="flow-primary-action" type="submit">
              Fechar
            </button>
          ) : null}
        </footer>
      </form>
    </dialog>
  )
}
