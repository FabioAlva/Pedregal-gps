import { desc, eq } from 'drizzle-orm'
import type { NeonHttpDatabase } from 'drizzle-orm/neon-http'
import * as schema from '~~/server/db/schema'
import type { NewInspection } from '#shared/types/db'
import type { IInspectionRepository, InspectionIssueInput } from './Interfaces/IInspectionRepository'

export class NeonInspectionRepository implements IInspectionRepository {
  constructor(private db: NeonHttpDatabase<typeof schema>) {}

  async getAll() {
    return await this.db
      .select({
        id: schema.inspections.id,
        flotaId: schema.inspections.flotaId,
        operadorId: schema.inspections.operadorId,
        plantillaId: schema.inspections.plantillaId,
        esquemaSnapshot: schema.inspections.esquemaSnapshot,
        respuestas: schema.inspections.respuestas,
        estado: schema.inspections.estado,
        tipo: schema.inspections.tipo,
        firmaUrl: schema.inspections.firmaUrl,
        observaciones: schema.inspections.observaciones,
        createdAt: schema.inspections.createdAt,
        flotaPlaca: schema.fleet.placa,
        operadorNombres: schema.operators.nombres,
        operadorApellidos: schema.operators.apellidos,
        plantillaNombre: schema.inspectionTemplates.nombre
      })
      .from(schema.inspections)
      .leftJoin(schema.fleet, eq(schema.inspections.flotaId, schema.fleet.id))
      .leftJoin(schema.operators, eq(schema.inspections.operadorId, schema.operators.id))
      .leftJoin(schema.inspectionTemplates, eq(schema.inspections.plantillaId, schema.inspectionTemplates.id))
      .orderBy(desc(schema.inspections.createdAt))
  }

  async getById(id: number) {
    const [inspection] = await this.db
      .select({
        id: schema.inspections.id,
        flotaId: schema.inspections.flotaId,
        operadorId: schema.inspections.operadorId,
        plantillaId: schema.inspections.plantillaId,
        esquemaSnapshot: schema.inspections.esquemaSnapshot,
        respuestas: schema.inspections.respuestas,
        estado: schema.inspections.estado,
        tipo: schema.inspections.tipo,
        firmaUrl: schema.inspections.firmaUrl,
        observaciones: schema.inspections.observaciones,
        createdAt: schema.inspections.createdAt,
        flotaPlaca: schema.fleet.placa,
        operadorNombres: schema.operators.nombres,
        operadorApellidos: schema.operators.apellidos,
        plantillaNombre: schema.inspectionTemplates.nombre
      })
      .from(schema.inspections)
      .leftJoin(schema.fleet, eq(schema.inspections.flotaId, schema.fleet.id))
      .leftJoin(schema.operators, eq(schema.inspections.operadorId, schema.operators.id))
      .leftJoin(schema.inspectionTemplates, eq(schema.inspections.plantillaId, schema.inspectionTemplates.id))
      .where(eq(schema.inspections.id, id))
      .limit(1)

    if (!inspection) return undefined

    const issues = await this.db
      .select()
      .from(schema.inspectionIssues)
      .where(eq(schema.inspectionIssues.inspeccionId, id))
      .orderBy(desc(schema.inspectionIssues.createdAt))

    return { ...inspection, issues }
  }

  async create(data: NewInspection, issues: InspectionIssueInput[] = []): Promise<number> {
    return await this.db.transaction(async (tx) => {
      const [result] = await tx
        .insert(schema.inspections)
        .values(data)
        .returning({ id: schema.inspections.id })

      if (!result?.id) throw new Error('Error al registrar inspeccion')

      if (issues.length > 0) {
        await tx.insert(schema.inspectionIssues).values(
          issues.map(issue => ({
            inspeccionId: result.id,
            campoId: issue.campoId,
            descripcion: issue.descripcion,
            severidad: issue.severidad,
            fotosUrl: issue.fotosUrl ?? [],
            resuelto: issue.resuelto ?? false
          }))
        )
      }

      return result.id
    })
  }
}
