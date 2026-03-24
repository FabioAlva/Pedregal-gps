export interface RouteAnalysisSegment {
  startTs: number
  endTs: number
  startLat: number
  startLng: number
  endLat: number
  endLng: number
  durationSeconds: number
  distanceKm: number
  startSpeedKmh: number
  endSpeedKmh: number
  idleSeconds: number
  isIdle: boolean
}

export interface RouteAnalysisSummary {
  totalPoints: number
  totalSegments: number
  totalDistanceKm: number
  totalIdleSeconds: number
  totalMovingSeconds: number
  totalDurationSeconds: number
  avgMovingSpeedKmh: number
  maxSegmentDistanceKm: number
  gapsUpToOneHourCount: number
  gapsOverOneHourCount: number
  gapsUpToOneHourPct: number
  gapsOverOneHourPct: number
  minGapSeconds: number
  maxGapSeconds: number
  avgGapSeconds: number
  p95GapSeconds: number
}

export interface RouteAnalysisDevice {
  summary: RouteAnalysisSummary
  segments: RouteAnalysisSegment[]
}

export type RouteAnalysisByDevice = Record<string, RouteAnalysisDevice>
