import type { MapRoutePoint } from './IMapRoutePoint.js'

export interface DeviceMapStats {
  points: MapRoutePoint[]
  totalStopHours: number
  maxSpeed: number
  avgSpeed: number
  maxSpeedTime: number | null
  lastPoint: MapRoutePoint['state']['reported'] | null
  prevPoint: MapRoutePoint['state']['reported'] | null
}

export type MapDataWithStatsResponse = Record<string, DeviceMapStats>
