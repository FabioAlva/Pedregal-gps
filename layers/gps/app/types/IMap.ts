export interface PointData {
  state: {
    reported: {
      lat: number
      lng: number
      ts: number
      sp: number
      ang: number
      alt: number
    }
  }
}


export type ProcessedRoute = {
  id: string
  points: [number, number][]
  name: string
  color: string
  speed: number
  status: 'online' | 'offline'
  stopTime: number
  maxSpeed: number
  avgSpeed: number
  maxSpeedTime: string
  lastPoint: [number, number] | null
  lastTime: string
  lastCoords: string
  prevPoint: [number, number] | null
  prevTime: string
  prevCoords: string
}


export interface MapDataForDevice {
  points: PointData[]
  totalStopHours: number
  maxSpeed: number
  avgSpeed: number
  maxSpeedTime: number | null
  lastPoint: PointData['state']['reported'] | null
  prevPoint: PointData['state']['reported'] | null
}
