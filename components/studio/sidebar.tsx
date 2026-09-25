'use client'

import { Check, Clapperboard, Crown, Infinity as InfinityIcon, LogIn, MapPinned, MessagesSquare, ShieldCheck } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ACCENT_THEMES, type AccentThemeId } from '@/lib/accent-themes'
import type { Tier } from './subscription-modal'

export type StudioTab = 'chat' | 'video' | 'gps'

const TABS: { id: StudioTab; label: string; icon: typeof MessagesSquare }[] = [
  { id: 'chat', label: 'Cyber AI Chat Engine', icon: MessagesSquare },
  { id: 'video', label: 'Video Production Studio', icon: Clapperboard },
  { id: 'gps', label: 'GPS Search Engine', icon: MapPinned },
]

type SidebarProps = {
  activeTab: StudioTab
  onTabChange: (tab: StudioTab) => void
  accent: AccentThemeId
  onAccentChange: (accent: AccentThemeId) => void
  temporaryChat: boolean
  onTemporaryChatChange: (value: boolean) => void
  onOpenTiers: () => void
  onOpenAuth: () => void
  activeTier: Tier | null
}

export function Sidebar({
  activeTab,
  onTabChange,
  accent,
  onAccentChange,
  temporaryChat,
  onTemporaryChatChange,
  onOpenTiers,
  onOpenAuth,
  activeTier,
}: SidebarProps) {
  return (
    <aside className="glow-sidebar sticky top-0 flex h-dvh w-18 shrink-0 flex-col border-r border-sidebar-border bg-sidebar transition-[width] duration-300 md:w-72">
      <ProfileHeader />
      <AccountStatus onOpenTiers={onOpenTiers} onOpenAuth={onOpenAuth} activeTier={activeTier} />

      <div className="flex flex-1 flex-col gap-6 overflow-y-auto px-3 pb-6 md:px-4">
        <nav aria-label="Studio sections">
          <SectionLabel>Workspaces</SectionLabel>
          <div role="tablist" aria-orientation="vertical" className="flex flex-col gap-2">
            {TABS.map(({ id, label, icon: Icon }) => {
              const active = activeTab === id
              return (
                <button
                  key={id}
                  id={`tab-${id}`}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  aria-controls={`panel-${id}`}
                  title={label}
                  onClick={() => onTabChange(id)}
                  className={cn(
                    'group relative flex items-center justify-center gap-3 rounded-lg px-3 py-3 text-left text-sm font-medium transition-all duration-200 md:justify-start',
                    'focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
                    active
                      ? 'glow-neon bg-sidebar-accent text-primary'
                      : 'text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground',
                  )}
                >
                  <Icon
                    className={cn('size-5 shrink-0 transition-transform', active && 'scale-110')}
                    aria-hidden="true"
                  />
                  <span className="hidden md:inline">{label}</span>
                  <span className="sr-only md:hidden">{label}</span>
                  {active && (
                    <span
                      aria-hidden="true"
                      className="absolute top-1/2 -left-3 h-5 w-px -translate-y-1/2 bg-primary md:-left-4"
                    />
                  )}
                </button>
              )
            })}
          </div>
        </nav>

        <AccentSwitcher accent={accent} onAccentChange={onAccentChange} />
        <IsolationGuard enabled={temporaryChat} onChange={onTemporaryChatChange} />
      </div>

      <div className="hidden border-t border-sidebar-border px-6 py-4 md:block">
        <p className="text-xs leading-relaxed text-muted-foreground">
          Zero cloud keys. All inference and rendering run on your machine.
        </p>
      </div>
    </aside>
  )
}

function SectionLabel({ children, id }: { children: React.ReactNode; id?: string }) {
  return (
    <p
      id={id}
      className="mb-3 hidden px-2 font-mono text-[10px] tracking-[0.2em] text-muted-foreground uppercase md:block"
    >
      {children}
    </p>
  )
}

function ProfileHeader() {
  return (
    <div className="flex items-center justify-center gap-3 border-b border-sidebar-border px-3 py-5 md:justify-start md:px-5">
      <div className="relative shrink-0">
        <div
          className="gold-rim flex size-11 items-center justify-center rounded-full font-serif text-lg font-medium tracking-[0.12em]"
          aria-hidden="true"
        >
          <span className="text-liquid-gold pl-[0.12em]">PH</span>
        </div>
        <span
          aria-hidden="true"
          className="absolute right-0 bottom-0 size-2.5 rounded-full border-2 border-sidebar bg-privacy"
        />
      </div>
      <div className="hidden min-w-0 md:block">
        <p className="truncate font-serif text-lg leading-tight font-medium tracking-wide text-foreground">Phylia Workspace</p>
        <p className="mt-0.5 flex items-center gap-1.5 truncate font-mono text-[11px] text-muted-foreground">
          <span className="relative flex size-1.5 shrink-0">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-60" />
            <span className="relative inline-flex size-1.5 rounded-full bg-primary" />
          </span>
          NODE: localhost:11434
        </p>
      </div>
      <span className="sr-only md:hidden">Phylia Workspace, node localhost:11434</span>
    </div>
  )
}

