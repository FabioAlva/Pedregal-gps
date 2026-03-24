import type { InfluxDBClient } from '@influxdata/influxdb3-client'

export const influxProvider = {
  client: null as InfluxDBClient | null
}

export const getInterval = (start: string, end: string): string => {
  const diffDays = (new Date(end).getTime() - new Date(start).getTime()) / (1000 * 60 * 60 * 24)
  if (diffDays > 7) return '1 day'
  if (diffDays > 1) return '20 minutes'
  return '1 minutes'
}

export const getRouteInterval = (start: string, end: string): string => {
  const diffDays = (new Date(end).getTime() - new Date(start).getTime()) / 86400000
  if (diffDays > 7) return '3 minutes'
  if (diffDays > 2) return '1 minutes'
  if (diffDays > 1) return '30 seconds'
  return '1 seconds'
}
