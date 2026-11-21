import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useToast } from './useToast'

describe('useToast', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('exibe uma mensagem e a limpa depois de 3000 ms', () => {
    const { result } = renderHook(() => useToast())

    expect(result.current.message).toBeNull()

    act(() => result.current.notify('Item adicionado'))
    expect(result.current.message).toBe('Item adicionado')

    act(() => vi.advanceTimersByTime(2999))
    expect(result.current.message).toBe('Item adicionado')

    act(() => vi.advanceTimersByTime(1))
    expect(result.current.message).toBeNull()
  })

  it('troca a mensagem e reinicia o prazo ao notificar novamente', () => {
    const { result } = renderHook(() => useToast())

    act(() => result.current.notify('Primeira'))
    act(() => vi.advanceTimersByTime(2000))
    act(() => result.current.notify('Segunda'))
    act(() => vi.advanceTimersByTime(1000))

    expect(result.current.message).toBe('Segunda')

    act(() => vi.advanceTimersByTime(2000))
    expect(result.current.message).toBeNull()
  })

  it('limpa o timer pendente ao desmontar', () => {
    const { result, unmount } = renderHook(() => useToast())

    act(() => result.current.notify('Pendente'))
    expect(vi.getTimerCount()).toBe(1)

    unmount()

    expect(vi.getTimerCount()).toBe(0)
  })
})
