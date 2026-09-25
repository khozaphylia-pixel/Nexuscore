'use client'

import { useState } from 'react'
import { Info, Lock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Modal } from './modal'

export type AuthView = 'signup' | 'login'

type AuthModalProps = {
  open: boolean
  view: AuthView
  onViewChange: (view: AuthView) => void
  onClose: () => void
}

export function AuthModal({ open, view, onViewChange, onClose }: AuthModalProps) {
  return (
    <Modal open={open} onClose={onClose} labelledBy="auth-title" className="max-w-md">
      <div className="p-6 sm:p-8">
        <div className="mb-6 flex size-11 items-center justify-center rounded-xl bg-primary/15 text-primary glow-neon">
          <Lock className="size-5" aria-hidden="true" />
        </div>
        <h2 id="auth-title" className="text-xl font-semibold text-balance text-foreground">
          {view === 'signup' ? 'Create your workspace account' : 'Welcome back'}
        </h2>
        <p className="mt-1.5 text-sm text-muted-foreground">
          {view === 'signup' ? 'Sign up to unlock subscription tiers and credits.' : 'Sign in to continue to your studio.'}
        </p>

        <div role="tablist" aria-label="Account mode" className="mt-6 grid grid-cols-2 rounded-lg bg-secondary p-1">
          {(['signup', 'login'] as const).map((v) => (
            <button
              key={v}
              type="button"
              role="tab"
              aria-selected={view === v}
              onClick={() => onViewChange(v)}
              className={cn(
                'rounded-md py-2 text-sm font-medium transition-all focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
                view === v ? 'bg-card text-foreground shadow' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {v === 'signup' ? 'Sign Up' : 'Sign In'}
            </button>
          ))}
        </div>

        {view === 'signup' ? <SignUpForm key="signup" /> : <LoginForm key="login" />}
      </div>
    </Modal>
  )
}

function Field({
  id,
  label,
  type = 'text',
  autoComplete,
}: {
  id: string
  label: string
  type?: string
  autoComplete?: string
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-xs font-medium text-muted-foreground">
        {label}
      </label>
      <input
        id={id}
        name={id}
        type={type}
        required
        autoComplete={autoComplete}
        minLength={type === 'password' ? 8 : undefined}
        className="h-11 rounded-lg border border-input bg-background px-3.5 text-sm text-foreground transition-shadow outline-none placeholder:text-muted-foreground focus:border-primary focus:shadow-[0_0_0_3px_color-mix(in_oklab,var(--neon)_25%,transparent)]"
      />
    </div>
  )
}

function BackendNotice() {
  return (
    <p role="status" className="flex items-start gap-2 rounded-lg border border-border bg-secondary/60 p-3 text-xs text-muted-foreground">
      <Info className="mt-0.5 size-3.5 shrink-0 text-primary" aria-hidden="true" />
      Form validated. Accounts will be created once an authentication backend is connected to this workspace.
    </p>
  )
}

function SignUpForm() {
  const [error, setError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const data = new FormData(e.currentTarget)
    if (data.get('signup-password') !== data.get('signup-confirm')) {
      setError('Passwords do not match.')
      setSubmitted(false)
      return
    }
    setError(null)
    setSubmitted(true)
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
      <Field id="signup-name" label="Full name" autoComplete="name" />
      <Field id="signup-email" label="Email" type="email" autoComplete="email" />
      <Field id="signup-password" label="Password" type="password" autoComplete="new-password" />
      <Field id="signup-confirm" label="Confirm password" type="password" autoComplete="new-password" />
      {error && (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      )}
      {submitted && <BackendNotice />}
      <button
        type="submit"
        className="glow-neon mt-2 h-11 rounded-lg bg-primary text-sm font-semibold text-primary-foreground transition-all hover:brightness-110 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card focus-visible:outline-none"
      >
        Create Account
      </button>
    </form>
  )
}

function LoginForm() {
  const [submitted, setSubmitted] = useState(false)

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        setSubmitted(true)
      }}
      className="mt-6 flex flex-col gap-4"
    >
      <Field id="login-email" label="Email" type="email" autoComplete="email" />
      <Field id="login-password" label="Password" type="password" autoComplete="current-password" />
      <div className="flex items-center justify-between">
        <label className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
          <input type="checkbox" name="remember" className="size-4 rounded accent-(--neon)" />
          Remember me
        </label>
        <a href="#forgot-password" className="text-sm text-primary underline-offset-4 hover:underline">
          Forgot Password?
        </a>
      </div>
      {submitted && <BackendNotice />}
      <button
        type="submit"
        className="glow-neon mt-2 h-11 rounded-lg bg-primary text-sm font-semibold text-primary-foreground transition-all hover:brightness-110 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card focus-visible:outline-none"
      >
        Secure Sign In
      </button>
    </form>
  )
}
