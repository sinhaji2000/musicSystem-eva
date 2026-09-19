// Playback is derived from time, not pushed by the server.
//
// Every window runs on a timeline anchored at the Unix epoch and split into
// 5-hour cycles. Inside a cycle the playlist repeats back to back; when the
// cycle ends the list restarts from its first item. Because the position is a
// pure function of (playlist, server time), every browser tab computes the
// same frame for the same instant, and a sync can simply "cover" the timeline
// for its duration - when it ends the window is exactly where its own
// sequence would have been.

export function resolveFrame(window, nowMs, sync) {
  if (sync?.active) {
    const startedAt = Date.parse(sync.startedAt)
    const endsAt = Date.parse(sync.endsAt)
    if (nowMs >= startedAt && nowMs < endsAt) {
      return {
        source: 'sync',
        key: `sync-${sync.startedAt}`,
        media: { code: sync.mediaCode, name: sync.mediaName, type: sync.mediaType, url: sync.mediaUrl },
        offset: (nowMs - startedAt) / 1000,
        remaining: (endsAt - nowMs) / 1000,
      }
    }
  }

  const playlist = window.playlist ?? []
  const loopLength = window.playlistDurationSeconds
  if (playlist.length === 0 || !loopLength) {
    return { source: 'empty', key: 'empty', media: null, offset: 0, remaining: 0 }
  }

  const cycleLength = window.cycleDurationSeconds
  const nowSec = nowMs / 1000
  const cycleNumber = Math.floor(nowSec / cycleLength)
  const cycleElapsed = nowSec - cycleNumber * cycleLength
  const loopNumber = Math.floor(cycleElapsed / loopLength)
  let t = cycleElapsed - loopNumber * loopLength

  for (let index = 0; index < playlist.length; index++) {
    const item = playlist[index]
    if (t < item.durationSeconds) {
      return {
        source: 'playlist',
        // Includes the loop so a single-item list still restarts its video.
        key: `${item.id}-${cycleNumber}-${loopNumber}`,
        itemId: item.id,
        index,
        media: { code: item.mediaCode, name: item.mediaName, type: item.mediaType, url: item.mediaUrl },
        offset: t,
        // The last loop of a cycle can be cut short by the cycle boundary.
        remaining: Math.min(item.durationSeconds - t, cycleLength - cycleElapsed),
        loop: loopNumber + 1,
        cycleElapsed,
      }
    }
    t -= item.durationSeconds
  }
  return { source: 'empty', key: 'empty', media: null, offset: 0, remaining: 0 }
}

export function formatClock(totalSeconds) {
  const s = Math.max(0, Math.floor(totalSeconds))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  const pad = (n) => String(n).padStart(2, '0')
  return h > 0 ? `${h}:${pad(m)}:${pad(sec)}` : `${m}:${pad(sec)}`
}
