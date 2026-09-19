import { useEffect, useRef, useState } from 'react'

// Renders one media item. The parent remounts this (via `key`) whenever the
// playing item changes, so local error state resets naturally.
export default function MediaView({ media, offset }) {
  const [failed, setFailed] = useState(false)

  if (!media) {
    return <Fallback title="No media" detail="Add items to this window's playlist" />
  }
  if (media.type === 'BLANK') {
    return <div className="media media-blank" aria-label="Blank" />
  }
  if (failed || !media.url) {
    return <Fallback title={media.code} detail={`Could not load ${media.name}`} />
  }
  if (media.type === 'VIDEO') {
    return <VideoView url={media.url} offset={offset} onError={() => setFailed(true)} />
  }
  return <img className="media" src={media.url} alt={media.name} onError={() => setFailed(true)} />
}

function VideoView({ url, offset, onError }) {
  const offsetRef = useRef(offset)
  useEffect(() => {
    offsetRef.current = offset
  }, [offset])

  // Seek to where the timeline says we are, so a page that loads mid-item (or
  // a second tab) shows the same moment of the video. Short clips loop.
  const handleLoaded = (e) => {
    const video = e.currentTarget
    if (Number.isFinite(video.duration) && video.duration > 0) {
      video.currentTime = offsetRef.current % video.duration
    }
  }

  return (
    <video
      className="media"
      src={url}
      autoPlay
      muted
      loop
      playsInline
      onLoadedMetadata={handleLoaded}
      onError={onError}
    />
  )
}

function Fallback({ title, detail }) {
  return (
    <div className="media media-fallback">
      <strong>{title}</strong>
      <span>{detail}</span>
    </div>
  )
}
