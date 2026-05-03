<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    variant?: 'default' | 'outline' | 'ghost'
    type?: 'button' | 'submit' | 'reset'
    disabled?: boolean
    class?: string
  }>(),
  {
    variant: 'default',
    type: 'button',
    disabled: false,
    class: ''
  }
)

const classes = computed(() => {
  const base =
    'inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50'

  if (props.variant === 'outline') {
    return `${base} border border-border bg-card text-foreground hover:bg-muted ${props.class}`
  }

  if (props.variant === 'ghost') {
    return `${base} text-foreground hover:bg-muted ${props.class}`
  }

  return `${base} bg-primary text-primary-foreground hover:opacity-90 ${props.class}`
})
</script>

<template>
  <button :type="type" :disabled="disabled" :class="classes">
    <slot />
  </button>
</template>
