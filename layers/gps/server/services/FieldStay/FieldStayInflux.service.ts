import { NeonFleetEquipmentRepository } from '../../../../fleet-management/server/Repository/NeonFleetEquipmentRepository'
import { NeonFieldRepository } from '../../Repository/NeonFieldRepository'
import { isInsideField } from '../../utils/field-geometry'
import { getDeviceFilter } from '../../utils/influx-sql'
import type {
  AssignmentRow,
  FieldStayReportItem,
  FieldStayReportParams,
  FieldStayReportResult,
  FieldOpenStayState,
  TelemetryPoint
} from '../../schemas/IGeofenceStayReport'

const toStayMinutesRounded = (seconds: number) => Number((seconds / 60).toFixed(2))

export class FieldStayInfluxService {
  private fieldRepo: NeonFieldRepository
  private fleetEquipmentRepo: NeonFleetEquipmentRepository

  constructor(private db: any, private influxClient: any) {
    this.fieldRepo = new NeonFieldRepository(db)
    this.fleetEquipmentRepo = new NeonFleetEquipmentRepository(db)
  }

  private appendClosedStayEvent(stays: FieldStayReportItem[], seqId: number, open: FieldOpenStayState, point: TelemetryPoint) {
    const durationSeconds = Math.max(0, Math.floor((point.time.getTime() - open.enteredAt.getTime()) / 1000))
    stays.push({
      id: seqId,
      fieldId: open.fieldId,
      fieldName: open.fieldName,
      fleetEquipmentId: open.fleetEquipmentId,
      deviceId: open.deviceId,
      enteredAt: open.enteredAt.toISOString(),
      exitedAt: point.time.toISOString(),
      entryLat: open.entryLat,
      entryLng: open.entryLng,
      exitLat: point.lat,
      exitLng: point.lng,
      durationSeconds,
      durationMinutes: toStayMinutesRounded(durationSeconds)
    })
  }

  private appendOpenStayEvent(stays: FieldStayReportItem[], seqId: number, open: FieldOpenStayState) {
    const durationSeconds = 0
    stays.push({
      id: seqId,
      fieldId: open.fieldId,
      fieldName: open.fieldName,
      fleetEquipmentId: open.fleetEquipmentId,
      deviceId: open.deviceId,
      enteredAt: open.enteredAt.toISOString(),
      exitedAt: null,
      entryLat: open.entryLat,
      entryLng: open.entryLng,
      exitLat: null,
      exitLng: null,
      durationSeconds,
      durationMinutes: toStayMinutesRounded(durationSeconds)
    })
  }

  private async loadActiveFieldsAndAssignments(params: FieldStayReportParams) {
    const [allFields, allAssignments] = await Promise.all([
      this.fieldRepo.findAllActives(),
      this.fleetEquipmentRepo.getActiveAssignmentsByGpsIds(params.deviceIds)
    ])

    const filteredFields = allFields.filter(field => field.tipo === 'INTERES')

    const assignmentsByDevice = Object.fromEntries(
      (allAssignments as AssignmentRow[]).map(row => [row.idGps, row] as const)
    ) as Record<string, AssignmentRow>

    return {
      fields: filteredFields,
      assignmentsByDevice
    }
  }

  private buildReportSummaryWithTotals(params: FieldStayReportParams, stays: FieldStayReportItem[]): FieldStayReportResult {
    stays.sort((a, b) => new Date(b.enteredAt).getTime() - new Date(a.enteredAt).getTime())
    const totalSeconds = stays.reduce((acc, stay) => acc + stay.durationSeconds, 0)

    return {
      start: params.start,
      end: params.end,
      totalSeconds,
      totalMinutes: Number((totalSeconds / 60).toFixed(2)),
      totalHours: Number((totalSeconds / 3600).toFixed(2)),
      count: stays.length,
      stays
    }
  }

  private async fetchTelemetryPointsFromInflux(deviceIds: string[], start: Date, end: Date): Promise<TelemetryPoint[]> {
    if (!deviceIds.length) return []

    const sql = `
      SELECT time, device_id, lat, lng
      FROM telemetry
      WHERE time >= '${start.toISOString()}'
        AND time <= '${end.toISOString()}'
        AND device_id IN (${getDeviceFilter(deviceIds)})
      ORDER BY device_id ASC, time ASC
    `

    const points: TelemetryPoint[] = []
    for await (const row of this.influxClient.query(sql)) {
      const deviceId = String(row.device_id || '').trim()
      const lat = Number(row.lat)
      const lng = Number(row.lng)
      const time = new Date(row.time)

      if (!deviceId || !Number.isFinite(lat) || !Number.isFinite(lng) || Number.isNaN(time.getTime())) continue

      points.push({ deviceId, lat, lng, time })
    }

    return points
  }

  async getReport(params: FieldStayReportParams): Promise<FieldStayReportResult> {
    const { fields, assignmentsByDevice } = await this.loadActiveFieldsAndAssignments(params)
    const deviceIds = Object.keys(assignmentsByDevice)

    const telemetry = await this.fetchTelemetryPointsFromInflux(deviceIds, params.start, params.end)

    const openStayByKey = new Map<string, FieldOpenStayState>()
    const stays: FieldStayReportItem[] = []

    let seqId = 1

    for (const point of telemetry) {
      const assignment = assignmentsByDevice[point.deviceId]
      if (!assignment) continue

      for (const field of fields) {
        const inside = isInsideField(field, point.lat, point.lng)
        const key = `${point.deviceId}:${assignment.idAsignacion}:${field.id}`
        const open = openStayByKey.get(key)

        if (inside && !open) {
          openStayByKey.set(key, {
            fieldId: field.id,
            fieldName: field.nombre,
            fleetEquipmentId: assignment.idAsignacion,
            deviceId: point.deviceId,
            enteredAt: point.time,
            entryLat: point.lat,
            entryLng: point.lng
          })
          continue
        }

        if (!inside && open) {
          this.appendClosedStayEvent(stays, seqId++, open, point)
          openStayByKey.delete(key)
        }
      }
    }

    for (const open of openStayByKey.values()) {
      this.appendOpenStayEvent(stays, seqId++, open)
    }

    return this.buildReportSummaryWithTotals(params, stays)
  }
}

