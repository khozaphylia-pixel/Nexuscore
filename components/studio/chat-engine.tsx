'use client'

import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import { ArrowUp, Bot, Mic, ShieldCheck, SquareTerminal as TerminalSquare, User } from 'lucide-react'
import { cn } from '@/lib/utils'

const CHAT_ENDPOINT = '/api/chat'

type Message = {
  id: string
  role: 'system' | 'user' | 'assistant' | 'error'
  content: string
}

const INITIAL_MESSAGES: Message[] = [
  { id: 'system-boot', role: 'system', content: 'System operational. Ollama core with OpenAI fallback ready.' },
]

export function ChatEngine({ temporaryChat }: { temporaryChat: boolean }) {
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES)
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, isLoading])

  async function sendPrompt(event?: FormEvent) {
    event?.preventDefault()
    const userInput = input.trim()
    if (!userInput || isLoading) return

    setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: 'user', content: userInput }])
    setInput('')
    setIsLoading(true)

    try {
      const response = await fetch(CHAT_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: userInput }),
      })
      if (!response.ok) {
        const detail = await response.text().catch(() => '')
        throw new Error(`Chat service responded with ${response.status}. ${detail}`.trim())
      }
      const data: { response?: string } = await response.json()
      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: 'assistant', content: data.response?.trim() || '(empty response)' },
      ])
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Unknown error contacting chat service.'
      setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: 'error', content: message }])
    } finally {
      setIsLoading(false)
      textareaRef.current?.focus()
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.nativeEvent.isComposing || event.keyCode === 229) return
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      void sendPrompt()
    }
  }

  return (
    <>
      <header className="flex items-center justify-between border-b border-border px-6 py-4">
        <div>
          <h1 className="text-lg font-semibold text-balance">Cyber AI Chat Engine</h1>
          <p className="font-mono text-xs text-muted-foreground">model: ollama · openai fallback</p>
        </div>
        <span className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1 font-mono text-xs text-primary">
          local
        </span>
      </header>

      <div
        ref={scrollRef}
        role="log"
        aria-live="polite"
        aria-busy={isLoading}
        className="flex-1 overflow-y-auto"
      >
        {temporaryChat && (
          <div className="sticky top-0 z-10 bg-background/85 px-4 pt-4 backdrop-blur md:px-6">
            <div
              role="status"
              className="animate-in fade-in slide-in-from-top-4 mx-auto flex w-full max-w-3xl items-start gap-3 rounded-xl border border-dashed border-privacy/70 bg-privacy/10 px-4 py-3 text-sm text-privacy duration-500"
            >
              <ShieldCheck className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              <div>
                <p className="font-mono text-xs font-semibold tracking-wider uppercase">Temporary Chat active</p>
                <p className="mt-0.5 text-xs leading-relaxed text-privacy/80">
                  History cache isolation is active. Messages in this session won&apos;t be saved.
                </p>
              </div>
            </div>
          </div>
        )}
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8 md:px-6">
          {messages.map((message) => (
            <ChatMessage key={message.id} message={message} />
          ))}
          {isLoading && <ThinkingIndicator />}
        </div>
      </div>

      <div className="border-t border-border bg-background/80 px-4 py-4 backdrop-blur md:px-6">
        <form onSubmit={sendPrompt} className="mx-auto w-full max-w-3xl">
          <div className="flex items-end gap-2 rounded-2xl border border-input bg-card p-2 transition-shadow focus-within:glow-neon">
            <label htmlFor="chat-input" className="sr-only">
              Message the local model
            </label>
            <textarea
              id="chat-input"
              ref={textareaRef}
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={isRecording ? 'Listening to audio input layer values...' : 'Ask your local model anything...'}
              className={cn(
                'max-h-48 min-h-10 flex-1 resize-none bg-transparent px-3 py-2 text-sm leading-relaxed focus:outline-none field-sizing-content',
                isRecording ? 'placeholder:text-destructive/80' : 'placeholder:text-muted-foreground',
              )}
            />
            <button
              type="button"
              onClick={() => setIsRecording((prev) => !prev)}
              aria-pressed={isRecording}
              aria-label={isRecording ? 'Stop voice input' : 'Start voice input'}
              className={cn(
                'relative flex size-10 shrink-0 items-center justify-center rounded-xl border transition-all duration-200',
                'focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
                isRecording
                  ? 'animate-mic-pulse border-destructive bg-destructive/15 text-destructive'
                  : 'glow-neon border-transparent bg-primary/10 text-primary hover:bg-primary/20',
              )}
            >
              <Mic className="size-5" aria-hidden="true" />
              {isRecording && (
                <span aria-hidden="true" className="absolute top-1.5 right-1.5 size-1.5 rounded-full bg-destructive" />
              )}
            </button>
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              aria-label="Send message"
              className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
            >
              <ArrowUp className="size-5" aria-hidden="true" />
            </button>
          </div>
          <p className="mt-2 text-center font-mono text-[11px] text-muted-foreground">
            {'Enter to send · Shift + Enter for new line · Ollama → OpenAI fallback'}
          </p>
        </form>
      </div>
    </>
  )
}

function ChatMessage({ message }: { message: Message }) {
  if (message.role === 'system') {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-primary/30 bg-primary/5 px-4 py-3 font-mono text-sm text-primary">
        <TerminalSquare className="size-4 shrink-0" aria-hidden="true" />
        <span className="text-glow">{message.content}</span>
      </div>
    )
  }

  const isUser = message.role === 'user'
  const isError = message.role === 'error'

  return (
    <div className={cn('flex gap-3', isUser && 'flex-row-reverse')}>
      <div
        className={cn(
          'flex size-8 shrink-0 items-center justify-center rounded-lg',
          isUser ? 'bg-secondary text-foreground' : 'glow-neon bg-primary/10 text-primary',
          isError && 'bg-destructive/10 text-destructive shadow-none',
        )}
      >
        {isUser ? <User className="size-4" aria-hidden="true" /> : <Bot className="size-4" aria-hidden="true" />}
        <span className="sr-only">{isUser ? 'You' : isError ? 'Error' : 'Assistant'}</span>
      </div>
      <div
        className={cn(
          'max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap',
          isUser ? 'bg-secondary text-secondary-foreground' : 'bg-transparent text-foreground',
          isError && 'border border-destructive/40 bg-destructive/10 text-destructive',
        )}
      >
        {message.content}
      </div>
    </div>
  )
}

function ThinkingIndicator() {
  return (
    <div className="flex gap-3" role="status">
      <div className="glow-neon flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Bot className="size-4 animate-pulse" aria-hidden="true" />
      </div>
      <div className="flex items-center gap-3 rounded-2xl px-4 py-3">
        <div className="flex gap-1.5" aria-hidden="true">
          {[0, 150, 300].map((delay) => (
            <span
              key={delay}
              className="size-2 animate-bounce rounded-full bg-primary"
              style={{ animationDelay: `${delay}ms` }}
            />
          ))}
        </div>
        <span className="font-mono text-xs text-muted-foreground">AI core is thinking...</span>
      </div>
    </div>
  )
}
