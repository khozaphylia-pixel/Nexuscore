import { NextResponse, type NextRequest } from 'next/server'

export type GeoResult = {
  id: string
  name: string
  address: string
  type: string
  lat: number
  lon: number
}

type NominatimPlace = {
  place_id: number
  name?: string
  display_name: string
  type?: string
  category?: string
  lat: string
  lon: string
}

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get('q')?.trim() ?? ''
  if (query.length < 2 || query.length > 200) {
    return NextResponse.json({ error: 'Query must be between 2 and 200 characters.' }, { status: 400 })
  }

  const url = new URL('https://nominatim.openstreetmap.org/search')
  url.searchParams.set('q', query)
  url.searchParams.set('format', 'jsonv2')
  url.searchParams.set('limit', '8')
  url.searchParams.set('addressdetails', '0')

  const response = await fetch(url, {
    headers: { 'User-Agent': 'AI-Studio-Hub-GPS/1.0', 'Accept-Language': 'en' },
    next: { revalidate: 3600 },
  })

  if (!response.ok) {
    return NextResponse.json({ error: 'Geocoding service unavailable.' }, { status: 502 })
  }

  const places = (await response.json()) as NominatimPlace[]
  const results: GeoResult[] = places.map((place) => ({
    id: String(place.place_id),
    name: place.name || place.display_name.split(',')[0],
    address: place.display_name,
    type: (place.type || place.category || 'place').replace(/_/g, ' '),
    lat: Number(place.lat),
    lon: Number(place.lon),
  }))

  return NextResponse.json({ results })
}
