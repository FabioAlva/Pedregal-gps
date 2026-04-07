import { db } from '@nuxthub/db'
import { organizations } from '~~/server/db/schema'

const ensureOrganization = async () => {
  const existing = await db.query.organizations.findFirst()
  if (existing) return existing

  const [created] = await db.insert(organizations)
    .values({ nombre: 'Organizacion principal' })
    .returning()

  return created
}

export default defineEventHandler(async () => {
  const org = await ensureOrganization()

  if (!org) {
    throw createError({ statusCode: 500, statusMessage: 'No se pudo resolver la organizacion' })
  }

  return {
    center: org.centroMapa ?? null,
    boundary: org.limiteMapa ?? []
  }
})
