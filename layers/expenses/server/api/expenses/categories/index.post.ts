import { db } from '@nuxthub/db'
import { organizations } from '~~/server/db/schema'
import { ExpenseCategoryService } from '../../../services/ExpenseCategory/ExpenseCategory.service'

const resolveOrganizationId = async (input?: number | null) => {
  let organizacionId = input ? Number(input) : null

  if (!organizacionId) {
    const existing = await db.query.organizations.findFirst()
    if (existing) {
      organizacionId = existing.id
    } else {
      const [created] = await db.insert(organizations)
        .values({ nombre: 'Organizacion principal' })
        .returning({ id: organizations.id })

      organizacionId = created?.id ?? null
    }
  }

  return organizacionId
}

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  if (!body?.nombre) {
    throw createError({ statusCode: 400, statusMessage: 'nombre es requerido' })
  }

  const organizacionId = await resolveOrganizationId(body.organizacionId)

  if (!organizacionId) {
    throw createError({ statusCode: 400, statusMessage: 'No se pudo resolver la organizacion' })
  }

  const service = new ExpenseCategoryService(db)
  const id = await service.create({
    organizacionId,
    nombre: String(body.nombre),
    esCombustible: body.esCombustible ?? false,
    activo: body.activo ?? true
  })

  setResponseStatus(event, 201)
  return { id, success: true }
})
