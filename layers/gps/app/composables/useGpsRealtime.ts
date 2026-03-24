import { createSharedComposable, useEventSource } from '@vueuse/core'
import { computed } from 'vue'

export const useGpsRealtime = createSharedComposable(() => {
  const { status, data, open, close } = useEventSource('/telemetry/realtime', [], {
    immediate: false,
    autoReconnect: true
  })

  return {
    telemetryData: data,
    isStreaming: computed(() => status.value === 'OPEN'),
    startRealtime: open,
    stopRealtime: close
  }
})
