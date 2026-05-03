import { watch } from 'vue'

const ADSENSE_PUBLISHER_ID = 'pub-XXXXXXXXXXXXXXXX' // Replace with your actual AdSense Publisher ID
const ADSENSE_SCRIPT_URL = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-${ADSENSE_PUBLISHER_ID}`

export const useGoogleAds = () => {
  const { advertisingAllowed } = useCookieConsent()
  const scriptLoaded = useState<boolean>('google-ads/script-loaded', () => false)

  const loadAdSenseScript = () => {
    if (!import.meta.client || scriptLoaded.value) return

    // Check if script is already in the DOM
    const existing = document.querySelector(`script[src*="adsbygoogle"]`)
    if (existing) {
      scriptLoaded.value = true
      return
    }

    const script = document.createElement('script')
    script.src = ADSENSE_SCRIPT_URL
    script.async = true
    script.crossOrigin = 'anonymous'
    script.onload = () => {
      scriptLoaded.value = true
    }
    script.onerror = () => {
      console.warn('[AdSense] Failed to load script — likely blocked by ad blocker')
    }
    document.head.appendChild(script)
  }

  const initAd = (element: HTMLElement | null) => {
    if (!import.meta.client || !element || !scriptLoaded.value) return

    try {
      const adsbygoogle = (window as any).adsbygoogle || []
      adsbygoogle.push({})
    } catch (e) {
      console.warn('[AdSense] Failed to initialize ad:', e)
    }
  }

  // Watch for consent changes and load script when advertising is allowed
  if (import.meta.client) {
    watch(advertisingAllowed, (allowed) => {
      if (allowed) {
        loadAdSenseScript()
      }
    }, { immediate: true })
  }

  return {
    scriptLoaded,
    advertisingAllowed,
    initAd,
    publisherId: ADSENSE_PUBLISHER_ID,
  }
}
