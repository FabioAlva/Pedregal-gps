/**
 * Escape minimo para literales SQL en comillas simples.
 */

export const sqlSafe = (value: string) => value.replace(/'/g, "''")

/**
 * Construye filtro IN ('id1','id2',...) de forma segura.
 */

export const getDeviceFilter = (devices: string[]) =>
  devices.map((id) => `'${sqlSafe(id)}'`).join(', ')