import { useEffect, useState } from 'react'
import { api } from './api'
import { usePlaybackState } from './usePlaybackState'
import MediaWindow from './components/MediaWindow'
import ControlPanel from './components/ControlPanel'
import './App.css'

function App() {
  const { state, error, serverNow, refresh, applySync } = usePlaybackState()
  const [notice, setNotice] = useState(null)

  useEffect(() => {
    if (!notice) return
    const timer = setTimeout(() => setNotice(null), 4000)
    return () => clearTimeout(timer)
  }, [notice])

  // Runs a write against the API, shows the outcome, and pulls fresh state.
  const run = async (action, successMessage) => {
    try {
      await action(api)
      setNotice({ kind: 'ok', text: successMessage })
    } catch (err) {
      setNotice({ kind: 'error', text: err.message })
    }
    refresh()
  }

  const removeItem = (windowId, itemId) => run((a) => a.removeFromPlaylist(windowId, itemId), 'Removed from playlist')

  if (!state) {
    return (
      <main className="app">
        <p className="loading">{error ? `Cannot reach the backend: ${error}` : 'Loading…'}</p>
      </main>
    )
  }

  return (
    <main className="app">
      <header className="app-head">
        <div>
          <h1>Multi-Window Media Sequencer</h1>
          <p className="subtitle">
            Each window loops its own playlist inside a 5-hour cycle. Sync shows one item on every window at once.
          </p>
        </div>
        <div className="status">
          <span className={`dot${error ? ' dot-error' : ''}`} />
          {error ? 'Reconnecting…' : 'Live'} · {new Date(serverNow).toLocaleTimeString()}
        </div>
      </header>

      {notice && (
        <div className={`notice notice-${notice.kind}`} role="status">
          {notice.text}
          <button type="button" className="icon-btn" aria-label="Dismiss" onClick={() => setNotice(null)}>×</button>
        </div>
      )}

      <section className="windows">
        {state.windows.map((w) => (
          <MediaWindow key={w.id} window={w} serverNow={serverNow} sync={state.sync} onRemoveItem={removeItem} />
        ))}
      </section>

      <ControlPanel
        windows={state.windows}
        mediaLibrary={state.mediaLibrary}
        sync={state.sync}
        serverNow={serverNow}
        run={run}
        onSync={applySync}
      />
    </main>
  )
}

export default App
