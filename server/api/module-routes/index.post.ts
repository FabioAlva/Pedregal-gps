import { db } from '@nuxthub/db'
import { ModuleRouteService } from '~~/server/services/ModuleRoute/ModuleRoute.service'

interface CreateModuleRouteBody {
  nombre?: string
  url?: string
  tipoRuta?: 'frontend' | 'backend'
  metodo?: string | null
  accionRequerida?: 'ver' | 'agregar' | 'editar' | 'eliminar' | null
  protegida?: boolean
}

export default defineEventHandler(async (event) => {
  const body = await readBody<CreateModuleRouteBody>(event)

  const url = String(body.url ?? '').trim()
  const nombre = String(body.nombre ?? '').trim() || url
  const tipoRuta = body.tipoRuta === 'backend' ? 'backend' : 'frontend'
  const metodo = tipoRuta === 'backend' ? String(body.metodo ?? '').trim().toUpperCase() || null : null
  const accionRequerida = body.accionRequerida ?? null
  const protegida = body.protegida !== false

  if (!url) {
    throw createError({ statusCode: 400, statusMessage: 'url es requerida' })
  }

  const service = new ModuleRouteService(db)
  const id = await service.create({
    nombre,
    url,
    tipoRuta,
    metodo,
    accionRequerida,
    protegida
  })

  setResponseStatus(event, 201)
  return { id }
})
