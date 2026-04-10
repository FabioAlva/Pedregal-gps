import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { db } from '@nuxthub/db'
import { organizations } from '~~/server/db/schema'
import type { Field, NewField } from '~~/shared/types/db'
import { FieldService } from '../../services/Field/Field.service'
import { cacheNames, invalidateFunctionCacheByPrefix } from '~~/utils/cache-version'
import { isInsideField } from '../../utils/field-geometry'

type GeoJsonFeature = {
  properties?: {
    name?: string | null
    id?: string | null
  }
  geometry?: {
    type?: string
    coordinates?: unknown
  }
}

type ImportField = {
  name: string
  coords: [number, number][]
  area: number
  parentIndex: number | null
  color: string
}

const normalizeName = (value?: string | null) => (value ?? '').trim()
const COLOR_PALETTE = [
  '#3b82f6',
  '#22c55e',
  '#f97316',
  '#ef4444',
  '#14b8a6',
  '#6366f1',
  '#a855f7',
  '#eab308'
]

const toCoords = (geometry?: GeoJsonFeature['geometry']): [number, number][] => {
  if (!geometry || !geometry.type || !geometry.coordinates) return []

  if (geometry.type === 'Polygon') {
    const rings = geometry.coordinates as number[][][]
    return (rings?.[0] ?? [])
      .map(point => {
        const lng = Number(point?.[0])
        const lat = Number(point?.[1])
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null
        return [lat, lng] as [number, number]
      })
      .filter((point): point is [number, number] => point != null)
  }

  if (geometry.type === 'MultiPolygon') {
    const polygons = geometry.coordinates as number[][][][]
    const ring = polygons?.[0]?.[0] ?? []
    return ring
      .map(point => {
        const lng = Number(point?.[0])
        const lat = Number(point?.[1])
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null
        return [lat, lng] as [number, number]
      })
      .filter((point): point is [number, number] => point != null)
  }

  return []
}

const polygonArea = (coords: [number, number][]) => {
  if (coords.length < 3) return 0
  let area = 0
  for (let i = 0; i < coords.length; i += 1) {
    const [lat1, lng1] = coords[i]!
    const [lat2, lng2] = coords[(i + 1) % coords.length]!
    area += lng1 * lat2 - lng2 * lat1
  }
  return Math.abs(area / 2)
}

const ensureOrganization = async () => {
  const existing = await db.query.organizations.findFirst()
  if (existing) return existing

  const [created] = await db.insert(organizations)
    .values({ nombre: 'Organizacion principal' })
    .returning()

  return created
}

export default defineEventHandler(async () => {
  console.log('[fields.import] start')
  const filePath = join(process.cwd(), 'public', 'maps', 'map.geojson')
  const raw = await readFile(filePath, 'utf-8')
  const geojson = JSON.parse(raw) as { features?: GeoJsonFeature[] }
  const features = Array.isArray(geojson?.features) ? geojson.features : []
  console.log('[fields.import] features', { total: features.length })

  const nameCounts = new Map<string, number>()
  const importFields: ImportField[] = []
  let invalidGeometries = 0

  for (const feature of features) {
    const geometryType = feature?.geometry?.type
    if (geometryType !== 'Polygon' && geometryType !== 'MultiPolygon') {
      continue
    }

    const coords = toCoords(feature.geometry)
    if (coords.length < 3) {
      invalidGeometries += 1
      continue
    }

    const baseName = normalizeName(feature?.properties?.name)
      || normalizeName(feature?.properties?.id)
      || `Campo ${importFields.length + 1}`

    const count = (nameCounts.get(baseName) ?? 0) + 1
    nameCounts.set(baseName, count)

    const name = count > 1 ? `${baseName} ${count}` : baseName

    importFields.push({
      name,
      coords,
      area: polygonArea(coords),
      parentIndex: null,
      color: COLOR_PALETTE[importFields.length % COLOR_PALETTE.length] ?? '#3b82f6'
    })
  }

  console.log('[fields.import] polygons', { total: importFields.length, invalidGeometries })

  for (let i = 0; i < importFields.length; i += 1) {
    const child = importFields[i]!
    const anchor = child.coords[0]
    if (!anchor) continue

    let bestParent: number | null = null
    let bestArea = Number.POSITIVE_INFINITY

    for (let j = 0; j < importFields.length; j += 1) {
      if (i === j) continue
      const candidate = importFields[j]!
      if (candidate.area <= child.area) continue
      if (!isInsideField({ coords: candidate.coords }, anchor[0], anchor[1])) continue

      if (candidate.area < bestArea) {
        bestArea = candidate.area
        bestParent = j
      }
    }

    child.parentIndex = bestParent
  }

  const service = new FieldService(db)
  const org = await ensureOrganization()
  
  if (!org) {
    throw createError({ statusCode: 500, statusMessage: 'No se pudo resolver la organizacion' })
  }

  const existing = await service.getAll()
  const existingByName = new Map<string, Field>()
  for (const field of existing) {
    existingByName.set(field.nombre.trim().toLowerCase(), field)
  }

  const idByIndex = new Map<number, number>()
  const createdIds = new Set<number>()
  let created = 0
  let skipped = 0

  console.log('[fields.import] existing', { count: existing.length })

  for (let i = 0; i < importFields.length; i += 1) {
    const item = importFields[i]!
    const key = item.name.toLowerCase()
    const existingField = existingByName.get(key)
    if (existingField) {
      idByIndex.set(i, existingField.id)
      skipped += 1
      continue
    }

    const payload: NewField = {
      organizacionId: org.id,
      nombre: item.name,
      categoria: 'CAMPO',
      tipo: 'GUIA',
      coords: item.coords,
      color: item.color
    }

    const id = await service.create(payload)
    idByIndex.set(i, id)
    createdIds.add(id)
    created += 1
  }

  let parentsSet = 0

  for (let i = 0; i < importFields.length; i += 1) {
    const child = importFields[i]!
    if (child.parentIndex == null) continue
    const childId = idByIndex.get(i)
    const parentId = idByIndex.get(child.parentIndex)
    if (!childId || !parentId || childId === parentId) continue
    if (!createdIds.has(childId)) continue

    await service.update(childId, { parentId })
    parentsSet += 1
  }

  await Promise.all([
    invalidateFunctionCacheByPrefix(cacheNames.fieldsList),
    invalidateFunctionCacheByPrefix(cacheNames.fieldStaysReport)
  ])

  console.log('[fields.import] done', {
    created,
    skippedExisting: skipped,
    parentsSet,
    invalidGeometries
  })

  return {
    totalFeatures: features.length,
    polygonsFound: importFields.length,
    created,
    skippedExisting: skipped,
    invalidGeometries,
    parentsSet
  }
}
)