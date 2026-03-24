import type { Equipment as DbEquipment, Fleet as DbFleet } from '~~/shared/types/db'

export interface Gps {
  id: string | number
  name: string
  value: string
  label?: string
  urlMqtt: string
  state: number
  imei?: string
  topic?: string
  color: string
}

export interface Assignment {
  idAsignacion: number
  idGps: string
  nombreGps: string
  imei: string
  placaAuto: string
  fechaAsignacion: string
  fechaRetiro: string | null
}

export interface Fleet {
  id: number
  placa: string
}

export type EquipmentSpecifications = {
  topic?: string | null
  color?: string | null
} | null

export type EquipmentApiItem = Pick<DbEquipment, 'id' | 'nombre' | 'codigo' | 'estadoId'> & {
  especificaciones?: EquipmentSpecifications
}

export type FleetApiItem = Pick<DbFleet, 'id' | 'placa'>
