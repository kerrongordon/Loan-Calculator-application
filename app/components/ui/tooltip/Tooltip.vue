<script setup lang="ts">
import { ref } from 'vue'

defineProps<{
  text: string
}>()

const isVisible = ref(false)
</script>

<template>
  <div 
    class="relative inline-flex items-center justify-center ml-1"
    @mouseenter="isVisible = true"
    @mouseleave="isVisible = false"
  >
    <div class="cursor-help w-4 h-4 rounded-full border border-border bg-muted flex items-center justify-center text-[10px] font-bold text-muted-foreground hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-colors">
      ?
    </div>
    
    <Transition name="fade">
      <div 
        v-if="isVisible"
        class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 rounded-xl bg-foreground text-white shadow-lg z-50 text-xs font-medium leading-relaxed text-center pointer-events-none"
      >
        {{ text }}
        <!-- Triangle pointer -->
        <div class="absolute top-full left-1/2 -translate-x-1/2 -mt-[1px] border-solid border-t-foreground border-t-8 border-x-transparent border-x-8 border-b-0"></div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translate(-50%, 5px);
}
</style>
