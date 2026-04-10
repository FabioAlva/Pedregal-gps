import { db } from '@nuxthub/db'
import { organizations } from '~~/server/db/schema'
import { FieldService } from '../../services/Field/Field.service'
import type { NewField } from '~~/shared/types/db'
import { cacheNames, invalidateFunctionCacheByPrefix } from '~~/utils/cache-version'

const ensureOrganization = async () => {
  const existing = await db.query.organizations.findFirst()
  if (existing) return existing

  const [created] = await db.insert(organizations)
    .values({ nombre: 'Organizacion principal' })
    .returning()

  return created
}

export default defineEventHandler(async (event) => {
  const service = new FieldService(db)
  const body: NewField = await readBody(event)
  const org = await ensureOrganization()

  if (!org) {
    throw createError({ statusCode: 500, statusMessage: 'No se pudo resolver la organizacion' })
  }

  const id = await service.create({
    ...body,
    organizacionId: body.organizacionId ?? org.id,
    color: body.color ?? '#3b82f6',
    tipo: body.tipo ?? 'GUIA'
  })

  await Promise.all([
    invalidateFunctionCacheByPrefix(cacheNames.fieldsList),
    invalidateFunctionCacheByPrefix(cacheNames.fieldStaysReport)
  ])

  setResponseStatus(event, 201)
  return { id }
})
