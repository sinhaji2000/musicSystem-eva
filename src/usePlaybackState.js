import { useCallback, useEffect, useState } from 'react'
import { api } from './api'

const TICK_MS = 250
const BACKGROUND_REFRESH_MS = 10 * 60 * 1000

let refreshInFlight = false

// Fetches windows, playlists, media and the active sync on load (and rarely in
// the background), and keeps an estimate of the server clock so every tab plays
// on the same timeline. Playback itself is derived locally from that state.
export function usePlaybackState() {
  const [state, setState] = useState(null)
  const [error, setError] = useState(null)
  const [clockOffset, setClockOffset] = useState(0)
  const [now, setNow] = useState(() => Date.now())

  const refresh = useCallback(async () => {
    if (refreshInFlight) return
    refreshInFlight = true
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
    } finally {
      refreshInFlight = false
    }
  }, [])

  useEffect(() => {
    // Kick off the first fetch outside the effect body so setState isn't synchronous here.
    const first = setTimeout(refresh, 0)
    const background = setInterval(refresh, BACKGROUND_REFRESH_MS)
    const tick = setInterval(() => setNow(Date.now()), TICK_MS)
    return () => {
      clearTimeout(first)
      clearInterval(background)
      clearInterval(tick)
    }
  }, [refresh])

  // Lets a caller apply its own write immediately instead of waiting for another fetch.
  const applySync = useCallback((sync) => setState((prev) => (prev ? { ...prev, sync } : prev)), [])

  return { state, error, serverNow: now + clockOffset, refresh, applySync }
}
