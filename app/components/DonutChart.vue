<script setup lang="ts">
import { computed } from 'vue'

export interface DonutChartItem {
  label: string
  value: number
  color: string
}

const props = withDefaults(defineProps<{
  data: DonutChartItem[]
  size?: number
  strokeWidth?: number
  centerLabel?: string
  centerValue?: string
}>(), {
  size: 200,
  strokeWidth: 20
})

const radius = computed(() => (props.size - props.strokeWidth) / 2)
const circumference = computed(() => 2 * Math.PI * radius.value)
const center = computed(() => props.size / 2)

const total = computed(() => props.data.reduce((sum, item) => sum + item.value, 0))

const segments = computed(() => {
  let cumulativeValue = 0
  return props.data.map(item => {
    const percentage = total.value === 0 ? 0 : item.value / total.value
    const dashLength = percentage * circumference.value
    const gapLength = circumference.value - dashLength
    const offset = - (cumulativeValue / total.value) * circumference.value
    cumulativeValue += item.value
    
    return {
      ...item,
      percentage,
      dasharray: `${dashLength} ${gapLength}`,
      dashoffset: offset
    }
  })
})
</script>

<template>
  <div class="relative inline-flex items-center justify-center flex-col" :style="{ width: `${size}px`, height: `${size}px` }">
    <svg :width="size" :height="size" :viewBox="`0 0 ${size} ${size}`" class="transform -rotate-90">
      <circle
        v-if="total === 0"
        :cx="center"
        :cy="center"
        :r="radius"
        fill="transparent"
        class="stroke-border"
        :stroke-width="strokeWidth"
      />
      
      <circle
        v-for="(segment, index) in segments"
        :key="index"
        :cx="center"
        :cy="center"
        :r="radius"
        fill="transparent"
        :stroke="segment.color"
        :stroke-width="strokeWidth"
        :stroke-dasharray="segment.dasharray"
        :stroke-dashoffset="segment.dashoffset"
        stroke-linecap="round"
        class="transition-all duration-1000 ease-out"
      />
    </svg>
    <div v-if="centerLabel || centerValue" class="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center p-4">
      <span v-if="centerLabel" class="text-xs font-medium tracking-wider text-muted-foreground">{{ centerLabel }}</span>
      <span v-if="centerValue" class="text-xl sm:text-2xl font-black text-foreground truncate max-w-[75%]">{{ centerValue }}</span>
    </div>
  </div>
</template>
