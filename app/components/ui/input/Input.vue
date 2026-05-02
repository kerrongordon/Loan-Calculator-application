<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    modelValue?: string | number
    type?: string
    placeholder?: string
    min?: number
    max?: number
    step?: number | string
    class?: string
    disabled?: boolean
  }>(),
  {
    modelValue: '',
    type: 'text',
    placeholder: '',
    class: '',
    disabled: false
  }
)

const emit = defineEmits<{
  'update:modelValue': [value: string]
  input: [event: Event]
  blur: [event: FocusEvent]
}>()

const onInput = (event: Event): void => {
  emit('input', event)
  emit('update:modelValue', (event.target as HTMLInputElement).value)
}

const onBlur = (event: FocusEvent): void => {
  emit('blur', event)
}
</script>

<template>
  <input
    :value="modelValue"
    :type="type"
    :placeholder="placeholder"
    :min="min"
    :max="max"
    :step="step"
    :disabled="disabled"
    :class="[
      'h-10 w-full rounded-md border border-white/10 bg-black/20 px-3 py-2 text-sm text-foreground shadow-sm outline-none transition-colors placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/40 disabled:cursor-not-allowed disabled:opacity-50 backdrop-blur-md',
      props.class
    ]"
    @input="onInput"
    @blur="onBlur"
  />
</template>
