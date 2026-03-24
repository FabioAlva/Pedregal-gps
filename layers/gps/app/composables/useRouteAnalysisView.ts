import { computed, ref } from 'vue'
import useFilter from './useFilter'
import { useRouteAnalysis } from './useRouteAnalysis'

export function useRouteAnalysisView() {
  const { fetchDevices } = useFilter()
  const {
    rows,
    rowsPreview,
    deviceSummaries,
    isLoading,
    errorMessage,
    fetchRouteAnalysis,
    exportRouteAnalysisCsv
  } = useRouteAnalysis()

  const showDetailTable = ref(false)

  const formatDuration = (seconds: number) => {
    const total = Math.max(0, Math.floor(seconds))
    const hh = Math.floor(total / 3600)
    const mm = Math.floor((total % 3600) / 60)
    const ss = total % 60

    return `${hh.toString().padStart(2, '0')}:${mm.toString().padStart(2, '0')}:${ss.toString().padStart(2, '0')}`
  }

  const formatCoords = (lat: number, lng: number) => `${lat.toFixed(6)}, ${lng.toFixed(6)}`

  const initialize = async () => {
    await fetchDevices()
    await fetchRouteAnalysis({ showValidationMessage: false })
  }

  const globalStats = computed(() => {
    const summaries = deviceSummaries.value
    const totalSegments = summaries.reduce((acc, item) => acc + item.totalSegments, 0)
    const overOneHour = summaries.reduce((acc, item) => acc + item.gapsOverOneHourCount, 0)
    const upToOneHour = summaries.reduce((acc, item) => acc + item.gapsUpToOneHourCount, 0)

    const avgGapSeconds = totalSegments > 0
      ? summaries.reduce((acc, item) => acc + (item.avgGapSeconds * item.totalSegments), 0) / totalSegments
      : 0

    const maxGapSeconds = summaries.reduce((acc, item) => Math.max(acc, item.maxGapSeconds), 0)

    return {
      totalSegments,
      overOneHour,
      upToOneHour,
      overOneHourPct: totalSegments > 0 ? Number(((overOneHour / totalSegments) * 100).toFixed(2)) : 0,
      upToOneHourPct: totalSegments > 0 ? Number(((upToOneHour / totalSegments) * 100).toFixed(2)) : 0,
      avgGapSeconds: Number(avgGapSeconds.toFixed(2)),
      maxGapSeconds
    }
  })

  const hasRows = computed(() => rows.value.length > 0)

  const gapDistributionOption = computed(() => {
    const lessThanOneHour = rows.value.filter(row => row.durationSeconds < 3600).length
    const greaterOrEqualOneHour = rows.value.length - lessThanOneHour
    const total = rows.value.length

    if (total <= 0) {
      return {
        tooltip: { show: false },
        legend: { show: false },
        series: [
          {
            type: 'pie',
            radius: ['44%', '72%'],
            center: ['50%', '45%'],
            silent: true,
            label: {
              show: true,
              position: 'center',
              formatter: 'Sin datos\nde brechas',
              color: '#94a3b8',
              fontSize: 14,
              fontWeight: 600
            },
            data: [{ name: 'Sin datos', value: 1 }],
            color: ['#334155']
          }
        ]
      }
    }

    const values = [
      { name: '< 1h entre reportes GPS', value: lessThanOneHour },
      { name: '> 1h entre reportes GPS', value: greaterOrEqualOneHour }
    ]

    return {
      title: { show: false },
      tooltip: {
        trigger: 'item',
        formatter: '{b}<br/>Cantidad de brechas: <b>{c}</b><br/>Porcentaje: <b>{d}%</b>'
      },
      legend: {
        bottom: 6,
        left: 'center'
      },
      series: [
        {
          type: 'pie',
          radius: ['44%', '72%'],
          center: ['50%', '43%'],
          minAngle: 8,
          avoidLabelOverlap: true,
          data: values,
          color: ['#22c55e', '#ef4444'],
          label: {
            show: true,
            formatter: '{b}: {d}%'
          }
        }
      ]
    }
  })

  const getTrendBucketMinutes = (spanMs: number) => {
    const diffDays = spanMs / (1000 * 60 * 60 * 24)
    if (diffDays > 7) return 24 * 60
    if (diffDays > 1) return 20
    return 1
  }

  const aggregatePointsByBucket = (points: { ts: number, gapMin: number }[], bucketMinutes: number) => {
    const bucketMs = bucketMinutes * 60 * 1000
    const buckets = new Map<number, { sum: number, count: number }>()

    points.forEach((point) => {
      const bucketTs = Math.floor(point.ts / bucketMs) * bucketMs
      if (!buckets.has(bucketTs)) buckets.set(bucketTs, { sum: 0, count: 0 })
      const current = buckets.get(bucketTs)!
      current.sum += point.gapMin
      current.count += 1
    })

    return [...buckets.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([ts, stat]) => [ts, Number((stat.sum / stat.count).toFixed(2))])
  }

  const trendBucketMinutes = computed(() => {
    if (!rows.value.length) return 5
    const sorted = rows.value.slice().sort((a, b) => a.startTs - b.startTs)
    const minTs = sorted[0]?.startTs ?? 0
    const maxTs = sorted[sorted.length - 1]?.startTs ?? 0
    const spanMs = Math.max(0, maxTs - minTs)
    return getTrendBucketMinutes(spanMs)
  })

  const trendBucketLabel = computed(() => {
    if (trendBucketMinutes.value >= 1440) return '1 day'
    if (trendBucketMinutes.value >= 60) return `${Math.floor(trendBucketMinutes.value / 60)}h`
    return `${trendBucketMinutes.value} min`
  })

  const gapHistogramOption = computed(() => {
    const buckets = [
      { label: '<= 5m', min: 0, max: 300 },
      { label: '5m - 15m', min: 300, max: 900 },
      { label: '15m - 30m', min: 900, max: 1800 },
      { label: '30m - 1h', min: 1800, max: 3600 },
      { label: '1h - 2h', min: 3600, max: 7200 },
      { label: '> 2h', min: 7200, max: Number.POSITIVE_INFINITY }
    ]

    const counts = buckets.map((bucket) => {
      return rows.value.filter((row) => row.durationSeconds > bucket.min && row.durationSeconds <= bucket.max).length
    })

    return {
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      grid: { left: 28, right: 20, top: 24, bottom: 48 },
      xAxis: {
        type: 'category',
        data: buckets.map(item => item.label),
        axisLabel: { rotate: 10 }
      },
      yAxis: {
        type: 'value'
      },
      series: [
        {
          type: 'bar',
          data: counts,
          itemStyle: { color: '#3b82f6', borderRadius: [5, 5, 0, 0] },
          label: { show: true, position: 'top' }
        }
      ]
    }
  })

  const gapTimelineOption = computed(() => {
    const grouped = new Map<string, { ts: number, gapMin: number }[]>()

    rows.value.forEach((row) => {
      if (!grouped.has(row.deviceName)) grouped.set(row.deviceName, [])
      grouped.get(row.deviceName)!.push({
        ts: row.startTs,
        gapMin: Number((row.durationSeconds / 60).toFixed(2))
      })
    })

    const sourceVehicles = [...grouped.entries()]
      .sort((a, b) => b[1].length - a[1].length)
      .slice(0, 6)

    const colorByName = new Map(deviceSummaries.value.map(item => [item.deviceName, item.deviceColor]))

    const series = sourceVehicles.map(([name, points]) => ({
      name,
      type: 'line',
      smooth: false,
      showSymbol: false,
      data: aggregatePointsByBucket(
        points
          .sort((a, b) => a.ts - b.ts)
          .map(p => ({ ts: p.ts, gapMin: p.gapMin })),
        trendBucketMinutes.value
      ),
      color: colorByName.get(name) || undefined,
      itemStyle: {
        color: colorByName.get(name) || undefined
      },
      lineStyle: {
        width: 1.8,
        color: colorByName.get(name) || undefined
      }
    }))

    return {
      tooltip: {
        trigger: 'axis',
        valueFormatter: (value: number) => `${value} min`,
        formatter: (params: any[]) => {
          if (!params?.length) return ''
          const time = new Date(params[0].value[0]).toLocaleString('es-PE')
          const lines = params.map((p: any) => `${p.marker} ${p.seriesName}: <b>${p.value[1]} min</b>`).join('<br/>')
          return `Hora del punto inicial: <b>${time}</b><br/>${lines}`
        }
      },
      legend: {
        type: 'scroll',
        bottom: 6,
        left: 'center'
      },
      grid: { left: 30, right: 16, top: 44, bottom: 58 },
      xAxis: {
        type: 'time'
      },
      yAxis: {
        type: 'value',
        axisLabel: { formatter: '{value} min' }
      },
      series: series.map((serie: any) => ({
        ...serie,
        markLine: {
          silent: true,
          lineStyle: { color: '#ef4444', type: 'dashed' },
          data: [{ yAxis: 60, name: '1h' }]
        }
      }))
    }
  })

  return {
    rows,
    rowsPreview,
    deviceSummaries,
    isLoading,
    errorMessage,
    fetchRouteAnalysis,
    exportRouteAnalysisCsv,
    formatDuration,
    formatCoords,
    globalStats,
    hasRows,
    showDetailTable,
    gapDistributionOption,
    gapHistogramOption,
    gapTimelineOption,
    trendBucketLabel,
    initialize
  }
}
