import type { Field } from '#shared/types/db'

const toRadians = (value: number) => (value * Math.PI) / 180

export const distanceMeters = (lat1: number, lon1: number, lat2: number, lon2: number) => {
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

export const isInsideField = (field: Field, lat: number, lng: number) => {
  const polygon = asPolygon(field.coords)
  if (polygon.length >= 3) {
    return isInsidePolygon(lat, lng, polygon)
  }
  return false
}

export const circleToPolygon = (center: [number, number], radiusMeters: number, steps = 36): [number, number][] => {
  const [lat, lng] = center
  const points: [number, number][] = []
  const earthRadius = 6371000
  const angularDistance = radiusMeters / earthRadius
  const latRad = toRadians(lat)
  const lngRad = toRadians(lng)

  for (let i = 0; i < steps; i++) {
    const bearing = (2 * Math.PI * i) / steps
    const sinLat = Math.sin(latRad) * Math.cos(angularDistance)
      + Math.cos(latRad) * Math.sin(angularDistance) * Math.cos(bearing)
    const newLat = Math.asin(sinLat)

    const newLng = lngRad + Math.atan2(
      Math.sin(bearing) * Math.sin(angularDistance) * Math.cos(latRad),
      Math.cos(angularDistance) - Math.sin(latRad) * Math.sin(newLat)
    )

    points.push([newLat * (180 / Math.PI), newLng * (180 / Math.PI)])
  }

  return points
}
