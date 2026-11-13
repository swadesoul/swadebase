import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

// Remotion 4.0.543 renders with its own Chrome Headless Shell build, not the
// system Chrome. That download is the render runtime, not a paid media API.
export async function renderWithRemotion({ publicDir, outFile, props, onProgress }) {
  const { bundle } = await import('@remotion/bundler')
  const { ensureBrowser, renderMedia, selectComposition } = await import('@remotion/renderer')
  const entry = join(dirname(fileURLToPath(import.meta.url)), 'remotion/src/index.jsx')
  const browserExecutable = process.env.SWADE_LEARN_CHROME || null
  const chromeMode = browserExecutable ? 'chrome-for-testing' : 'headless-shell'
  await ensureBrowser({ chromeMode, browserExecutable, logLevel: 'error' })
  const chromiumOptions = { gl: null, enableMultiProcessOnLinux: true, headless: true }
  const serveUrl = await bundle({
    entryPoint: entry,
    publicDir,
    enableCaching: false,
  })
  const inputProps = props
  const shared = { inputProps, browserExecutable, chromiumOptions, chromeMode, logLevel: 'error' }
  const composition = await selectComposition({
    serveUrl,
    id: 'SwadeLearnLesson',
    ...shared,
  })
  await renderMedia({
    composition,
    serveUrl,
    codec: 'h264',
    outputLocation: outFile,
    concurrency: props.concurrency || 1,
    crf: 28,
    x264Preset: 'ultrafast',
    imageFormat: 'jpeg',
    jpegQuality: 80,
    onProgress: ({ progress }) => onProgress?.(progress),
    ...shared,
  })
  return outFile
}
