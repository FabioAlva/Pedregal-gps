export const formatTime = (ts: number) => {
  return new Intl.DateTimeFormat('es-PE', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).format(new Date(ts))
}

export const getISODate = (
  date: Date | string | number | null | undefined
): string | null => {
  if (date == null) return null

  const parsed = date instanceof Date ? date : new Date(date)
  if (Number.isNaN(parsed.getTime())) return null

  return parsed.toISOString()
}

// export const formatLocalDate = (ts: number) => {
//   if (import.meta.server) return '--'
//   return new Intl.DateTimeFormat(undefined, {  // undefined = locale del usuario
//     day: '2-digit', month: '2-digit', year: 'numeric',
//     hour: '2-digit', minute: '2-digit',
//     hour12: false
//   }).format(new Date(ts))
// }

export const formatLocalDate = (ts: number) => {
  if (import.meta.server) return '--'
  return new Intl.DateTimeFormat('es-PE', {
    timeZone: 'America/Lima',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).format(new Date(ts))
}

export const parseLocalDateStr = (dateStr: string | null): string => {
  if (!dateStr) return 'Vigente'
  const datePart = dateStr.split('T')[0]?.split(' ')[0] ?? dateStr
  const parts = datePart.split('-').map(Number)
  const year = parts[0] ?? 0
  const month = parts[1] ?? 1
  const day = parts[2] ?? 1
  return new Intl.DateTimeFormat('es-PE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(new Date(year, month - 1, day))
}
