import MediaView from './MediaView'
import { formatClock, resolveFrame } from '../playback'

export default function MediaWindow({ window, serverNow, sync, onRemoveItem }) {
  const frame = resolveFrame(window, serverNow, sync)
  const isSync = frame.source === 'sync'

  return (
    <article className={`window-card${isSync ? ' is-sync' : ''}`}>
      <header className="window-head">
        <h2>{window.name}</h2>
        <span className="window-meta">
          loop {formatClock(window.playlistDurationSeconds)} · cycle {formatClock(window.cycleDurationSeconds)}
        </span>
      </header>

      <div className="screen">
        <MediaView key={frame.key} media={frame.media} offset={frame.offset} />
        {frame.media && (
          <div className="screen-badge">
            {isSync && <span className="tag tag-sync">SYNC</span>}
            <span className="tag">{frame.media.code}</span>
            <span className="badge-name">{frame.media.name}</span>
            <span className="badge-time">{Math.ceil(frame.remaining)}s</span>
          </div>
        )}
      </div>

      {frame.source === 'playlist' && (
        <p className="window-status">
          Loop {frame.loop} · {formatClock(frame.cycleElapsed)} into the 5h cycle
        </p>
      )}
      {isSync && <p className="window-status">Sync override — playlist resumes when it ends</p>}

      <ol className="playlist">
        {window.playlist.map((item) => (
          <li key={item.id} className={frame.itemId === item.id ? 'is-current' : undefined}>
            <span className="tag">{item.mediaCode}</span>
            <span className="playlist-name">{item.mediaName}</span>
            <span className="playlist-dur">{item.durationSeconds}s</span>
            <button
              type="button"
              className="icon-btn"
              aria-label={`Remove ${item.mediaCode} from ${window.name}`}
              onClick={() => onRemoveItem(window.id, item.id)}
            >
              ×
            </button>
          </li>
        ))}
        {window.playlist.length === 0 && <li className="playlist-empty">Playlist is empty</li>}
      </ol>
    </article>
  )
}
