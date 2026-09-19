const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:8080').replace(/\/$/, '')

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (!res.ok) {
    let message = `Request failed (${res.status})`
    try {
      const body = await res.json()
      message = body.message || body.error || message
    } catch {
      // Non-JSON error body; keep the status message.
    }
    throw new Error(message)
  }
  return res.status === 204 ? null : res.json()
}

const post = (path, body) => request(path, { method: 'POST', body: JSON.stringify(body) })

export const api = {
  getState: () => request('/api/windows/state'),
  createWindow: (name) => post('/api/windows', { name }),
  createMedia: (media) => post('/api/media', media),
  addToPlaylist: (windowId, mediaId, durationSeconds) =>
    post(`/api/windows/${windowId}/playlist`, { mediaId, durationSeconds }),
  removeFromPlaylist: (windowId, itemId) =>
    request(`/api/windows/${windowId}/playlist/${itemId}`, { method: 'DELETE' }),
  triggerSync: (mediaId, durationSeconds) => post('/api/sync', { mediaId, durationSeconds }),
}
