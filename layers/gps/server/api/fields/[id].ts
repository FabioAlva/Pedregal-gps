import { db } from '@nuxthub/db'
import { FieldService } from '../../services/Field/Field.service'
import { cacheNames, invalidateFunctionCacheByPrefix } from '~~/utils/cache-version'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  const method = event.method

  const service = new FieldService(db)

  if (method === 'PATCH') {
    const body = await readBody(event)
    if (body && Object.prototype.hasOwnProperty.call(body, 'parentId')) {
      const value = body.parentId
      body.parentId = value === '' || value == null ? null : Number(value)
    }
    await service.update(id, body)
    await Promise.all([
      invalidateFunctionCacheByPrefix(cacheNames.fieldsList),
      invalidateFunctionCacheByPrefix(cacheNames.fieldStaysReport)
    ])
    return { success: true }
  }

  if (method === 'DELETE') {
    await service.delete(id)
    await Promise.all([
      invalidateFunctionCacheByPrefix(cacheNames.fieldsList),
      invalidateFunctionCacheByPrefix(cacheNames.fieldStaysReport)
    ])
    return { success: true }
  }
})
