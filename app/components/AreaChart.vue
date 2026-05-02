<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  data: Array<{ month: number; balance: number }>
  color?: string
}>()

const chartColor = computed(() => props.color || '#0ea5e9')

const viewBoxWidth = 1000
const viewBoxHeight = 240
const padding = 20

const maxBalance = computed(() => {
  if (!props.data || props.data.length === 0) return 0
  // Max balance is usually the first data point
  return Math.max(...props.data.map((d) => d.balance)) * 1.05 // Add 5% headroom
})

const points = computed(() => {
  if (!props.data || props.data.length === 0) return ''
  
  const width = viewBoxWidth - padding * 2
  const height = viewBoxHeight - padding * 2
  const xStep = width / Math.max(1, props.data.length - 1)
  
  return props.data.map((d, index) => {
    const x = padding + index * xStep
    // Invert Y axis: 0 balance is at the bottom (height)
    const y = padding + height - (d.balance / maxBalance.value) * height
    return `${x},${y}`
  }).join(' ')
})

const pathD = computed(() => {
  if (!points.value) return ''
  // SVG Path: M x1 y1 L x2 y2 ...
  // We prepend M to the first point and replace space with L
  const coords = points.value.split(' ')
  if (coords.length === 0) return ''
  
  let d = `M ${coords[0]}`
  for (let i = 1; i < coords.length; i++) {
    d += ` L ${coords[i]}`
  }
  return d
})

const areaD = computed(() => {
  if (!pathD.value) return ''
  // To create the area, we draw the line, then line to bottom right, then line to bottom left, then close
  const width = viewBoxWidth - padding * 2
  const height = viewBoxHeight - padding * 2
  const bottomY = padding + height
  const rightX = viewBoxWidth - padding
  const leftX = padding
  
  return `${pathD.value} L ${rightX},${bottomY} L ${leftX},${bottomY} Z`
})
</script>

<template>
  <div class="w-full h-full min-h-[200px]">
    <svg :viewBox="`0 0 ${viewBoxWidth} ${viewBoxHeight}`" class="w-full h-full" preserveAspectRatio="none">
      <defs>
        <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" :stop-color="chartColor" stop-opacity="0.3" />
          <stop offset="100%" :stop-color="chartColor" stop-opacity="0.0" />
        </linearGradient>
      </defs>
      
      <!-- Grid Lines -->
      <line :x1="padding" :y1="padding" :x2="viewBoxWidth - padding" :y2="padding" stroke="rgba(0,0,0,0.05)" stroke-dasharray="4" />
      <line :x1="padding" :y1="padding + (viewBoxHeight - padding * 2) / 2" :x2="viewBoxWidth - padding" :y2="padding + (viewBoxHeight - padding * 2) / 2" stroke="rgba(0,0,0,0.05)" stroke-dasharray="4" />
      <line :x1="padding" :y1="viewBoxHeight - padding" :x2="viewBoxWidth - padding" :y2="viewBoxHeight - padding" stroke="rgba(0,0,0,0.1)" />

      <!-- Area Fill -->
      <path :d="areaD" fill="url(#areaGradient)" class="transition-all duration-500 ease-in-out" />
      
      <!-- Line Stroke -->
      <path :d="pathD" fill="none" :stroke="chartColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="transition-all duration-500 ease-in-out" />
    </svg>
  </div>
</template>
