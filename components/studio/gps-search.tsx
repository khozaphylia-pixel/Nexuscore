'use client'

import dynamic from 'next/dynamic'
import { useState, type FormEvent } from 'react'
import useSWR from 'swr'
import { Crosshair, Loader as Loader2, MapPin, Navigation, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { GeoResult } from '@/app/api/geocode/route'
import type { LatLon } from './gps-map'

const GpsMap = dynamic(() => import('./gps-map'), {
  ssr: false,
  loading: () => (
    <div className="flex size-full items-center justify-center font-mono text-xs text-muted-foreground">
      Initializing map grid...
    </div>
  ),
})

const fetcher = async (url: string) => {
  const res = await fetch(url)
  const data = await res.json()
  if (!res.ok) throw new Error(data.error ?? 'Search failed')
  return data.results as GeoResult[]
}

function distanceKm(a: LatLon, b: LatLon) {
  const toRad = (deg: number) => (deg * Math.PI) / 180
  const dLat = toRad(b.lat - a.lat)
  const dLon = toRad(b.lon - a.lon)
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLon / 2) ** 2
  return 6371 * 2 * Math.asin(Math.sqrt(h))
}

export function GpsSearch() {
  const [input, setInput] = useState('')
  const [query, setQuery] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [focus, setFocus] = useState<LatLon | null>(null)
  const [userLocation, setUserLocation] = useState<LatLon | null>(null)
  const [locating, setLocating] = useState(false)
  const [geoError, setGeoError] = useState<string | null>(null)

  const { data: results = [], error, isLoading } = useSWR(
    query ? `/api/geocode?q=${encodeURIComponent(query)}` : null,
    fetcher,
    { revalidateOnFocus: false },
  )

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    const trimmed = input.trim()
    if (trimmed.length < 2) return
    setSelectedId(null)
    setQuery(trimmed)
  }

  const selectResult = (result: GeoResult) => {
    setSelectedId(result.id)
    setFocus({ lat: result.lat, lon: result.lon })
  }

  const locateMe = () => {
    if (!('geolocation' in navigator)) {
      setGeoError('Geolocation is not supported by this browser.')
      return
    }
    setLocating(true)
    setGeoError(null)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = { lat: position.coords.latitude, lon: position.coords.longitude }
        setUserLocation(location)
        setFocus(location)
        setLocating(false)
      },
      (err) => {
        setGeoError(err.code === err.PERMISSION_DENIED ? 'Location permission denied.' : 'Unable to get your location.')
        setLocating(false)
      },
      { enableHighAccuracy: true, timeout: 10000 },
    )
  }

  return (
    <div className="flex h-dvh flex-col">
      <header className="flex flex-col gap-1 border-b border-border px-6 py-5">
        <p className="font-mono text-[10px] tracking-[0.2em] text-primary uppercase">Workspace 03</p>
        <h1 className="text-glow text-xl font-semibold text-foreground">GPS Search Engine</h1>
        <p className="text-sm text-muted-foreground">
          Search any address, city, or landmark worldwide and pinpoint it on the map.
        </p>
      </header>

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <div className="flex w-full shrink-0 flex-col border-b border-border lg:w-96 lg:border-r lg:border-b-0">
          <form onSubmit={handleSubmit} role="search" className="flex flex-col gap-3 p-4">
            <label htmlFor="gps-query" className="sr-only">
              Search for a place
            </label>
            <div className="relative">
              <Search
                className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <input
                id="gps-query"
                type="search"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="e.g. Eiffel Tower, Tokyo, 221B Baker St"
                maxLength={200}
                autoComplete="off"
                className="h-11 w-full rounded-lg border border-input bg-card pr-3 pl-9 text-sm text-foreground placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit" className="glow-neon flex-1" disabled={input.trim().length < 2 || isLoading}>
                {isLoading ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Search className="size-4" aria-hidden="true" />}
                Search
              </Button>
              <Button type="button" variant="outline" onClick={locateMe} disabled={locating}>
                {locating ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Crosshair className="size-4" aria-hidden="true" />}
                Locate me
              </Button>
            </div>
            {userLocation && (
              <p className="font-mono text-xs text-muted-foreground">
                {'GPS: '}
                {userLocation.lat.toFixed(5)}, {userLocation.lon.toFixed(5)}
              </p>
            )}
            {geoError && (
              <p role="alert" className="text-xs text-destructive">
                {geoError}
              </p>
            )}
          </form>

          <div className="max-h-56 min-h-0 flex-1 overflow-y-auto px-4 pb-4 lg:max-h-none" aria-live="polite">
            {error && (
              <p role="alert" className="text-sm text-destructive">
                {error.message}
              </p>
            )}
            {!query && !error && (
              <p className="py-6 text-center text-sm text-muted-foreground">Enter a location to begin scanning.</p>
            )}
            {query && !isLoading && !error && results.length === 0 && (
              <p className="py-6 text-center text-sm text-muted-foreground">
                No matches found for &quot;{query}&quot;.
              </p>
            )}
            <ul className="flex flex-col gap-2">
              {results.map((result) => {
                const selected = result.id === selectedId
                return (
                  <li key={result.id}>
                    <button
                      type="button"
                      onClick={() => selectResult(result)}
                      aria-pressed={selected}
                      className={cn(
                        'flex w-full gap-3 rounded-lg border p-3 text-left transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
                        selected
                          ? 'glow-neon border-primary bg-primary/10'
                          : 'border-border bg-card hover:border-primary/50',
                      )}
                    >
                      <MapPin
                        className={cn('mt-0.5 size-4 shrink-0', selected ? 'text-primary' : 'text-muted-foreground')}
                        aria-hidden="true"
                      />
                      <span className="flex min-w-0 flex-col gap-1">
                        <span className="truncate text-sm font-medium text-foreground">{result.name}</span>
                        <span className="line-clamp-2 text-xs text-muted-foreground">{result.address}</span>
                        <span className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[10px] text-muted-foreground uppercase">
                          <span className="text-primary">{result.type}</span>
                          <span>
                            {result.lat.toFixed(4)}, {result.lon.toFixed(4)}
                          </span>
                          {userLocation && (
                            <span className="flex items-center gap-1">
                              <Navigation className="size-3" aria-hidden="true" />
                              {distanceKm(userLocation, result).toFixed(1)} km
                            </span>
                          )}
                        </span>
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>
        </div>

        <div className="relative isolate min-h-80 flex-1">
          <GpsMap
            results={results}
            selectedId={selectedId}
            userLocation={userLocation}
            focus={focus}
            onSelect={selectResult}
          />
        </div>
      </div>
    </div>
  )
}
