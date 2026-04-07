import { db } from '@nuxthub/db'
import { OperatorService } from '../../services/Operator/Operator.service'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  const body = await readBody(event)

  const service = new OperatorService(db)
  return await service.update(id, {
    nombres: body.nombres,
    apellidos: body.apellidos,
    dni: body.dni,
    licencia: body.licencia,
    categoriaLicencia: body.categoriaLicencia,
    vencimientoLicencia: body.vencimientoLicencia ? new Date(body.vencimientoLicencia) : undefined,
    telefono: body.telefono,
    fotoUrl: body.fotoUrl,
    activo: body.activo
  })
})
