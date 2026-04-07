import { eq } from 'drizzle-orm'
import { db } from '@nuxthub/db'
import { organizations } from '~~/server/db/schema'

type CenterCoords = [number, number]

type GeoConfigPayload = {
  center?: CenterCoords | null
  boundary?: CenterCoords[]
}

const normalizeCenter = (value: unknown): CenterCoords | null => {
  if (!Array.isArray(value) || value.length < 2) return null
  const lat = Number(value[0])
  const lng = Number(value[1])
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null
  return [lat, lng]
}

const normalizeBoundary = (value: unknown): CenterCoords[] => {
  if (!Array.isArray(value)) return []
  return value
    .map(point => normalizeCenter(point))
    .filter((point): point is CenterCoords => point != null)
}

const ensureOrganization = async () => {
  const existing = await db.query.organizations.findFirst()
  if (existing) return existing

  const [created] = await db.insert(organizations)
    .values({ nombre: 'Organizacion principal' })
    .returning()

  return created
}

export default defineEventHandler(async (event) => {
  const org = await ensureOrganization()

  if (!org) {
    throw createError({ statusCode: 500, statusMessage: 'No se pudo resolver la organizacion' })
  }

  const body = (await readBody(event)) as GeoConfigPayload
  const center = body?.center === undefined ? org.centroMapa ?? null : normalizeCenter(body.center)
  const boundary = body?.boundary === undefined ? org.limiteMapa ?? [] : normalizeBoundary(body.boundary)

  await db.update(organizations)
    .set({
      centroMapa: center,
      limiteMapa: boundary
    })
    .where(eq(organizations.id, org.id))

  return { success: true }
})
