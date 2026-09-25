'use client'

import 'leaflet/dist/leaflet.css'
import { useEffect } from 'react'
import { CircleMarker, MapContainer, TileLayer, Tooltip, useMap } from 'react-leaflet'
import type { GeoResult } from '@/app/api/geocode/route'

export type LatLon = { lat: number; lon: number }

function FlyTo({ target }: { target: LatLon | null }) {
  const map = useMap()
  useEffect(() => {
    if (target) map.flyTo([target.lat, target.lon], 14, { duration: 1.2 })
  }, [map, target])
  return null
}

export default function GpsMap({
  results,
  selectedId,
  userLocation,
  focus,
  onSelect,
}: {
  results: GeoResult[]
  selectedId: string | null
  userLocation: LatLon | null
  focus: LatLon | null
  onSelect: (result: GeoResult) => void
}) {
  return (
    <MapContainer
      center={[20, 0]}
      zoom={2}
      worldCopyJump
      className="size-full bg-background"
      aria-label="Interactive map"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        className="gps-dark-tiles"
      />
      <FlyTo target={focus} />

      {results.map((result) => {
        const selected = result.id === selectedId
        return (
          <CircleMarker
            key={result.id}
            center={[result.lat, result.lon]}
            radius={selected ? 11 : 7}
            pathOptions={{
              color: selected ? '#39ff88' : '#22d3ee',
              fillColor: selected ? '#39ff88' : '#22d3ee',
              fillOpacity: 0.55,
              weight: 2,
            }}
            eventHandlers={{ click: () => onSelect(result) }}
          >
            <Tooltip direction="top" offset={[0, -8]}>
              {result.name}
            </Tooltip>
          </CircleMarker>
        )
      })}

      {userLocation && (
        <CircleMarker
          center={[userLocation.lat, userLocation.lon]}
          radius={9}
          pathOptions={{ color: '#ffffff', fillColor: '#f472b6', fillOpacity: 0.9, weight: 3 }}
        >
          <Tooltip direction="top" offset={[0, -8]} permanent>
            You are here
          </Tooltip>
        </CircleMarker>
      )}
    </MapContainer>
  )
}
