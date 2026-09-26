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

function builtInReply(prompt: string): string {
  const lower = prompt.toLowerCase()

  if (/^(hi|hello|hey|yo|sup|greetings)/.test(lower)) {
    return "Hello! I'm your AI Studio assistant. I can help you with questions about this dashboard, the video studio, GPS search, subscriptions, and more. What would you like to know?"
  }

  if (lower.includes('who are you') || lower.includes('what are you') || lower.includes('your name')) {
    return "I'm the built-in assistant for your AI Studio Dashboard. When a local Ollama server or an OpenAI key is available, I use those for richer responses. Right now I'm running in built-in mode, so I can handle common questions about the dashboard directly."
  }

  if (lower.includes('video') || lower.includes('studio')) {
    return 'The Video Studio lets you create and render video projects. You can compose scenes, add overlays, and export your final video. Use the sidebar to switch to the Video Studio tab and start a new project.'
  }

  if (lower.includes('gps') || lower.includes('map') || lower.includes('location') || lower.includes('search')) {
    return 'The GPS Search tool lets you find places by name or address. Search results appear on an interactive map. Switch to the GPS tab in the sidebar to try it.'
  }

  if (lower.includes('subscription') || lower.includes('plan') || lower.includes('tier') || lower.includes('pricing') || lower.includes('pay') || lower.includes('subscribe')) {
    return 'You can choose from three tiers: Free Trial (60 credits for 30 days), Pro Developer (1,500 credits/month, R250/mo), and Enterprise (unlimited, R1,200/mo). Payment is handled securely through Paystack. Open the subscription modal from the sidebar to subscribe.'
  }

  if (lower.includes('currency') || lower.includes('rate') || lower.includes('exchange') || lower.includes('zar') || lower.includes('usd') || lower.includes('gbp')) {
    return 'The dashboard supports ZAR, USD, and GBP. Exchange rates update live from the rates API, with a fallback estimate when offline. Prices on the subscription tiers convert automatically based on your selected currency.'
  }

  if (lower.includes('paystack')) {
    return 'Paystack handles all subscription payments on this dashboard. It supports multiple currencies and settles in ZAR by default. Your test key is currently configured, so you can test the checkout flow without real charges.'
  }

  if (lower.includes('credit')) {
    return 'Credits are used when you interact with the AI tools like the chat engine, video studio, and GPS features. Each tier includes a different monthly credit allowance. The Free Trial gives you 60 credits to explore with.'
  }

  if (lower.includes('thank')) {
    return "You're welcome! Let me know if you need anything else."
  }

  if (lower.includes('help') || lower.includes('what can you do') || lower.includes('features')) {
    return [
      'Here are the main features of your AI Studio Dashboard:',
      '',
      '• Chat Engine — ask me questions, anytime',
      '• Video Studio — create and render video projects',
      '• GPS Search — find places on an interactive map',
      '• Subscriptions — manage tiers and pay via Paystack',
      '• Live currency conversion between ZAR, USD, and GBP',
      '',
      'What would you like to explore?',
    ].join('\n')
  }

  const fallbacks = [
    "That's a great question! I'm currently running in built-in mode (no Ollama or OpenAI connected). I can help with topics like the video studio, GPS search, subscriptions, currency, and Paystack payments. Could you rephrase or ask about one of those?",
    "I'd love to give you a detailed answer, but I'm in built-in mode right now without a connected AI service. I can assist with dashboard features — try asking about the video studio, GPS, subscriptions, or payments.",
    "Interesting! While I'm in built-in mode, my responses are limited to dashboard-related topics. Ask me about the video studio, GPS search, subscription tiers, currency conversion, or Paystack and I can help directly.",
  ]
  return fallbacks[Math.floor(Math.random() * fallbacks.length)]
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
    if (err instanceof Error && err.message !== 'no-openai-key') {
      return NextResponse.json(
        { error: 'AI service is temporarily unavailable.' },
        { status: 502 },
      )
    }
    // No OpenAI key — fall through to built-in
  }

  // Built-in fallback: always gives a helpful answer without any external service
  return NextResponse.json({ response: builtInReply(prompt), source: 'builtin' })
}
