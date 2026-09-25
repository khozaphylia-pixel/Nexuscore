'use client'

import { useEffect, useId, useRef, useState, type ChangeEvent, type DragEvent } from 'react'
import { ChevronDown, Film, Music, Play, Square, CloudUpload as UploadCloud, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { renderAbstractVideo, VIDEO_THEMES, type VideoTheme } from '@/lib/render-video'

const MIN_DURATION = 3
const MAX_DURATION = 30

type RenderStatus = 'idle' | 'rendering' | 'done' | 'error'

export function VideoStudio() {
  const [duration, setDuration] = useState(8)
  const [theme, setTheme] = useState<VideoTheme>('emerald')
  const [audioFile, setAudioFile] = useState<File | null>(null)
  const [progress, setProgress] = useState(0)
  const [status, setStatus] = useState<RenderStatus>('idle')
  const [error, setError] = useState<string | null>(null)
  const [video, setVideo] = useState<{ url: string; mimeType: string } | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    return () => {
      if (video) URL.revokeObjectURL(video.url)
    }
  }, [video])

  useEffect(() => () => abortRef.current?.abort(), [])

  async function startRender() {
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller
    setStatus('rendering')
    setProgress(0)
    setError(null)
    setVideo(null)
    try {
      const result = await renderAbstractVideo({
        durationSeconds: duration,
        theme,
        audioFile,
        onProgress: setProgress,
        signal: controller.signal,
      })
      setVideo(result)
      setStatus('done')
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        setStatus('idle')
        setProgress(0)
        return
      }
      setError(err instanceof Error ? err.message : 'Render failed.')
      setStatus('error')
    }
  }

  const fillPercent = ((duration - MIN_DURATION) / (MAX_DURATION - MIN_DURATION)) * 100
  const isRendering = status === 'rendering'

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 md:px-8 md:py-8">
      <header className="flex flex-col gap-1">
        <h1 className="text-lg font-semibold text-balance">Video Production Studio</h1>
        <p className="text-sm text-muted-foreground text-pretty">
          Configure an abstract motion loop and render it frame-by-frame in your browser.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)]">
        <div className="flex flex-col gap-5 rounded-2xl border border-border bg-card p-5">
          <fieldset disabled={isRendering} className="flex flex-col gap-5 disabled:opacity-60">
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <label htmlFor="duration" className="text-sm font-medium">
                  Timeline length
                </label>
                <span className="rounded-md bg-primary/10 px-2 py-0.5 font-mono text-sm text-primary tabular-nums">
                  {duration}s
                </span>
              </div>
              <input
                id="duration"
                type="range"
                min={MIN_DURATION}
                max={MAX_DURATION}
                step={1}
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="neon-range w-full"
                style={{ ['--fill' as string]: `${fillPercent}%` }}
              />
              <div className="flex justify-between font-mono text-[11px] text-muted-foreground">
                <span>{MIN_DURATION}s</span>
                <span>{MAX_DURATION}s</span>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="theme" className="text-sm font-medium">
                Theme configuration
              </label>
              <div className="relative">
                <select
                  id="theme"
                  value={theme}
                  onChange={(e) => setTheme(e.target.value as VideoTheme)}
                  className="h-11 w-full appearance-none rounded-lg border border-input bg-secondary px-3 pr-10 text-sm transition-shadow focus:glow-neon focus:outline-none"
                >
                  {VIDEO_THEMES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden="true"
                />
              </div>
            </div>

            <AudioDropZone file={audioFile} onFileChange={setAudioFile} />
          </fieldset>

          <div className="flex flex-col gap-3 border-t border-border pt-5">
            <div className="flex items-center justify-between font-mono text-xs">
              <span className="text-muted-foreground">
                {status === 'rendering'
                  ? 'Rendering frames...'
                  : status === 'done'
                    ? 'Render complete'
                    : status === 'error'
                      ? 'Render failed'
                      : 'Ready to render'}
              </span>
              <span className="text-primary tabular-nums">{progress}%</span>
            </div>
            <div
              role="progressbar"
              aria-label="Render progress"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={progress}
              className="h-2.5 w-full overflow-hidden rounded-full bg-secondary"
            >
              <div
                className="h-full rounded-full bg-primary transition-[width] duration-200 ease-linear"
                style={{ width: `${progress}%` }}
              />
            </div>
            {error && (
              <p role="alert" className="text-xs text-destructive">
                {error}
              </p>
            )}
            {isRendering ? (
              <button
                type="button"
                onClick={() => abortRef.current?.abort()}
                className="flex h-11 items-center justify-center gap-2 rounded-lg border border-primary/40 text-sm font-medium text-primary transition-colors hover:bg-primary/10"
              >
                <Square className="size-4" aria-hidden="true" />
                Cancel render
              </button>
            ) : (
              <button
                type="button"
                onClick={startRender}
                className="flex h-11 items-center justify-center gap-2 rounded-lg bg-primary text-sm font-semibold text-primary-foreground transition-all hover:brightness-110"
              >
                <Play className="size-4" aria-hidden="true" />
                {status === 'done' ? 'Render again' : 'Execute render'}
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <div
            className={cn(
              'relative flex aspect-video w-full items-center justify-center overflow-hidden rounded-2xl border border-border bg-black',
              video && 'glow-neon-soft border-primary/40',
            )}
          >
            {video ? (
              <video
                key={video.url}
                src={video.url}
                autoPlay
                loop
                controls
                playsInline
                className="size-full object-cover"
              >
                <track kind="captions" />
              </video>
            ) : (
              <div className="flex flex-col items-center gap-3 text-center text-muted-foreground">
                <Film className={cn('size-10', isRendering && 'animate-pulse text-primary')} aria-hidden="true" />
                <p className="font-mono text-xs">
                  {isRendering ? `Capturing ${duration}s of ${labelFor(theme)}...` : 'Preview appears after rendering'}
                </p>
              </div>
            )}
          </div>
          {video && (
            <div className="flex items-center justify-between gap-3 font-mono text-xs text-muted-foreground">
              <span>
                {duration}s · {labelFor(theme)} · {video.mimeType.split(';')[0]}
              </span>
              <a
                href={video.url}
                download={`studio-render.${video.mimeType.includes('mp4') ? 'mp4' : 'webm'}`}
                className="text-primary underline-offset-4 hover:underline"
              >
                Download
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function labelFor(theme: VideoTheme) {
  return VIDEO_THEMES.find((t) => t.value === theme)?.label ?? theme
}

function AudioDropZone({ file, onFileChange }: { file: File | null; onFileChange: (file: File | null) => void }) {
  const inputId = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [rejected, setRejected] = useState(false)

  function accept(candidate: File | undefined) {
    if (!candidate) return
    const isMp3 = candidate.type === 'audio/mpeg' || candidate.name.toLowerCase().endsWith('.mp3')
    setRejected(!isMp3)
    if (isMp3) onFileChange(candidate)
  }

  function handleDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault()
    setIsDragging(false)
    accept(event.dataTransfer.files[0])
  }

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    accept(event.target.files?.[0])
    event.target.value = ''
  }

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium">Background audio</span>
      {file ? (
        <div className="flex items-center gap-3 rounded-lg border border-primary/40 bg-primary/5 px-3 py-3">
          <Music className="size-4 shrink-0 text-primary" aria-hidden="true" />
          <span className="min-w-0 flex-1 truncate text-sm">{file.name}</span>
          <button
            type="button"
            onClick={() => onFileChange(null)}
            aria-label="Remove audio track"
            className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>
      ) : (
        <label
          htmlFor={inputId}
          onDragOver={(e) => {
            e.preventDefault()
            setIsDragging(true)
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={cn(
            'flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed px-4 py-7 text-center transition-colors',
            isDragging
              ? 'border-primary bg-primary/10 text-primary'
              : 'border-border text-muted-foreground hover:border-primary/60 hover:text-foreground',
          )}
        >
          <UploadCloud className="size-6" aria-hidden="true" />
          <span className="text-sm font-medium text-balance">Click to Mount Custom Background Audio Track (.MP3)</span>
          <span className="font-mono text-[11px]">or drag and drop</span>
        </label>
      )}
      <input
        id={inputId}
        ref={inputRef}
        type="file"
        accept=".mp3,audio/mpeg"
        onChange={handleChange}
        className="sr-only"
      />
      {rejected && (
        <p role="alert" className="text-xs text-destructive">
          Only .mp3 files are supported.
        </p>
      )}
    </div>
  )
}
