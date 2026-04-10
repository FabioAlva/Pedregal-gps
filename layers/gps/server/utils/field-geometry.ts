/**
 * Conversor simple de grados a radianes.
 */
const toRadians = (value: number) => (value * Math.PI) / 180

/**
 * Distancia Haversine en metros entre dos coordenadas.
 */
export const distanceMeters = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const earthRadius = 6371000
  const dLat = toRadians(lat2 - lat1)
  const dLon = toRadians(lon2 - lon1)
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLon / 2) ** 2

  return earthRadius * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)))
}

/**
 * Convierte una coordenada unknown a tupla [lat, lng].
 * Retorna null si el dato no es valido.
 */
export const asLatLng = (coords: unknown): [number, number] | null => {
  if (!Array.isArray(coords) || coords.length < 2) return null
  const lat = Number(coords[0])
  const lng = Number(coords[1])
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null
  return [lat, lng]
}

/**
 * Convierte un arreglo de puntos unknown a poligono valido.
 */
export const asPolygon = (coords: unknown): Array<[number, number]> => {
  if (!Array.isArray(coords)) return []
  return coords
    .map(point => asLatLng(point))
    .filter((point): point is [number, number] => point != null)
}

  /**
   * Point-in-polygon por ray casting.
   */
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

/**
 * Regla de pertenencia a campo (poligono).
 */
export const isInsideField = (
  field: { coords: unknown },
  lat: number,
  lng: number
) => {
  const polygon = asPolygon(field.coords)

  if (polygon.length >= 3) {
    return isInsidePolygon(lat, lng, polygon)
  }

  return false
}