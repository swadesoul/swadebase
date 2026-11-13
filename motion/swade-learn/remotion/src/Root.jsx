import { Composition } from 'remotion'

import { Lesson } from './Lesson'

export const RemotionRoot = () => {
  return (
    <Composition
      id="SwadeLearnLesson"
      component={Lesson}
      durationInFrames={360}
      fps={8}
      width={640}
      height={360}
      defaultProps={{ title: '', clips: [], graphics: [], fps: 8, width: 640, height: 360 }}
      calculateMetadata={({ props }) => {
        const fps = props.fps || 8
        const frames = (props.clips || []).reduce(
          (sum, clip) => sum + Math.round(clip.duration_sec * fps),
          0
        )
        return {
          durationInFrames: Math.max(1, frames),
          fps,
          width: props.width || 640,
          height: props.height || 360,
        }
      }}
    />
  )
}
