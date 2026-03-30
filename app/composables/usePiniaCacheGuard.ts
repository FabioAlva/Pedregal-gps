type PiniaCacheGuardOptions = {
  force?: boolean
  hasData: boolean
  isFresh: boolean
}

export const shouldUsePiniaCache = (options: PiniaCacheGuardOptions) => {
  return options.force !== true && options.hasData && options.isFresh
}

export const buildDeviceRangeCacheKey = (devices: string[], start: string, end: string) => {
  const sortedDevices = [...devices].sort()
  return JSON.stringify({ devices: sortedDevices, start, end })
}
