import { db } from '@nuxthub/db'
import { organizations } from '~~/server/db/schema'
import { OperatorService } from '../../services/Operator/Operator.service'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  if (!body?.nombres || !body?.apellidos) {
    throw createError({ statusCode: 400, statusMessage: 'nombres y apellidos son requeridos' })
  }

  let organizacionId = body.organizacionId ? Number(body.organizacionId) : null

  if (!organizacionId) {
    const existingOrg = await db.query.organizations.findFirst()
    if (existingOrg) {
      organizacionId = existingOrg.id
    } else {
      const [createdOrg] = await db.insert(organizations)
        .values({ nombre: 'Organizacion principal' })
        .returning({ id: organizations.id })

      organizacionId = createdOrg?.id ?? null
    }
  }

  if (!organizacionId) {
    throw createError({ statusCode: 400, statusMessage: 'No se pudo resolver la organizacion' })
  }

  const service = new OperatorService(db)
  return await service.create({
    organizacionId,
    nombres: String(body.nombres),
    apellidos: String(body.apellidos),
    dni: body.dni ?? null,
    licencia: body.licencia ?? null,
    categoriaLicencia: body.categoriaLicencia ?? null,
    vencimientoLicencia: body.vencimientoLicencia ? new Date(body.vencimientoLicencia) : null,
    telefono: body.telefono ?? null,
    fotoUrl: body.fotoUrl ?? null,
    activo: body.activo ?? true
  })
})
