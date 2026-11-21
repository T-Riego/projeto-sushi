import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { HeroShowcase } from './HeroShowcase'

vi.mock('../../SushiScene', async () => {
  const { useEffect } = await import('react')

  function MockSushiScene({
    selected,
    onReady,
  }: {
    selected: number
    onReady: () => void
  }) {
    useEffect(() => {
      onReady()
    }, [onReady])

    return <div data-testid="sushi-scene" data-scene={selected} />
  }

  return { default: MockSushiScene }
})

describe('HeroShowcase', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'requestAnimationFrame',
      (callback: FrameRequestCallback) =>
        window.setTimeout(() => callback(performance.now()), 0),
    )
    vi.stubGlobal('cancelAnimationFrame', (handle: number) => {
      window.clearTimeout(handle)
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('starts with Box Signature mapped to scene zero', async () => {
    render(<HeroShowcase onAddProduct={vi.fn()} />)

    expect(screen.getAllByText('Box Signature')).not.toHaveLength(0)
    expect(await screen.findByTestId('sushi-scene')).toHaveAttribute(
      'data-scene',
      '0',
    )
  })

  it('maps the Garden Box picker and CTA to their product identifiers', async () => {
    const user = userEvent.setup()
    const onAddProduct = vi.fn()
    render(<HeroShowcase onAddProduct={onAddProduct} />)

    await user.click(screen.getByRole('button', { name: /Garden Box/i }))

    expect(await screen.findByTestId('sushi-scene')).toHaveAttribute(
      'data-scene',
      '1',
    )

    await user.click(
      screen.getByRole('button', { name: 'Quero experimentar' }),
    )
    expect(onAddProduct).toHaveBeenCalledOnce()
    expect(onAddProduct).toHaveBeenCalledWith('garden-box')
  })

  it('keeps arrow navigation within the three scene indices', async () => {
    const user = userEvent.setup()
    render(<HeroShowcase onAddProduct={vi.fn()} />)

    const scene = await screen.findByTestId('sushi-scene')
    const previous = screen.getByRole('button', { name: 'Prato anterior' })
    const next = screen.getByRole('button', { name: 'Próximo prato' })
    const visitedScenes = [scene.dataset.scene]

    await user.click(previous)
    visitedScenes.push(scene.dataset.scene)

    for (let step = 0; step < 4; step += 1) {
      await user.click(next)
      visitedScenes.push(scene.dataset.scene)
    }

    expect(visitedScenes).toEqual(['0', '2', '0', '1', '2', '0'])
    expect(visitedScenes.every((value) => ['0', '1', '2'].includes(value!))).toBe(
      true,
    )
  })
})
