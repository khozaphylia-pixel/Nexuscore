export type VideoTheme = 'charcoal' | 'gold' | 'emerald'

export const VIDEO_THEMES: { value: VideoTheme; label: string }[] = [
  { value: 'charcoal', label: 'Charcoal Dark' },
  { value: 'gold', label: 'Premium Gold' },
  { value: 'emerald', label: 'Digital Emerald Neon Grid' },
]

const WIDTH = 1280
const HEIGHT = 720
const FPS = 30

type RenderOptions = {
  durationSeconds: number
  theme: VideoTheme
  audioFile?: File | null
  onProgress: (percent: number) => void
  signal?: AbortSignal
}

function pickMimeType() {
  const candidates = [
    'video/mp4;codecs=avc1,mp4a',
    'video/mp4',
    'video/webm;codecs=vp9,opus',
    'video/webm;codecs=vp8,opus',
    'video/webm',
  ]
  return candidates.find((type) => MediaRecorder.isTypeSupported(type)) ?? ''
}

function drawCharcoal(ctx: CanvasRenderingContext2D, phase: number) {
  ctx.fillStyle = '#0f1011'
  ctx.fillRect(0, 0, WIDTH, HEIGHT)
  for (let i = 0; i < 6; i++) {
    const angle = phase * Math.PI * 2 + (i * Math.PI) / 3
    const x = WIDTH / 2 + Math.cos(angle) * (220 + i * 30)
    const y = HEIGHT / 2 + Math.sin(angle * 2) * (120 + i * 12)
    const r = 260 - i * 20
    const g = ctx.createRadialGradient(x, y, 0, x, y, r)
    g.addColorStop(0, `rgba(160,165,170,${0.14 - i * 0.015})`)
    g.addColorStop(1, 'rgba(160,165,170,0)')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, WIDTH, HEIGHT)
  }
  ctx.strokeStyle = 'rgba(200,205,210,0.08)'
  ctx.lineWidth = 1
  for (let i = 0; i < 24; i++) {
    ctx.beginPath()
    for (let x = 0; x <= WIDTH; x += 16) {
      const y = HEIGHT / 2 + Math.sin(x / 140 + phase * Math.PI * 2 + i * 0.3) * (40 + i * 8)
      if (x === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.stroke()
  }
}

function drawGold(ctx: CanvasRenderingContext2D, phase: number) {
  ctx.fillStyle = '#0a0806'
  ctx.fillRect(0, 0, WIDTH, HEIGHT)
  const cx = WIDTH / 2
  const cy = HEIGHT / 2
  const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, 420)
  glow.addColorStop(0, 'rgba(212,175,55,0.25)')
  glow.addColorStop(1, 'rgba(212,175,55,0)')
  ctx.fillStyle = glow
  ctx.fillRect(0, 0, WIDTH, HEIGHT)
  for (let i = 0; i < 9; i++) {
    const rot = phase * Math.PI * 2 * (i % 2 === 0 ? 1 : -1) + i * 0.4
    ctx.save()
    ctx.translate(cx, cy)
    ctx.rotate(rot)
    ctx.strokeStyle = `rgba(${230 - i * 6},${190 - i * 8},${90 - i * 5},${0.75 - i * 0.07})`
    ctx.lineWidth = 2
    ctx.setLineDash([40 + i * 10, 18 + i * 4])
    ctx.beginPath()
    ctx.ellipse(0, 0, 80 + i * 38, 60 + i * 26, 0, 0, Math.PI * 2)
    ctx.stroke()
    ctx.restore()
  }
  ctx.setLineDash([])
  for (let i = 0; i < 40; i++) {
    const a = (i / 40) * Math.PI * 2 + phase * Math.PI * 2
    const d = 300 + Math.sin(a * 3 + phase * Math.PI * 4) * 40
    ctx.fillStyle = 'rgba(245,215,120,0.8)'
    ctx.beginPath()
    ctx.arc(cx + Math.cos(a) * d, cy + Math.sin(a) * d * 0.6, 2, 0, Math.PI * 2)
    ctx.fill()
  }
}

