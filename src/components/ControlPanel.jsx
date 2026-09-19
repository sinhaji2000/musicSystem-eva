import { useState } from 'react'

// Forms for the three write actions: trigger a sync, add media to a window's
// playlist, and register new media / windows. Each form reports success or
// failure through `run`, which also refreshes state from the backend.
export default function ControlPanel({ windows, mediaLibrary, sync, serverNow, run, onSync }) {
  return (
    <section className="controls">
      <SyncForm mediaLibrary={mediaLibrary} sync={sync} serverNow={serverNow} run={run} onSync={onSync} />
      <AddToWindowForm windows={windows} mediaLibrary={mediaLibrary} run={run} />
      <NewMediaForm run={run} />
      <NewWindowForm run={run} />
    </section>
  )
}

function SyncForm({ mediaLibrary, sync, serverNow, run, onSync }) {
  const [mediaId, setMediaId] = useState('')
  const [duration, setDuration] = useState(10)
  const remaining = sync?.active ? Math.ceil((Date.parse(sync.endsAt) - serverNow) / 1000) : 0

  const submit = (e) => {
    e.preventDefault()
    run(async (api) => onSync(await api.triggerSync(Number(mediaId), Number(duration))), 'Sync started')
  }

  return (
    <form className="panel" onSubmit={submit}>
      <h3>Sync all windows</h3>
      <MediaSelect value={mediaId} onChange={setMediaId} mediaLibrary={mediaLibrary} />
      <label>
        Duration (seconds)
        <input type="number" min="1" required value={duration} onChange={(e) => setDuration(e.target.value)} />
      </label>
      <button type="submit" className="btn-primary">Sync now</button>
      {remaining > 0 && (
        <p className="hint">
          Showing <strong>{sync.mediaCode}</strong> everywhere · {remaining}s left
        </p>
      )}
    </form>
  )
}

function AddToWindowForm({ windows, mediaLibrary, run }) {
  const [windowId, setWindowId] = useState('')
  const [mediaId, setMediaId] = useState('')
  const [duration, setDuration] = useState('')

  const submit = (e) => {
    e.preventDefault()
    const seconds = duration === '' ? undefined : Number(duration)
    run((api) => api.addToPlaylist(Number(windowId), Number(mediaId), seconds), 'Added to playlist')
  }

  return (
    <form className="panel" onSubmit={submit}>
      <h3>Add media to a window</h3>
      <label>
        Window
        <select required value={windowId} onChange={(e) => setWindowId(e.target.value)}>
          <option value="" disabled>Select window</option>
          {windows.map((w) => (
            <option key={w.id} value={w.id}>{w.name}</option>
          ))}
        </select>
      </label>
      <MediaSelect value={mediaId} onChange={setMediaId} mediaLibrary={mediaLibrary} />
      <label>
        Duration (seconds, optional)
        <input
          type="number"
          min="1"
          placeholder="Media default"
          value={duration}
          onChange={(e) => setDuration(e.target.value)}
        />
      </label>
      <button type="submit">Add to playlist</button>
    </form>
  )
}

const EMPTY_MEDIA = { code: '', name: '', mediaType: 'IMAGE', mediaUrl: '', durationSeconds: 8 }

function NewMediaForm({ run }) {
  const [form, setForm] = useState(EMPTY_MEDIA)
  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value })
  const isBlank = form.mediaType === 'BLANK'

  const submit = (e) => {
    e.preventDefault()
    const media = {
      ...form,
      mediaUrl: isBlank ? null : form.mediaUrl,
      durationSeconds: Number(form.durationSeconds),
    }
    run(async (api) => {
      await api.createMedia(media)
      setForm(EMPTY_MEDIA)
    }, 'Media created')
  }

  return (
    <form className="panel" onSubmit={submit}>
      <h3>New media</h3>
      <div className="row">
        <label>
          Code
          <input required placeholder="M7" value={form.code} onChange={set('code')} />
        </label>
        <label>
          Type
          <select value={form.mediaType} onChange={set('mediaType')}>
            <option value="IMAGE">Image</option>
            <option value="VIDEO">Video</option>
            <option value="BLANK">Blank</option>
          </select>
        </label>
      </div>
      <label>
        Name
        <input required value={form.name} onChange={set('name')} />
      </label>
      {!isBlank && (
        <label>
          URL
          <input required type="url" placeholder="https://…" value={form.mediaUrl} onChange={set('mediaUrl')} />
        </label>
      )}
      <label>
        Default duration (seconds)
        <input type="number" min="1" required value={form.durationSeconds} onChange={set('durationSeconds')} />
      </label>
      <button type="submit">Create media</button>
    </form>
  )
}

function NewWindowForm({ run }) {
  const [name, setName] = useState('')

  const submit = (e) => {
    e.preventDefault()
    run(async (api) => {
      await api.createWindow(name)
      setName('')
    }, 'Window created')
  }

  return (
    <form className="panel" onSubmit={submit}>
      <h3>New window</h3>
      <label>
        Name
        <input required placeholder="Window D" value={name} onChange={(e) => setName(e.target.value)} />
      </label>
      <button type="submit">Create window</button>
    </form>
  )
}

function MediaSelect({ value, onChange, mediaLibrary }) {
  return (
    <label>
      Media
      <select required value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="" disabled>Select media</option>
        {mediaLibrary.map((m) => (
          <option key={m.id} value={m.id}>
            {m.code} — {m.name} ({m.mediaType.toLowerCase()})
          </option>
        ))}
      </select>
    </label>
  )
}
