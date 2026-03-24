import { and, desc, eq, gte, isNull, lt, or } from 'drizzle-orm'
import type { NewGeofenceStay } from '~~/shared/types/db'
import * as schema from '~~/server/db/schema'
import { IGeofenceStayRepository } from './Interfaces/IGeofenceStayRepository'
import { NeonHttpDatabase } from 'drizzle-orm/neon-http'


export class NeonGeofenceStayRepository implements IGeofenceStayRepository {
	constructor(private db: NeonHttpDatabase<typeof schema>) {}

	async findAll() {
		return await this.db
			.select()
			.from(schema.geofenceStays)
			.orderBy(desc(schema.geofenceStays.enteredAt))
	}

	async findById(id: number) {
		return await this.db.query.geofenceStays.findFirst({
			where: eq(schema.geofenceStays.id, id)
		})
	}

	async findByFleetEquipmentId(fleetEquipmentId: number) {
		return await this.db
			.select()
			.from(schema.geofenceStays)
			.where(eq(schema.geofenceStays.fleetEquipmentId, fleetEquipmentId))
			.orderBy(desc(schema.geofenceStays.enteredAt))
	}


    /* Para un futuro aun no uso la db */
	async findByDateRange(params: {
		start: Date
		end: Date
		geofenceId?: number
		fleetEquipmentId?: number
		deviceId?: string
	}) {
		const rows = await this.db
			.select({
				id: schema.geofenceStays.id,
				geofenceId: schema.geofenceStays.geofenceId,
				fleetEquipmentId: schema.geofenceStays.fleetEquipmentId,
				enteredAt: schema.geofenceStays.enteredAt,
				exitedAt: schema.geofenceStays.exitedAt,
				entryLat: schema.geofenceStays.entryLat,
				entryLng: schema.geofenceStays.entryLng,
				exitLat: schema.geofenceStays.exitLat,
				exitLng: schema.geofenceStays.exitLng,
				createdAt: schema.geofenceStays.createdAt,
				updatedAt: schema.geofenceStays.updatedAt,
				geofenceName: schema.geofences.nombre,
				deviceId: schema.equipment.codigo
			})
			.from(schema.geofenceStays)
			.innerJoin(schema.geofences, eq(schema.geofenceStays.geofenceId, schema.geofences.id))
			.innerJoin(schema.fleetEquipment, eq(schema.geofenceStays.fleetEquipmentId, schema.fleetEquipment.id))
			.innerJoin(schema.equipment, eq(schema.fleetEquipment.equipoId, schema.equipment.id))
			.where(
				and(
					lt(schema.geofenceStays.enteredAt, params.end),
					or(
						isNull(schema.geofenceStays.exitedAt),
						gte(schema.geofenceStays.exitedAt, params.start)
					),
					params.geofenceId ? eq(schema.geofenceStays.geofenceId, params.geofenceId) : undefined,
					params.fleetEquipmentId ? eq(schema.geofenceStays.fleetEquipmentId, params.fleetEquipmentId) : undefined,
					params.deviceId ? eq(schema.equipment.codigo, params.deviceId) : undefined
				)
			)
			.orderBy(desc(schema.geofenceStays.enteredAt))

		return rows
	}
    
    /* Busca estancias abiertas por equipo y geocerca */
	
    async findOpenByFleetEquipmentAndGeofence(fleetEquipmentId: number, geofenceId: number) {
		return await this.db.query.geofenceStays.findFirst({
			where: and(
				eq(schema.geofenceStays.fleetEquipmentId, fleetEquipmentId),
				eq(schema.geofenceStays.geofenceId, geofenceId),
				isNull(schema.geofenceStays.exitedAt)
			)
		})
	}

	async create(data: NewGeofenceStay): Promise<number> {
		const [result] = await this.db
			.insert(schema.geofenceStays)
			.values(data)
			.returning({ id: schema.geofenceStays.id })
		if (!result) throw new Error('Error al crear geofence stay')
		return result.id
	}

	async update(id: number, data: Partial<NewGeofenceStay>): Promise<void> {
		await this.db
			.update(schema.geofenceStays)
			.set({ ...data, updatedAt: new Date() })
			.where(eq(schema.geofenceStays.id, id))
	}

	async closeOpenStay(params: {
		fleetEquipmentId: number
		geofenceId: number
		exitedAt: Date
		exitLat?: number
		exitLng?: number
	}): Promise<number | undefined> {
		const [result] = await this.db
			.update(schema.geofenceStays)
			.set({
				exitedAt: params.exitedAt,
				...(params.exitLat !== undefined ? { exitLat: params.exitLat } : {}),
				...(params.exitLng !== undefined ? { exitLng: params.exitLng } : {}),
				updatedAt: new Date()
			})
			.where(
				and(
					eq(schema.geofenceStays.fleetEquipmentId, params.fleetEquipmentId),
					eq(schema.geofenceStays.geofenceId, params.geofenceId),
					isNull(schema.geofenceStays.exitedAt)
				)
			)
			.returning({ id: schema.geofenceStays.id })

		return result?.id
	}
}

