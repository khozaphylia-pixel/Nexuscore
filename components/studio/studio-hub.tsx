'use client'

import { useCallback, useState } from 'react'
import { ShieldCheck, X } from 'lucide-react'
import { SubscriptionModal, type Tier } from './subscription-modal'
import { AuthModal, type AuthView } from './auth-modal'
import { cn } from '@/lib/utils'
import { ACCENT_THEMES, type AccentThemeId } from '@/lib/accent-themes'
import { Sidebar, type StudioTab } from './sidebar'
import { ChatEngine } from './chat-engine'
import { VideoStudio } from './video-studio'
import { GpsSearch } from './gps-search'

export function StudioHub() {
  const [activeTab, setActiveTab] = useState<StudioTab>('chat')
  const [accent, setAccent] = useState<AccentThemeId>('gold')
  const [temporaryChat, setTemporaryChat] = useState(false)
  const [tiersOpen, setTiersOpen] = useState(false)
  const [authOpen, setAuthOpen] = useState(false)
  const [authView, setAuthView] = useState<AuthView>('signup')
  const [activeTier, setActiveTier] = useState<Tier | null>(null)
  const [showVerifyBanner, setShowVerifyBanner] = useState(false)

  const openTiers = useCallback(() => setTiersOpen(true), [])
  const closeTiers = useCallback(() => setTiersOpen(false), [])
  const openAuth = useCallback(() => setAuthOpen(true), [])
  const closeAuth = useCallback(() => setAuthOpen(false), [])

  const handlePaymentSuccess = useCallback((tier: Tier) => {
    setActiveTier(tier)
    setShowVerifyBanner(true)
  }, [])

  const dismissBanner = useCallback(() => setShowVerifyBanner(false), [])

  function handleAccentChange(id: AccentThemeId) {
    const theme = ACCENT_THEMES.find((t) => t.id === id)
    if (!theme) return
    const root = document.documentElement.style
    root.setProperty('--neon', theme.color)
    root.setProperty('--neon-foreground', theme.foreground)
    setAccent(id)
  }

  return (
    <div className="flex min-h-dvh bg-background">
      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        accent={accent}
        onAccentChange={handleAccentChange}
        temporaryChat={temporaryChat}
        onTemporaryChatChange={setTemporaryChat}
        onOpenTiers={openTiers}
        onOpenAuth={openAuth}
        activeTier={activeTier}
      />
      <SubscriptionModal open={tiersOpen} onClose={closeTiers} email="you@phylia.dev" onSuccess={handlePaymentSuccess} />
      <AuthModal open={authOpen} view={authView} onViewChange={setAuthView} onClose={closeAuth} />
      {showVerifyBanner && activeTier && (
        <VerifyBanner tier={activeTier} onDismiss={dismissBanner} />
      )}
      <main className="relative flex min-w-0 flex-1 flex-col">
        <section
          id="panel-chat"
          role="tabpanel"
          aria-labelledby="tab-chat"
          hidden={activeTab !== 'chat'}
          className={cn(
            'flex h-dvh flex-col',
            activeTab === 'chat' && 'animate-in fade-in slide-in-from-bottom-2 duration-300',
          )}
        >
          <ChatEngine temporaryChat={temporaryChat} />
        </section>
        <section
          id="panel-video"
          role="tabpanel"
          aria-labelledby="tab-video"
          hidden={activeTab !== 'video'}
          className={cn(
            'min-h-dvh',
            activeTab === 'video' && 'animate-in fade-in slide-in-from-bottom-2 duration-300',
          )}
        >
          <VideoStudio />
        </section>
        {activeTab === 'gps' && (
          <section
            id="panel-gps"
            role="tabpanel"
            aria-labelledby="tab-gps"
            className="animate-in fade-in slide-in-from-bottom-2 flex h-dvh flex-col duration-300"
          >
            <GpsSearch />
          </section>
        )}
      </main>
    </div>
  )
}

function VerifyBanner({ tier, onDismiss }: { tier: Tier; onDismiss: () => void }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="animate-verify-banner fixed top-4 right-4 z-50 w-[calc(100vw-2rem)] max-w-sm"
    >
      <div className="glow-verify flex items-start gap-3 rounded-xl border border-primary/45 bg-card/95 p-4 backdrop-blur-md">
        <span className="glow-verify-icon flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
          <ShieldCheck className="size-5" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-liquid-gold">Payment Verified</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {tier.name} activated. Infinite processing modes unlocked.
          </p>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss verification banner"
          className="shrink-0 rounded-md p-1 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        >
          <X className="size-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  )
}
