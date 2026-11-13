import {
  AbsoluteFill,
  Audio,
  interpolate,
  Sequence,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion'

const font = 'Liberation Sans, DejaVu Sans, sans-serif'

const ClipCard = ({ clip }) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const opacity = interpolate(frame, [0, Math.round(0.4 * fps)], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })
  const y = interpolate(frame, [0, Math.round(0.4 * fps)], [28, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })
  return (
    <AbsoluteFill
      style={{ backgroundColor: '#10141c', justifyContent: 'flex-end', padding: '8% 6% 18%' }}
    >
      <div
        style={{
          opacity,
          transform: `translateY(${y}px)`,
          color: '#f4f0e6',
          fontFamily: font,
          fontSize: 42,
          fontWeight: 700,
          lineHeight: 1.1,
        }}
      >
        {clip.on_screen}
      </div>
    </AbsoluteFill>
  )
}

const GraphicCard = ({ graphic }) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const opacity = interpolate(frame, [0, Math.round(0.25 * fps)], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })
  const top = graphic.kind === 'end_card' ? '18%' : graphic.kind === 'title' ? '10%' : '8%'
  return (
    <AbsoluteFill style={{ padding: '0 6%' }}>
      <div
        style={{
          position: 'absolute',
          left: '6%',
          right: '6%',
          top,
          opacity,
          color: '#f2c14e',
          fontFamily: font,
          fontSize: graphic.kind === 'end_card' ? 36 : 22,
          fontWeight: 700,
        }}
      >
        {graphic.text}
      </div>
    </AbsoluteFill>
  )
}

export const Lesson = ({ title, clips, graphics }) => {
  const { fps } = useVideoConfig()
  let cursor = 0
  const placed = (clips || []).map((clip) => {
    const from = cursor
    const durationInFrames = Math.max(1, Math.round(clip.duration_sec * fps))
    cursor += durationInFrames
    return { clip, from, durationInFrames }
  })
  return (
    <AbsoluteFill style={{ backgroundColor: '#10141c' }}>
      <AbsoluteFill style={{ padding: '4% 6% 0' }}>
        <div style={{ color: '#9aa4b2', fontFamily: font, fontSize: 18 }}>{title}</div>
      </AbsoluteFill>
      {placed.map(({ clip, from, durationInFrames }) => (
        <Sequence key={clip.id} from={from} durationInFrames={durationInFrames} premountFor={fps}>
          <ClipCard clip={clip} />
          {clip.audioFile ? <Audio src={staticFile(clip.audioFile)} /> : null}
        </Sequence>
      ))}
      {(graphics || []).map((graphic) => (
        <Sequence
          key={graphic.id}
          from={Math.round(graphic.start_sec * fps)}
          durationInFrames={Math.max(1, Math.round(graphic.duration_sec * fps))}
          premountFor={fps}
        >
          <GraphicCard graphic={graphic} />
        </Sequence>
      ))}
    </AbsoluteFill>
  )
}
