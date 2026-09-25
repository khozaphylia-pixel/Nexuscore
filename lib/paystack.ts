export type PaystackCurrency = 'ZAR' | 'USD' | 'GHS' | 'NGN' | 'KES'

export type PaystackResponse = {
  reference: string
  status: string
  trans: string
  transaction: string
  message: string
}

export type PaystackConfig = {
  key: string
  email: string
  amount: number
  currency: PaystackCurrency
  ref: string
  metadata?: {
    custom_fields?: { display_name: string; variable_name: string; value: string }[]
    plan?: string
  }
  onSuccess: (response: PaystackResponse) => void
  onClose: () => void
}

declare global {
  interface Window {
    PaystackPop?: {
      setup: (config: PaystackConfig) => { openIframe: () => void }
    }
  }
}

const SCRIPT_SRC = 'https://js.paystack.co/v1/inline.js'
let scriptPromise: Promise<void> | null = null

export function loadPaystackScript(): Promise<void> {
  if (typeof window === 'undefined') return Promise.reject(new Error('Browser only'))
  if (window.PaystackPop) return Promise.resolve()
  if (scriptPromise) return scriptPromise

  scriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = SCRIPT_SRC
    script.async = true
    script.onload = () => {
      if (window.PaystackPop) resolve()
      else reject(new Error('Paystack script loaded but PaystackPop not found'))
    }
    script.onerror = () => {
      scriptPromise = null
      reject(new Error('Failed to load Paystack inline script'))
    }
    document.head.appendChild(script)
  })
  return scriptPromise
}

export function generateReference(prefix = 'PHYLIA'): string {
  const ts = Date.now().toString(36)
  const rand = Math.random().toString(36).slice(2, 8)
  return `${prefix}_${ts}${rand}`.toUpperCase()
}

export function getPaystackKey(): string {
  const key = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY
  if (!key) throw new Error('NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY is not set')
  return key
}
