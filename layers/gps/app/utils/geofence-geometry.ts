import type { Geofence } from '#shared/types/db'

const toRadians = (value: number) => (value * Math.PI) / 180

const distanceMeters = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const earthRadius = 6371000
  const dLat = toRadians(lat2 - lat1)
  const dLon = toRadians(lon2 - lon1)
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLon / 2) ** 2

  return earthRadius * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)))
}

export const asLatLng = (coords: unknown): [number, number] | null => {
  if (!Array.isArray(coords) || coords.length < 2) return null
  const lat = Number(coords[0])
  const lng = Number(coords[1])
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null
  return [lat, lng]
}

export const asPolygon = (coords: unknown): Array<[number, number]> => {
  if (!Array.isArray(coords)) return []
  return coords
    .map(point => asLatLng(point))
    .filter((point): point is [number, number] => point != null)
}

export const isInsidePolygon = (lat: number, lng: number, points: Array<[number, number]>) => {
  let inside = false
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const [yi, xi] = points[i]!
    const [yj, xj] = points[j]!

    const intersects = ((yi > lat) !== (yj > lat))
      && (lng < ((xj - xi) * (lat - yi)) / (yj - yi || 1e-9) + xi)

    if (intersects) inside = !inside
  }
  return inside
}

export const isInsideGeofence = (geofence: Geofence, lat: number, lng: number) => {
  const center = asLatLng(geofence.coords)
  const polygon = asPolygon(geofence.coords)

  if (geofence.tipo === 'circle' && center && Number.isFinite(Number(geofence.radius))) {
    return distanceMeters(lat, lng, center[0], center[1]) <= Number(geofence.radius)
  }

  if (polygon.length >= 3) {
    return isInsidePolygon(lat, lng, polygon)
  }

  return false
}