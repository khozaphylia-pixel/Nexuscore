import { NextResponse, type NextRequest } from 'next/server'

const OLLAMA_URL = process.env.OLLAMA_URL ?? 'http://localhost:11434/api/generate'
const OLLAMA_MODEL = process.env.OLLAMA_MODEL ?? 'qwen2.5:1.5b'
const OPENAI_URL = 'https://api.openai.com/v1/chat/completions'
const OPENAI_MODEL = process.env.OPENAI_MODEL ?? 'gpt-4o-mini'

type ChatMessage = { role: 'system' | 'user' | 'assistant'; content: string }

async function tryOllama(prompt: string): Promise<string> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 8000)
  try {
    const res = await fetch(OLLAMA_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: OLLAMA_MODEL, prompt, stream: false }),
      signal: controller.signal,
    })
    if (!res.ok) throw new Error(`Ollama ${res.status}`)
    const data = (await res.json()) as { response?: string }
    return data.response?.trim() ?? ''
  } finally {
    clearTimeout(timeout)
  }
}

async function tryOpenAI(messages: ChatMessage[]): Promise<string> {
  const key = process.env.OPENAI_API_KEY
  if (!key) throw new Error('no-openai-key')
  const res = await fetch(OPENAI_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({ model: OPENAI_MODEL, messages, stream: false }),
  })
  if (!res.ok) throw new Error(`OpenAI ${res.status}`)
  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[]
  }
  return data.choices?.[0]?.message?.content?.trim() ?? ''
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as { prompt?: string } | null
  const prompt = body?.prompt?.trim()
  if (!prompt) {
    return NextResponse.json({ error: 'Prompt is required.' }, { status: 400 })
  }

  const messages: ChatMessage[] = [
    { role: 'system', content: 'You are a helpful assistant in a cyber AI studio dashboard. Keep responses concise and friendly.' },
    { role: 'user', content: prompt },
  ]

  // Try local Ollama first (works when running locally with ollama serve)
  try {
    const reply = await tryOllama(prompt)
    if (reply) return NextResponse.json({ response: reply, source: 'ollama' })
  } catch {
    // Ollama unavailable — fall through to OpenAI
  }

  // Fall back to OpenAI if a key is configured
  try {
    const reply = await tryOpenAI(messages)
    if (reply) return NextResponse.json({ response: reply, source: 'openai' })
  } catch (err) {
    if (err instanceof Error && err.message === 'no-openai-key') {
      return NextResponse.json(
        {
          response:
            "I couldn't reach a local Ollama server and no OpenAI key is configured. To enable AI chat, either run Ollama locally or add an OpenAI API key.",
          source: 'none',
        },
        { status: 200 },
      )
    }
    return NextResponse.json(
      { error: 'AI service is temporarily unavailable.' },
      { status: 502 },
    )
  }

  return NextResponse.json({ response: '(empty response)', source: 'none' })
}
