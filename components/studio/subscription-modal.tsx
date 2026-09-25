'use client'

import { useEffect, useState } from 'react'
import useSWR from 'swr'
import { ArrowLeftRight, Building2, Check, CreditCard, Loader as Loader2, Rocket, ShieldCheck, Sparkles, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  CURRENCIES,
  FALLBACK_RATES,
  PAYSTACK_SETTLEMENT_CURRENCIES,
  convertFromZar,
  formatMoney,
  type CurrencyCode,
  type RatesResponse,
} from '@/lib/currency'
import {
  generateReference,
  getPaystackKey,
  loadPaystackScript,
  type PaystackCurrency,
  type PaystackResponse,
} from '@/lib/paystack'
import { Modal } from './modal'

export type Tier = {
  id: string
  name: string
  tagline: string
  priceZar: number
  credits: string
  features: string[]
  icon: typeof Sparkles
  popular?: boolean
}

const TIERS: Tier[] = [
  {
    id: 'free',
    name: 'Free Trial Tier',
    tagline: '1-Month Free Access Trial',
    priceZar: 0,
    credits: '60 credits',
    features: ['60 complimentary credits', 'Text chat engine access', 'Layout compiler testing'],
    icon: Sparkles,
  },
  {
    id: 'pro',
    name: 'Pro Developer Tier',
    tagline: 'Individual Growth Matrix',
    priceZar: 250,
    credits: '1,500 credits / mo',
    features: ['1,500 monthly credits', 'Video production studio', 'GPS search engine', 'Priority local queue'],
    icon: Rocket,
    popular: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise Tier',
    tagline: 'Corporate Infinite Deck',
    priceZar: 1200,
    credits: 'Unlimited',
    features: ['Unlimited processing', 'Isolated security tunnels', 'Team workspaces', 'Dedicated support'],
    icon: Building2,
  },
]

const fetcher = (url: string) => fetch(url).then((r) => r.json() as Promise<RatesResponse>)

type SubscriptionModalProps = {
  open: boolean
  onClose: () => void
  email: string
  onSuccess: (tier: Tier) => void
}

export function SubscriptionModal({ open, onClose, email, onSuccess }: SubscriptionModalProps) {
  const [currency, setCurrency] = useState<CurrencyCode>('ZAR')
  const [checkoutTier, setCheckoutTier] = useState<Tier | null>(null)
  const { data } = useSWR(open ? '/api/rates' : null, fetcher, { revalidateOnFocus: false })
  const rates = data?.rates ?? FALLBACK_RATES

  function handleClose() {
    setCheckoutTier(null)
    onClose()
  }

  return (
    <Modal open={open} onClose={handleClose} labelledBy="tiers-title" className="max-w-5xl">
      <div className="p-6 sm:p-10">
        <div className="flex flex-col gap-6 pr-8 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[10px] tracking-[0.4em] text-primary uppercase">Membership</p>
            <h2
              id="tiers-title"
              className="mt-2 font-serif text-3xl font-medium tracking-wide text-balance text-foreground sm:text-4xl"
            >
              Manage Subscription Tiers
            </h2>
            <p className="mt-2 text-sm tracking-wide text-muted-foreground">
              Select your membership. Prices convert live between currencies.
            </p>
          </div>
          <CurrencySwitcher currency={currency} onChange={setCurrency} />
        </div>

        <RateTicker currency={currency} data={data} />

        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {TIERS.map((tier) => (
            <TierCard
              key={tier.id}
              tier={tier}
              price={convertFromZar(tier.priceZar, currency, rates)}
              currency={currency}
              onSubscribe={() => setCheckoutTier(tier)}
            />
          ))}
        </div>
      </div>

      {checkoutTier && (
        <PaystackOverlay
          key={`${checkoutTier.id}-${currency}`}
          tier={checkoutTier}
          currency={currency}
          rates={rates}
          email={email}
          onSuccess={(tier) => {
            onSuccess(tier)
            setCheckoutTier(null)
          }}
          onDismiss={() => setCheckoutTier(null)}
        />
      )}
    </Modal>
  )
}

