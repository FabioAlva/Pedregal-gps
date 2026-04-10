import { NeonFleetEquipmentRepository } from '../../../../fleet-management/server/Repository/NeonFleetEquipmentRepository'
import { NeonGeofenceRepository } from '../../Repository/NeonGeofenceRepository'
import { isInsideGeofence } from '../../utils/geofence-geometry'
import { getDeviceFilter } from '../../utils/influx-sql'
import type {
  AssignmentRow,
  GeofenceStayReportItem,
  GeofenceStayReportParams,
  GeofenceStayReportResult,
  GeofenceOpenStayState,
  TelemetryPoint
} from '../../schemas/IGeofenceStayReport'

/**
 * Convierte una duracion en segundos a minutos con 2 decimales.
 * Se usa para exponer valores legibles en el reporte final.
 */

const toStayMinutesRounded = (seconds: number) => Number((seconds / 60).toFixed(2))

export class GeofenceStayInfluxService {

  private geofenceRepo: NeonGeofenceRepository
  private fleetEquipmentRepo: NeonFleetEquipmentRepository

  constructor(private db: any, private influxClient: any) {
    this.geofenceRepo = new NeonGeofenceRepository(db)
    this.fleetEquipmentRepo = new NeonFleetEquipmentRepository(db)
  }

  /**
   * Registra una estancia cerrada al detectar salida de geocerca.
   * Calcula duracion y guarda coordenadas de entrada/salida.
   */

  private appendClosedStayEvent(stays: GeofenceStayReportItem[], seqId: number, open: GeofenceOpenStayState, point: TelemetryPoint) {
    const durationSeconds = Math.max(0, Math.floor((point.time.getTime() - open.enteredAt.getTime()) / 1000))
    stays.push({
      id: seqId,
      geofenceId: open.geofenceId,
      geofenceName: open.geofenceName,
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

  /**
   * Registra una estancia que sigue abierta al finalizar el rango consultado.
   * En este caso no existe salida ni duracion cerrada.
   */

  private appendOpenStayEvent(stays: GeofenceStayReportItem[], seqId: number, open: GeofenceOpenStayState) {
    const durationSeconds = 0
    stays.push({
      id: seqId,
      geofenceId: open.geofenceId,
      geofenceName: open.geofenceName,
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

  /**
   * Carga fuentes base para el reporte:
   * 1.- Aqui se obtienen las los registros de equipo_flota vigentes (Asignaciones vigentes por id)
    y las areas activas .
   * 2.- Se contruye un diccionario con id del gps y su asignacion para tener flota , placa , etc {123213123,{placa , fecharetiro,etc}} 
   */

  private async loadActiveGeofencesAndAssignments(params: GeofenceStayReportParams) {

    /*1*/

    const [allGeofences, allAssignments] = await Promise.all([
      this.geofenceRepo.findAllActives(),
      this.fleetEquipmentRepo.getActiveAssignmentsByGpsIds(params.deviceIds)
    ])
    /*2*/

    const assignmentsByDevice = Object.fromEntries(
      (allAssignments as AssignmentRow[]).map(row => [row.idGps, row] as const)
    ) as Record<string, AssignmentRow>

    return {
      geofences: allGeofences, 
      assignmentsByDevice
    }
  }

  /**
   * Ordena las estancias por fecha de ingreso (mas reciente primero)
   * y calcula acumulados globales del reporte.
   */

  private buildReportSummaryWithTotals(params: GeofenceStayReportParams, stays: GeofenceStayReportItem[]): GeofenceStayReportResult {
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

  /**
   * Consulta telemetria en Influx para los deviceIds solicitados.
   * Solo devuelve puntos validos y en orden por device/tiempo.
   */
  
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

  /**
   * Genera el reporte de estancias por geocerca a partir de telemetria Influx.
   * Flujo:
   * 1) carga geocercas activas y asignaciones activas
   * 2) Obtiene los idgps de las asignaciones activas para filtrar la consulta a Influx
   * 2) consulta telemetria del rango solicitado
   * 3) detecta eventos de entrada/salida por geocerca
   * 4) consolida estancias y totales
   */

  async getReport(params: GeofenceStayReportParams): Promise<GeofenceStayReportResult> {
    /* 1 */
    const { geofences, assignmentsByDevice } = await this.loadActiveGeofencesAndAssignments(params)
    /* 2 */
    const deviceIds = Object.keys(assignmentsByDevice)

    const telemetry = await this.fetchTelemetryPointsFromInflux(deviceIds, params.start, params.end)

    const openStayByKey = new Map<string, GeofenceOpenStayState>()
    const stays: GeofenceStayReportItem[] = []

    let seqId = 1

    // Recorremos punto por punto y abrimos/cerramos estancias segun corresponda.
    for (const point of telemetry) {
      const assignment = assignmentsByDevice[point.deviceId]
      if (!assignment) continue

      for (const geofence of geofences) {
        const inside = isInsideGeofence(geofence, point.lat, point.lng)
        const key = `${point.deviceId}:${assignment.idAsignacion}:${geofence.id}`
        const open = openStayByKey.get(key)

        if (inside && !open) {
          // Entrada: comienza una nueva estancia.
          openStayByKey.set(key, {
            geofenceId: geofence.id,
            geofenceName: geofence.nombre,
            fleetEquipmentId: assignment.idAsignacion,
            deviceId: point.deviceId,
            enteredAt: point.time,
            entryLat: point.lat,
            entryLng: point.lng
          })
          continue
        }

        if (!inside && open) {
          // Salida: cerramos estancia y guardamos su duracion.
          this.appendClosedStayEvent(stays, seqId++, open, point)
          openStayByKey.delete(key)
        }
      }
    }

    // Si una estancia sigue abierta al final del rango, la devolvemos como vigente.
    for (const open of openStayByKey.values()) {
      this.appendOpenStayEvent(stays, seqId++, open)
    }

    // 4) Ordenar y agregar metricas globales.
    return this.buildReportSummaryWithTotals(params, stays)
  }
}