function drawEmerald(ctx: CanvasRenderingContext2D, phase: number) {
  ctx.fillStyle = '#020a06'
  ctx.fillRect(0, 0, WIDTH, HEIGHT)
  const horizon = HEIGHT * 0.45
  const sky = ctx.createLinearGradient(0, 0, 0, horizon)
  sky.addColorStop(0, 'rgba(0,0,0,0)')
  sky.addColorStop(1, 'rgba(57,255,136,0.18)')
  ctx.fillStyle = sky
  ctx.fillRect(0, 0, WIDTH, horizon)

  ctx.save()
  ctx.shadowColor = '#39ff88'
  ctx.shadowBlur = 12
  ctx.strokeStyle = 'rgba(57,255,136,0.85)'
  ctx.lineWidth = 1.5
  const vx = WIDTH / 2
  for (let i = -20; i <= 20; i++) {
    ctx.beginPath()
    ctx.moveTo(vx, horizon)
    ctx.lineTo(vx + i * 110, HEIGHT)
    ctx.stroke()
  }
  const rows = 14
  for (let i = 0; i < rows; i++) {
    const t = ((i + phase * 4) % rows) / rows
    const y = horizon + Math.pow(t, 2.2) * (HEIGHT - horizon)
    ctx.globalAlpha = Math.min(1, t * 1.6)
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(WIDTH, y)
    ctx.stroke()
  }
  ctx.restore()

  const sunY = horizon - 90
  const sun = ctx.createRadialGradient(vx, sunY, 0, vx, sunY, 140)
  sun.addColorStop(0, 'rgba(120,255,170,0.9)')
  sun.addColorStop(0.5, 'rgba(57,255,136,0.35)')
  sun.addColorStop(1, 'rgba(57,255,136,0)')
  ctx.fillStyle = sun
  ctx.beginPath()
  ctx.arc(vx, sunY, 140 + Math.sin(phase * Math.PI * 2) * 10, 0, Math.PI * 2)
  ctx.fill()
}

const DRAWERS: Record<VideoTheme, (ctx: CanvasRenderingContext2D, phase: number) => void> = {
  charcoal: drawCharcoal,
  gold: drawGold,
  emerald: drawEmerald,
}

export async function renderAbstractVideo({
  durationSeconds,
  theme,
  audioFile,
  onProgress,
  signal,
}: RenderOptions): Promise<{ url: string; mimeType: string }> {
  if (typeof MediaRecorder === 'undefined') {
    throw new Error('This browser does not support in-browser video recording.')
  }

  const canvas = document.createElement('canvas')
  canvas.width = WIDTH
  canvas.height = HEIGHT
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas 2D context unavailable.')

  const stream = canvas.captureStream(FPS)
  let audioContext: AudioContext | null = null

  if (audioFile) {
    audioContext = new AudioContext()
    const buffer = await audioContext.decodeAudioData(await audioFile.arrayBuffer())
    const source = audioContext.createBufferSource()
    source.buffer = buffer
    source.loop = true
    const destination = audioContext.createMediaStreamDestination()
    source.connect(destination)
    source.start()
    destination.stream.getAudioTracks().forEach((track) => stream.addTrack(track))
  }

  const mimeType = pickMimeType()
  const recorder = new MediaRecorder(stream, mimeType ? { mimeType, videoBitsPerSecond: 6_000_000 } : undefined)
  const chunks: Blob[] = []
  recorder.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data)
  }

  const draw = DRAWERS[theme]
  const durationMs = durationSeconds * 1000

  return new Promise((resolve, reject) => {
    let frameId = 0
    let start = 0
    let aborted = false

    const cleanup = () => {
      cancelAnimationFrame(frameId)
      stream.getTracks().forEach((t) => t.stop())
      void audioContext?.close()
    }

    const onAbort = () => {
      aborted = true
      if (recorder.state !== 'inactive') recorder.stop()
    }
    signal?.addEventListener('abort', onAbort, { once: true })

    recorder.onstop = () => {
      cleanup()
      signal?.removeEventListener('abort', onAbort)
      if (aborted) {
        reject(new DOMException('Render cancelled', 'AbortError'))
        return
      }
      const type = recorder.mimeType || mimeType || 'video/webm'
      const blob = new Blob(chunks, { type })
      onProgress(100)
      resolve({ url: URL.createObjectURL(blob), mimeType: type })
    }
    recorder.onerror = () => {
      cleanup()
      reject(new Error('Recording failed.'))
    }

    const tick = (now: number) => {
      if (!start) start = now
      const elapsed = now - start
      const progress = Math.min(elapsed / durationMs, 1)
      draw(ctx, progress * Math.max(1, Math.round(durationSeconds / 6)) % 1)
      onProgress(Math.min(99, Math.floor(progress * 100)))
      if (progress >= 1) {
        recorder.stop()
        return
      }
      frameId = requestAnimationFrame(tick)
    }

    draw(ctx, 0)
    recorder.start(250)
    frameId = requestAnimationFrame(tick)
  })
}
