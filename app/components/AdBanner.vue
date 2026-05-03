<script setup lang="ts">
interface Props {
  adSlot?: string
  adFormat?: 'auto' | 'rectangle' | 'horizontal' | 'vertical'
  adLayout?: string
  fullWidth?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  adSlot: '',
  adFormat: 'auto',
  adLayout: '',
  fullWidth: true,
})

const { scriptLoaded, advertisingAllowed, initAd, publisherId } = useGoogleAds()
const adRef = ref<HTMLElement | null>(null)
const adInitialized = ref(false)

watch(
  [scriptLoaded, () => adRef.value],
  ([loaded, el]) => {
    if (loaded && el && !adInitialized.value) {
      nextTick(() => {
        initAd(el)
        adInitialized.value = true
      })
    }
  },
  { immediate: true }
)
</script>

<template>
  <div
    class="ad-banner-wrapper my-4"
    :class="{ 'w-full': fullWidth }"
  >
    <!-- Ad slot when consent is given and script is loaded -->
    <div v-if="advertisingAllowed" ref="adRef" class="ad-container">
      <ins
        class="adsbygoogle"
        :style="fullWidth ? 'display:block' : 'display:inline-block'"
        :data-ad-client="`ca-${publisherId}`"
        :data-ad-slot="adSlot"
        :data-ad-format="adFormat"
        :data-ad-layout="adLayout || undefined"
        data-full-width-responsive="true"
      />
    </div>

    <!-- Placeholder when no consent -->
    <div
      v-else
      class="flex items-center justify-center rounded-xl border border-dashed border-border bg-muted/30 px-4 py-8 text-center"
    >
      <div class="space-y-1.5">
        <svg class="mx-auto h-6 w-6 text-muted-foreground/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
        </svg>
        <p class="text-xs text-muted-foreground/60">Ad space</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.ad-container {
  min-height: 90px;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