function CurrencySwitcher({ currency, onChange }: { currency: CurrencyCode; onChange: (c: CurrencyCode) => void }) {
  return (
    <div
      role="radiogroup"
      aria-label="Display currency"
      className="gold-rim relative flex shrink-0 items-stretch rounded-full bg-[radial-gradient(circle_at_50%_0%,#141821,#05070d_70%)] p-1"
    >
      {CURRENCIES.map((c, i) => {
        const selected = c.code === currency
        return (
          <button
            key={c.code}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(c.code)}
            className={cn(
              'relative flex min-w-18 flex-col items-center rounded-full px-4 py-1.5 transition-all duration-500 focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none',
              i > 0 &&
                'before:absolute before:top-1/2 before:left-0 before:h-4 before:w-px before:-translate-y-1/2 before:bg-primary/20',
              selected
                ? 'bg-[linear-gradient(180deg,rgba(212,175,55,0.16),rgba(212,175,55,0.04))] shadow-[inset_0_0_0_1px_rgba(212,175,55,0.45)] before:opacity-0'
                : 'hover:bg-foreground/[0.03]',
            )}
          >
            <span
              className={cn(
                'font-serif text-xl leading-none transition-colors duration-500',
                selected ? 'text-liquid-gold' : 'text-muted-foreground',
              )}
            >
              {c.symbol}
            </span>
            <span
              className={cn(
                'mt-1 text-[9px] tracking-[0.3em] transition-colors duration-500',
                selected ? 'text-primary' : 'text-muted-foreground/70',
              )}
            >
              {c.code}
            </span>
          </button>
        )
      })}
    </div>
  )
}

function RateTicker({ currency, data }: { currency: CurrencyCode; data?: RatesResponse }) {
  const rates = data?.rates ?? FALLBACK_RATES
  const others = CURRENCIES.filter((c) => c.code !== 'ZAR')
  return (
    <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 border-y border-border py-3 font-mono text-[11px] tracking-wide text-muted-foreground">
      <span className="flex items-center gap-1.5 text-foreground">
        <ArrowLeftRight className="size-3.5 text-primary" aria-hidden="true" />
        Exchange
      </span>
      {others.map((c) => (
        <span key={c.code} className={cn(currency === c.code && 'text-primary')}>
          {'R1 = '}
          {c.symbol}
          {rates[c.code].toFixed(4)}
        </span>
      ))}
      <span className="ml-auto flex items-center gap-1.5">
        <span className={cn('size-1.5 rounded-full', data?.live ? 'bg-primary' : 'bg-muted-foreground')} />
        {!data ? 'Loading rates' : data.live ? 'Live rates' : 'Offline estimate'}
      </span>
    </div>
  )
}

function TierCard({
  tier,
  price,
  currency,
  onSubscribe,
}: {
  tier: Tier
  price: number
  currency: CurrencyCode
  onSubscribe: () => void
}) {
  const Icon = tier.icon
  const free = tier.priceZar === 0
  return (
    <article
      className={cn(
        'group relative flex flex-col rounded-lg border p-1.5 transition-colors duration-500',
        tier.popular
          ? 'border-primary/45 bg-[linear-gradient(170deg,color-mix(in_oklab,var(--emerald)_35%,var(--card)),var(--card)_60%)]'
          : 'border-border bg-card hover:border-primary/30',
      )}
    >
      <div
        className={cn(
          'flex flex-1 flex-col items-center rounded-md border px-5 pt-8 pb-5 text-center',
          tier.popular ? 'border-primary/25' : 'border-foreground/[0.05]',
        )}
      >
        {tier.popular ? (
          <p className="text-[9px] tracking-[0.45em] text-primary uppercase">By Invitation</p>
        ) : (
          <p className="text-[9px] tracking-[0.45em] text-muted-foreground/70 uppercase">Membership</p>
        )}
        <Icon className="mt-5 size-5 text-primary" strokeWidth={1.25} aria-hidden="true" />
        <h3 className="mt-4 font-serif text-2xl leading-tight font-medium tracking-wide text-foreground">
          {tier.name}
        </h3>
        <p className="mt-1 text-[11px] tracking-[0.2em] text-muted-foreground uppercase">{tier.tagline}</p>

        <div className="my-6 flex w-full items-center gap-3" aria-hidden="true">
          <span className="h-px flex-1 bg-gradient-to-r from-transparent to-primary/40" />
          <span className="size-1 rotate-45 bg-primary/70" />
          <span className="h-px flex-1 bg-gradient-to-l from-transparent to-primary/40" />
        </div>

        <p className="flex items-baseline gap-1.5">
          <span className="text-liquid-gold font-serif text-5xl leading-none font-medium tabular-nums">
            {formatMoney(price, currency)}
          </span>
        </p>
        <p className="mt-2 text-[11px] tracking-[0.25em] text-muted-foreground uppercase">
          {free ? 'for 30 days' : 'per month'}
        </p>
        {currency !== 'ZAR' && !free && (
          <p className="mt-1 font-mono text-[10px] text-muted-foreground/70">{`≈ R${tier.priceZar.toLocaleString('en-ZA')} ZAR`}</p>
        )}
        <p className="mt-4 text-xs tracking-[0.15em] text-primary">{tier.credits}</p>

        <ul className="mt-6 flex w-full flex-1 flex-col gap-3 text-left">
          {tier.features.map((f) => (
            <li key={f} className="flex items-start gap-3 text-sm tracking-wide text-foreground/75">
              <Check className="mt-0.5 size-3.5 shrink-0 text-primary" strokeWidth={1.5} aria-hidden="true" />
              {f}
            </li>
          ))}
        </ul>

        {free ? (
          <p className="mt-8 flex h-11 w-full items-center justify-center rounded-full border border-foreground/10 text-[11px] tracking-[0.3em] text-muted-foreground uppercase">
            Current plan
          </p>
        ) : (
          <button
            type="button"
            onClick={onSubscribe}
            className={cn(
              'mt-8 flex h-11 w-full items-center justify-center gap-2 rounded-full text-[11px] font-medium tracking-[0.25em] uppercase transition-all duration-500 focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card focus-visible:outline-none',
              tier.popular
                ? 'bg-[linear-gradient(115deg,#b8962e,#f0d77f_45%,#c9a33a)] text-primary-foreground hover:brightness-110'
                : 'border border-primary/40 text-primary hover:border-primary hover:bg-primary/[0.06]',
            )}
          >
            <CreditCard className="size-3.5" strokeWidth={1.5} aria-hidden="true" />
            Subscribe via Paystack
          </button>
        )}
      </div>
    </article>
  )
}

