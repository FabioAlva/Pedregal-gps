export interface SpeedReportPoint {
  state: {
    reported: {
      ts: number
      sp: number
    }
  }
}

export interface DeviceSpeedReport {
  points: SpeedReportPoint[]
  maxSpeed: number
  avgSpeed: number
  maxSpeedTime?: number | null
}
