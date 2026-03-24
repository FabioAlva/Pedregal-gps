import { db } from '@nuxthub/db'
import { ModuleRouteService } from '~~/server/services/ModuleRoute/ModuleRoute.service'

interface UpdateModuleRouteBody {
  nombre?: string
  url?: string
  tipoRuta?: 'frontend' | 'backend'
  metodo?: string | null
  accionRequerida?: 'ver' | 'agregar' | 'editar' | 'eliminar' | null
  protegida?: boolean
}

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  const body = await readBody<UpdateModuleRouteBody>(event)

  const url = String(body.url ?? '').trim()
  const nombre = String(body.nombre ?? '').trim() || url
  const tipoRuta = body.tipoRuta === 'backend' ? 'backend' : 'frontend'
  const metodo = tipoRuta === 'backend' ? String(body.metodo ?? '').trim().toUpperCase() || null : null
  const accionRequerida = body.accionRequerida ?? null
  const protegida = body.protegida !== false

  if (!id || !url) {
    throw createError({ statusCode: 400, statusMessage: 'id y url son requeridos' })
  }

  const service = new ModuleRouteService(db)
  await service.update(id, {
    nombre,
    url,
    tipoRuta,
    metodo,
    accionRequerida,
    protegida
  })

  return { success: true }
})
