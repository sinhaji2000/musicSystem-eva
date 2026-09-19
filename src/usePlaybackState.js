import { useCallback, useEffect, useState } from 'react'
import { api } from './api'

const POLL_MS = 1500
const TICK_MS = 250

// Polls the backend for windows, playlists, media and the active sync, and
// keeps an estimate of the server clock so every tab plays on the same timeline.
export function usePlaybackState() {
  const [state, setState] = useState(null)
  const [error, setError] = useState(null)
  const [clockOffset, setClockOffset] = useState(0)
  const [now, setNow] = useState(() => Date.now())

  const refresh = useCallback(async () => {
    const sentAt = Date.now()
    try {
      const data = await api.getState()
      const receivedAt = Date.now()
      // Assume the server stamped the response halfway through the round trip.
      setClockOffset(Date.parse(data.serverTime) - (sentAt + receivedAt) / 2)
      setState(data)
      setError(null)
    } catch (err) {
      setError(err.message)
    }
  }, [])

  useEffect(() => {
    // Kick off the first fetch outside the effect body so setState isn't synchronous here.
    const first = setTimeout(refresh, 0)
    const poll = setInterval(refresh, POLL_MS)
    const tick = setInterval(() => setNow(Date.now()), TICK_MS)
    return () => {
      clearTimeout(first)
      clearInterval(poll)
      clearInterval(tick)
    }
  }, [refresh])

  // Lets a caller apply its own write immediately instead of waiting for the next poll.
  const applySync = useCallback((sync) => setState((prev) => (prev ? { ...prev, sync } : prev)), [])

  return { state, error, serverNow: now + clockOffset, refresh, applySync }
}
