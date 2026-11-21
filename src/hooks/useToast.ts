import { useCallback, useEffect, useRef, useState } from 'react'

export function useToast() {
  const [message, setMessage] = useState<string | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const notify = useCallback((nextMessage: string) => {
    if (timerRef.current !== undefined) {
      clearTimeout(timerRef.current)
    }

    setMessage(nextMessage)
    timerRef.current = setTimeout(() => {
      setMessage(null)
      timerRef.current = undefined
    }, 3000)
  }, [])

  useEffect(
    () => () => {
      if (timerRef.current !== undefined) {
        clearTimeout(timerRef.current)
      }
    },
    [],
  )

  return { message, notify }
}
