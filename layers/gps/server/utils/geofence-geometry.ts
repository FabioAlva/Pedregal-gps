import { asLatLng, asPolygon, distanceMeters, isInsidePolygon } from './field-geometry'

export { asLatLng, asPolygon, distanceMeters, isInsidePolygon }

export const isInsideGeofence = (
  geofence: { tipo: string, radius?: number | string | null, coords: unknown },
  lat: number,
  lng: number
) => {
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
