<script setup lang="ts">
import { computed, ref } from 'vue'

interface ChartRow {
  month: number
  balance: number
  principal: number
  interest: number
  payment: number
}

interface Series {
  key: keyof ChartRow
  label: string
  color: string
  active: boolean
}

const props = defineProps<{
  data: ChartRow[]
  color?: string
}>()

const chartColor = computed(() => props.color || '#00c6fb')

const series = ref<Series[]>([
  { key: 'balance', label: 'Balance', color: '#00c6fb', active: true },
  { key: 'principal', label: 'Principal', color: '#10b981', active: true },
  { key: 'interest', label: 'Interest', color: '#ff6b35', active: true }
])

const toggleSeries = (index: number) => {
  const s = series.value[index]
  if (s) s.active = !s.active
}

const viewBoxWidth = 1000
const viewBoxHeight = 280
const padding = { top: 20, right: 20, bottom: 30, left: 50 }

const chartWidth = viewBoxWidth - padding.left - padding.right
const chartHeight = viewBoxHeight - padding.top - padding.bottom

const maxValue = computed(() => {
  if (!props.data || props.data.length === 0) return 0
  let max = 0
  for (const s of series.value) {
    if (!s.active) continue
    for (const d of props.data) {
      const val = d[s.key] as number
      if (val > max) max = val
    }
  }
  return max * 1.08
})

const buildPath = (key: keyof ChartRow): string => {
  if (!props.data || props.data.length === 0) return ''
  const xStep = chartWidth / Math.max(1, props.data.length - 1)

  const coords = props.data.map((d, i) => {
    const x = padding.left + i * xStep
    const val = d[key] as number
    const y = padding.top + chartHeight - (val / maxValue.value) * chartHeight
    return `${x},${y}`
  })

  return `M ${coords.join(' L ')}`
}

const buildArea = (key: keyof ChartRow): string => {
  const path = buildPath(key)
  if (!path) return ''
  const bottomY = padding.top + chartHeight
  const rightX = padding.left + chartWidth
  const leftX = padding.left
  return `${path} L ${rightX},${bottomY} L ${leftX},${bottomY} Z`
}

// Y-axis labels
const yLabels = computed(() => {
  const max = maxValue.value
  if (max === 0) return []
  const steps = 4
  return Array.from({ length: steps + 1 }, (_, i) => {
    const value = (max / steps) * (steps - i)
    const y = padding.top + (chartHeight / steps) * i
    return { value, y, label: formatCompact(value) }
  })
})

// X-axis labels
const xLabels = computed(() => {
  if (!props.data || props.data.length === 0) return []
  const count = Math.min(6, props.data.length)
  const step = Math.max(1, Math.floor((props.data.length - 1) / (count - 1)))
  const labels: { month: number; x: number }[] = []
  const xStep = chartWidth / Math.max(1, props.data.length - 1)

  for (let i = 0; i < props.data.length; i += step) {
    const row = props.data[i]
    if (row) {
      labels.push({
        month: row.month,
        x: padding.left + i * xStep
      })
    }
  }
  // Always include last
  const last = props.data[props.data.length - 1]
  const lastX = padding.left + (props.data.length - 1) * xStep
  if (last && !labels.find(l => l.month === last.month)) {
    labels.push({ month: last.month, x: lastX })
  }
  return labels
})

const formatCompact = (n: number): string => {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`
  if (n >= 1000) return `${(n / 1000).toFixed(0)}K`
  return n.toFixed(0)
}
</script>

<template>
  <div class="w-full">
    <!-- Legend -->
    <div class="flex flex-wrap items-center gap-4 mb-3 px-1">
      <button
        v-for="(s, i) in series"
        :key="s.key"
        type="button"
        class="flex items-center gap-2 text-xs font-semibold transition-all"
        :class="s.active ? 'opacity-100' : 'opacity-40'"
        @click="toggleSeries(i)"
      >
        <span class="w-3 h-0.5 rounded-full" :style="{ backgroundColor: s.color }"></span>
        <span class="text-muted-foreground">{{ s.label }}</span>
      </button>
    </div>

    <!-- Chart -->
    <div class="w-full min-h-[20rem]">
      <svg :viewBox="`0 0 ${viewBoxWidth} ${viewBoxHeight}`" class="w-full h-full" preserveAspectRatio="none">
        <defs>
          <linearGradient v-for="s in series" :key="`grad-${s.key}`" :id="`areaGrad-${s.key}`" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" :stop-color="s.color" stop-opacity="0.15" />
            <stop offset="100%" :stop-color="s.color" stop-opacity="0.0" />
          </linearGradient>
        </defs>

        <!-- Grid Lines -->
        <line
          v-for="label in yLabels"
          :key="`grid-${label.value}`"
          :x1="padding.left"
          :y1="label.y"
          :x2="viewBoxWidth - padding.right"
          :y2="label.y"
          stroke="rgba(0,0,0,0.06)"
          stroke-dasharray="4"
        />

        <!-- Y-axis labels -->
        <text
          v-for="label in yLabels"
          :key="`ylabel-${label.value}`"
          :x="padding.left - 8"
          :y="label.y + 4"
          text-anchor="end"
          class="fill-muted-foreground"
          font-size="14"
          font-weight="500"
        >
          {{ label.label }}
        </text>

        <!-- X-axis labels -->
        <text
          v-for="label in xLabels"
          :key="`xlabel-${label.month}`"
          :x="label.x"
          :y="viewBoxHeight - 4"
          text-anchor="middle"
          class="fill-muted-foreground"
          font-size="14"
          font-weight="500"
        >
          {{ label.month }}
        </text>

        <!-- Series -->
        <template v-for="s in series" :key="s.key">
          <template v-if="s.active">
            <!-- Area Fill -->
            <path :d="buildArea(s.key)" :fill="`url(#areaGrad-${s.key})`" class="transition-all duration-500 ease-in-out" />
            <!-- Line Stroke -->
            <path :d="buildPath(s.key)" fill="none" :stroke="s.color" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="transition-all duration-500 ease-in-out" />
          </template>
        </template>
      </svg>
    </div>
  </div>
</template>
