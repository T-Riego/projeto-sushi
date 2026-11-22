import { afterEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { ReservationDemo } from './ReservationDemo'

type RenderReservationOptions = {
  open?: boolean
  onClose?: () => void
  todayIso?: string
}

function renderReservation({
  open = true,
  onClose = vi.fn(),
  todayIso = '2026-11-22',
}: RenderReservationOptions = {}) {
  const view = render(
    <ReservationDemo
      open={open}
      onClose={onClose}
      todayIso={todayIso}
    />,
  )

  return {
    ...view,
    rerenderReservation(nextOpen: boolean) {
      view.rerender(
        <ReservationDemo
          open={nextOpen}
          onClose={onClose}
          todayIso={todayIso}
        />,
      )
    },
  }
}

async function completeValidForm(user: ReturnType<typeof userEvent.setup>) {
  const dialog = screen.getByRole('dialog', { name: 'Reserva demonstrativa' })

  await user.type(
    within(dialog).getByRole('spinbutton', { name: 'Pessoas' }),
    '2',
  )
  fireEvent.change(within(dialog).getByLabelText('Data'), {
    target: { value: '2026-11-24' },
  })
  await user.selectOptions(
    within(dialog).getByRole('combobox', { name: 'Horário' }),
    '19:30',
  )
  await user.type(within(dialog).getByRole('textbox', { name: 'Nome' }), 'Ana Lima')
  await user.type(
    within(dialog).getByRole('textbox', { name: 'Telefone' }),
    '(31) 99999-1234',
  )
}

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  document.body.style.overflow = ''
})

