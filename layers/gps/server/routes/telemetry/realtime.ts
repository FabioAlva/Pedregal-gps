import z from 'zod'

export default defineEventHandler(async (event) => {
  const querySchema = z.object({
    deviceId: z.string().min(1, 'El parámetro deviceId es obligatorio').optional()
  })
  const { error, data } = await getValidatedQuery(event, querySchema.safeParse)

  if (error) {
    throw createError({
      statusCode: 400,
      statusMessage: error.message
    })
  }

  return createGpsRealtimeEventStream(event, {
    deviceId: data.deviceId
  })
})