function AccountStatus({
  onOpenTiers,
  onOpenAuth,
  activeTier,
}: {
  onOpenTiers: () => void
  onOpenAuth: () => void
  activeTier: Tier | null
}) {
  const tierLabel = activeTier ? activeTier.name : 'Free Trial (29 Days Left)'
  const tierTitle = `Subscription Tier: ${tierLabel}`
  const isPaid = activeTier !== null

  return (
    <div className="flex flex-col items-center gap-2 border-b border-sidebar-border px-3 py-4 md:items-stretch md:px-4">
      <button
        type="button"
        onClick={onOpenTiers}
        title={tierTitle}
        className={cn(
          'flex items-center justify-center gap-2 rounded-lg border px-2.5 py-2 text-left transition-colors hover:bg-primary/15 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none md:justify-start',
          isPaid ? 'glow-verify-soft border-primary/60 bg-primary/15' : 'border-primary/40 bg-primary/10',
        )}
      >
        {isPaid ? (
          <InfinityIcon className="size-4 shrink-0 text-liquid-gold" aria-hidden="true" />
        ) : (
          <Crown className="size-4 shrink-0 text-primary" aria-hidden="true" />
        )}
        <span className="hidden min-w-0 md:block">
          <span className="block font-mono text-[10px] tracking-wider text-muted-foreground uppercase">Subscription Tier</span>
          <span className={cn('block truncate text-xs font-medium', isPaid ? 'text-liquid-gold' : 'text-foreground')}>
            {tierLabel}
          </span>
        </span>
        <span className="sr-only md:hidden">{tierTitle}. Manage Subscription Tiers</span>
      </button>
      <div className="hidden grid-cols-2 gap-2 md:grid">
        <button
          type="button"
          onClick={onOpenTiers}
          className="rounded-md bg-primary px-2 py-1.5 text-xs font-semibold text-primary-foreground transition-all hover:brightness-110 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          Manage Tiers
        </button>
        <button
          type="button"
          onClick={onOpenAuth}
          className="flex items-center justify-center gap-1.5 rounded-md border border-sidebar-border px-2 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-sidebar-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          <LogIn className="size-3.5" aria-hidden="true" />
          Sign In
        </button>
      </div>
      <button
        type="button"
        onClick={onOpenAuth}
        title="Sign In"
        className="rounded-md p-2 text-muted-foreground hover:bg-sidebar-accent hover:text-foreground md:hidden"
      >
        <LogIn className="size-4" aria-hidden="true" />
        <span className="sr-only">Sign In</span>
      </button>
    </div>
  )
}

function AccentSwitcher({
  accent,
  onAccentChange,
}: {
  accent: AccentThemeId
  onAccentChange: (accent: AccentThemeId) => void
}) {
  return (
    <section aria-labelledby="accent-theme-label">
      <SectionLabel id="accent-theme-label">Accent Color Theme</SectionLabel>
      <span className="sr-only md:hidden">Accent Color Theme</span>
      <div
        role="radiogroup"
        aria-labelledby="accent-theme-label"
        className="flex flex-col items-center gap-3 rounded-xl border border-sidebar-border bg-card/40 p-3 md:grid md:grid-cols-4 md:gap-2"
      >
        {ACCENT_THEMES.map((theme) => {
          const selected = theme.id === accent
          return (
            <button
              key={theme.id}
              type="button"
              role="radio"
              aria-checked={selected}
              aria-label={theme.label}
              title={theme.label}
              onClick={() => onAccentChange(theme.id)}
              className="group flex flex-col items-center gap-1.5 rounded-lg focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            >
              <span
                className={cn(
                  'flex size-7 items-center justify-center rounded-full transition-all duration-300 group-hover:scale-105',
                  selected && 'ring-1 ring-foreground/60 ring-offset-2 ring-offset-sidebar',
                )}
                style={{ backgroundColor: theme.color }}
              >
                {selected && <Check className="size-4" style={{ color: theme.foreground }} aria-hidden="true" />}
              </span>
              <span
                className={cn(
                  'hidden text-center text-[10px] leading-tight md:block',
                  selected ? 'text-foreground' : 'text-muted-foreground',
                )}
              >
                {theme.label}
              </span>
            </button>
          )
        })}
      </div>
    </section>
  )
}

function IsolationGuard({ enabled, onChange }: { enabled: boolean; onChange: (value: boolean) => void }) {
  return (
    <section aria-labelledby="isolation-guard-label">
      <SectionLabel id="isolation-guard-label">Data Isolation Guard</SectionLabel>
      <div
        className={cn(
          'flex flex-col items-center gap-3 rounded-xl border p-3 transition-colors duration-300 md:flex-row md:justify-between',
          enabled ? 'border-privacy/50 bg-privacy/10' : 'border-sidebar-border bg-card/40',
        )}
      >
        <div className="hidden min-w-0 items-center gap-2.5 md:flex">
          <ShieldCheck
            className={cn('size-4 shrink-0', enabled ? 'text-privacy' : 'text-muted-foreground')}
            aria-hidden="true"
          />
          <div className="min-w-0">
            <p id="temporary-chat-label" className="text-sm font-medium text-foreground">
              Temporary Chat
            </p>
            <p className="text-[11px] text-muted-foreground">{enabled ? 'History isolated' : 'History cached'}</p>
          </div>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          aria-labelledby="temporary-chat-label"
          title="Temporary Chat"
          onClick={() => onChange(!enabled)}
          className={cn(
            'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition-colors duration-300',
            'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar focus-visible:outline-none',
            enabled ? 'border-privacy bg-emerald' : 'border-input bg-secondary',
          )}
        >
          <span className="sr-only md:hidden">Temporary Chat</span>
          <span
            aria-hidden="true"
            className={cn(
              'inline-block size-4.5 rounded-full bg-foreground shadow transition-transform duration-300',
              enabled ? 'translate-x-5.5' : 'translate-x-0.5',
            )}
          />
        </button>
      </div>
    </section>
  )
}