type OverlayStatus = 'loading' | 'open' | 'success' | 'error'

function PaystackOverlay({
  tier,
  currency,
  rates,
  email,
  onSuccess,
  onDismiss,
}: {
  tier: Tier
  currency: CurrencyCode
  rates: RatesResponse['rates']
  email: string
  onSuccess: (tier: Tier) => void
  onDismiss: () => void
}) {
  const [status, setStatus] = useState<OverlayStatus>('loading')
  const [error, setError] = useState<string | null>(null)
  const [response, setResponse] = useState<PaystackResponse | null>(null)

  const settlement: CurrencyCode = PAYSTACK_SETTLEMENT_CURRENCIES.includes(currency) ? currency : 'ZAR'
  const amountMinor = Math.round(convertFromZar(tier.priceZar, settlement, rates) * 100)
  const ref = generateReference()

  const params: [string, string][] = [
    ['email', email],
    ['amount', `${amountMinor.toLocaleString('en-US')} (${settlement === 'ZAR' ? 'cents' : 'minor units'})`],
    ['currency', settlement],
    ['plan', tier.id],
    ['reference', ref],
  ]

  useEffect(() => {
    let cancelled = false
    setError(null)

    loadPaystackScript()
      .then(() => {
        if (cancelled) return
        const key = getPaystackKey()
        const handler = window.PaystackPop!.setup({
          key,
          email,
          amount: amountMinor,
          currency: settlement as PaystackCurrency,
          ref,
          metadata: {
            custom_fields: [
              { display_name: 'Plan', variable_name: 'plan', value: tier.id },
              { display_name: 'Tier', variable_name: 'tier', value: tier.name },
            ],
            plan: tier.id,
          },
          onSuccess: (res) => {
            if (cancelled) return
            setResponse(res)
            setStatus('success')
            console.log(
              '%c✓ PAYSTACK VERIFICATION — Transaction Successful',
              'color:#d4af37;font-weight:bold;font-size:14px;text-shadow:0 0 8px rgba(212,175,55,0.6);',
            )
            console.log(
              `%c  Reference: ${res.reference}\n  Status: ${res.status}\n  Transaction: ${res.transaction}\n  Plan: ${tier.id} (${tier.name})\n  Amount: ${(amountMinor / 100).toFixed(2)} ${settlement}`,
              'color:#f3dc8a;font-size:12px;',
            )
          },
          onClose: () => {
            if (cancelled || status === 'success') return
            setStatus((prev) => (prev === 'success' ? prev : 'error'))
            setError('Checkout was closed before payment completed.')
          },
        })
        handler.openIframe()
        setStatus('open')
      })
      .catch((err) => {
        if (cancelled) return
        setError(err instanceof Error ? err.message : 'Failed to load Paystack.')
        setStatus('error')
      })

    return () => {
      cancelled = true
    }
  }, [tier.id, tier.name, email, amountMinor, settlement, ref])

  if (status === 'success' && response) {
    return (
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="paystack-success-title"
        className="animate-in fade-in absolute inset-0 z-20 flex items-center justify-center rounded-2xl bg-card/95 p-6 backdrop-blur-md duration-200"
      >
        <div className="w-full max-w-sm">
          <div className="flex items-center gap-3">
            <span className="glow-verify flex size-10 items-center justify-center rounded-full bg-primary/15 text-primary">
              <ShieldCheck className="size-5" aria-hidden="true" />
            </span>
            <div>
              <h3 id="paystack-success-title" className="text-base font-semibold text-liquid-gold">
                Payment Verified
              </h3>
              <p className="text-xs text-muted-foreground">{tier.name} — subscription activated</p>
            </div>
          </div>

          <dl className="mt-5 overflow-hidden rounded-lg border border-primary/30 bg-background font-mono text-xs glow-verify-soft">
            <div className="flex justify-between gap-4 border-b border-border px-3 py-2">
              <dt className="text-muted-foreground">Reference</dt>
              <dd className="truncate text-foreground">{response.reference}</dd>
            </div>
            <div className="flex justify-between gap-4 border-b border-border px-3 py-2">
              <dt className="text-muted-foreground">Status</dt>
              <dd className="text-primary">{response.status}</dd>
            </div>
            <div className="flex justify-between gap-4 border-b border-border px-3 py-2">
              <dt className="text-muted-foreground">Transaction</dt>
              <dd className="truncate text-foreground">{response.transaction}</dd>
            </div>
            <div className="flex justify-between gap-4 px-3 py-2">
              <dt className="text-muted-foreground">Amount</dt>
              <dd className="text-liquid-gold">{(amountMinor / 100).toFixed(2)} {settlement}</dd>
            </div>
          </dl>

          <button
            type="button"
            onClick={() => onSuccess(tier)}
            className="mt-5 h-10 w-full rounded-lg bg-[linear-gradient(115deg,#b8962e,#f0d77f_45%,#c9a33a)] text-sm font-medium text-primary-foreground transition-all hover:brightness-110 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          >
            Unlock Dashboard
          </button>
        </div>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="paystack-error-title"
        className="animate-in fade-in absolute inset-0 z-20 flex items-center justify-center rounded-2xl bg-card/95 p-6 backdrop-blur-md duration-200"
      >
        <div className="w-full max-w-sm">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-full bg-destructive/15 text-destructive">
              <X className="size-5" aria-hidden="true" />
            </span>
            <div>
              <h3 id="paystack-error-title" className="text-base font-semibold text-foreground">
                Checkout failed
              </h3>
              <p className="text-xs text-muted-foreground">{tier.name}</p>
            </div>
          </div>

          <p className="mt-4 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error ?? 'Payment could not be completed.'}
          </p>

          <button
            type="button"
            onClick={onDismiss}
            className="mt-5 h-10 w-full rounded-lg border border-border text-sm font-medium text-foreground transition-colors hover:bg-secondary focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          >
            Back to plans
          </button>
        </div>
      </div>
    )
  }

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="paystack-loading-title"
      className="animate-in fade-in absolute inset-0 z-20 flex items-center justify-center rounded-2xl bg-card/95 p-6 backdrop-blur-md duration-200"
    >
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-full bg-primary/15 text-primary glow-neon">
            <Loader2 className="size-5 animate-spin" aria-hidden="true" />
          </span>
          <div>
            <h3 id="paystack-loading-title" className="text-base font-semibold text-foreground">
              Connecting to Paystack
            </h3>
            <p className="text-xs text-muted-foreground">{tier.name}</p>
          </div>
        </div>

        <dl className="mt-5 overflow-hidden rounded-lg border border-border bg-background font-mono text-xs">
          {params.map(([k, v]) => (
            <div
              key={k}
              className="flex justify-between gap-4 border-b border-border px-3 py-2 last:border-0"
            >
              <dt className="text-muted-foreground">{k}</dt>
              <dd className="truncate text-foreground">{v}</dd>
            </div>
          ))}
        </dl>
        {settlement !== currency && (
          <p className="mt-2 text-[11px] text-muted-foreground">
            {`Paystack settles ${currency} payments in ZAR. You'll be charged the rand equivalent.`}
          </p>
        )}

        <button
          type="button"
          onClick={onDismiss}
          className="mt-5 h-10 w-full rounded-lg border border-border text-sm font-medium text-foreground transition-colors hover:bg-secondary focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}