describe('ReservationDemo', () => {
  it('revisa e confirma uma reserva válida sem rede ou persistência', async () => {
    const user = userEvent.setup()
    const fetchSpy = vi.fn()
    const storageSpy = vi.spyOn(Storage.prototype, 'setItem')
    vi.stubGlobal('fetch', fetchSpy)
    renderReservation()

    await completeValidForm(user)
    await user.type(
      screen.getByRole('textbox', { name: 'Ocasião opcional' }),
      'Aniversário',
    )
    await user.type(
      screen.getByRole('textbox', { name: 'Restrições alimentares opcionais' }),
      'Sem lactose',
    )
    await user.click(screen.getByRole('button', { name: 'Avançar' }))

    expect(
      screen.getByRole('heading', { name: 'Revise sua reserva' }),
    ).toHaveFocus()
    expect(screen.getByText('Ana Lima')).toBeInTheDocument()
    expect(screen.getByText('(31) 99999-1234')).toBeInTheDocument()
    expect(screen.getByText('Aniversário')).toBeInTheDocument()
    expect(screen.getByText('Sem lactose')).toBeInTheDocument()

    const confirmButton = screen.getByRole('button', {
      name: 'Confirmar reserva simulada',
    })
    expect(confirmButton.previousElementSibling).toHaveAttribute('role', 'note')
    await user.click(confirmButton)

    expect(screen.getByText('Nenhuma reserva foi enviada')).toBeInTheDocument()
    expect(screen.getByText(/^AYO-RES-\d{4}$/)).toBeInTheDocument()
    expect(screen.getByText('2 pessoas')).toBeInTheDocument()
    expect(screen.getByText('24/11/2026')).toBeInTheDocument()
    expect(screen.getByText('19:30')).toBeInTheDocument()
    expect(screen.queryByText('Ana Lima')).not.toBeInTheDocument()
    expect(screen.queryByText('(31) 99999-1234')).not.toBeInTheDocument()
    expect(screen.queryByText('Aniversário')).not.toBeInTheDocument()
    expect(screen.queryByText('Sem lactose')).not.toBeInTheDocument()
    expect(fetchSpy).not.toHaveBeenCalled()
    expect(storageSpy).not.toHaveBeenCalled()
  })

  it('valida pessoas, data, horário e contato e foca o resumo', async () => {
    const user = userEvent.setup()
    renderReservation()

    const partySize = screen.getByRole('spinbutton', { name: 'Pessoas' })
    await user.clear(partySize)
    await user.type(partySize, '9')
    fireEvent.change(screen.getByLabelText('Data'), {
      target: { value: '2026-12-23' },
    })
    await user.type(screen.getByRole('textbox', { name: 'Nome' }), 'A')
    await user.type(screen.getByRole('textbox', { name: 'Telefone' }), '31999')
    await user.click(screen.getByRole('button', { name: 'Avançar' }))

    const alert = screen.getByRole('alert')
    expect(alert).toHaveFocus()
    expect(alert).toHaveTextContent(/1 a 8 pessoas/i)
    expect(alert).toHaveTextContent(/próximos 30 dias/i)
    expect(alert).toHaveTextContent(/horário/i)
    expect(alert).toHaveTextContent(/nome/i)
    expect(alert).toHaveTextContent(/telefone/i)
    expect(partySize).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByLabelText('Data')).toHaveAttribute('aria-invalid', 'true')
  })

  it('informa que segunda-feira está fechada e não oferece horários', async () => {
    const user = userEvent.setup()
    renderReservation()

    fireEvent.change(screen.getByLabelText('Data'), {
      target: { value: '2026-11-23' },
    })

    expect(screen.getByRole('status')).toHaveTextContent(
      'Fechamos às segundas-feiras. Escolha outra data.',
    )
    expect(screen.getByRole('combobox', { name: 'Horário' })).toBeDisabled()
    await user.click(screen.getByRole('button', { name: 'Avançar' }))
    expect(screen.getByRole('alert')).toHaveTextContent(/horário/i)
  })

  it('permite voltar da revisão e editar os dados preservados', async () => {
    const user = userEvent.setup()
    renderReservation()

    await completeValidForm(user)
    await user.click(screen.getByRole('button', { name: 'Avançar' }))
    await user.click(screen.getByRole('button', { name: 'Editar dados' }))

    expect(
      screen.getByRole('heading', { name: 'Escolha seu momento' }),
    ).toHaveFocus()
    expect(screen.getByRole('textbox', { name: 'Nome' })).toHaveValue('Ana Lima')
    expect(screen.getByRole('textbox', { name: 'Telefone' })).toHaveValue(
      '(31) 99999-1234',
    )
  })

  it('fecha uma única vez com Escape repetido', () => {
    const onClose = vi.fn()
    renderReservation({ onClose })
    const dialog = screen.getByRole('dialog', { name: 'Reserva demonstrativa' })

    fireEvent(dialog, new Event('cancel', { cancelable: true }))
    fireEvent(dialog, new Event('cancel', { cancelable: true }))

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('foca o fechamento, bloqueia rolagem e reabre sem dados pessoais', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    const view = renderReservation({ onClose })

    expect(screen.getByRole('button', { name: 'Fechar reserva' })).toHaveFocus()
    expect(document.body.style.overflow).toBe('hidden')
    await user.type(screen.getByRole('textbox', { name: 'Nome' }), 'Ana Lima')
    await user.type(
      screen.getByRole('textbox', { name: 'Telefone' }),
      '(31) 99999-1234',
    )
    await user.click(screen.getByRole('button', { name: 'Fechar reserva' }))

    expect(onClose).toHaveBeenCalledTimes(1)
    expect(document.body.style.overflow).toBe('')
    view.rerenderReservation(false)
    expect(document.body.style.overflow).toBe('')
    view.rerenderReservation(true)

    expect(screen.getByRole('textbox', { name: 'Nome' })).toHaveValue('')
    expect(screen.getByRole('textbox', { name: 'Telefone' })).toHaveValue('')
    expect(screen.getByRole('spinbutton', { name: 'Pessoas' })).toHaveValue(null)
    expect(screen.getByLabelText('Data')).toHaveValue('')
    expect(screen.getByRole('combobox', { name: 'Horário' })).toHaveValue('')
  })
})
