export interface SpeedPoint {
  state: {
    reported: {
      ts: number
      sp: number
    }
  }
}

export interface DeviceSpeedReport {
  points: SpeedPoint[]
  maxSpeed: number
  avgSpeed: number
}

export interface StopPoint {
  duration: number
}
