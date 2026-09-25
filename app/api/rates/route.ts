import { FALLBACK_RATES, type RatesResponse } from '@/lib/currency'

export async function GET() {
  try {
    const res = await fetch('https://open.er-api.com/v6/latest/ZAR', {
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(6000),
    })
    if (!res.ok) throw new Error(`Rates request failed: ${res.status}`)
    const data = (await res.json()) as {
      result: string
      rates: Record<string, number>
      time_last_update_utc?: string
    }
    if (data.result !== 'success' || !data.rates.USD || !data.rates.GBP) throw new Error('Invalid rates payload')

    const body: RatesResponse = {
      base: 'ZAR',
      rates: { ZAR: 1, USD: data.rates.USD, GBP: data.rates.GBP },
      updatedAt: data.time_last_update_utc ?? null,
      live: true,
    }
    return Response.json(body)
  } catch {
    const body: RatesResponse = { base: 'ZAR', rates: FALLBACK_RATES, updatedAt: null, live: false }
    return Response.json(body)
  }
}
