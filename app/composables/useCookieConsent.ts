import { computed, onMounted } from 'vue'

export type ConsentStatus = 'pending' | 'accepted' | 'rejected'

export interface ConsentPreferences {
  analytics: boolean
  advertising: boolean
  functional: boolean
}

const CONSENT_KEY = 'cookie-consent-status'
const PREFERENCES_KEY = 'cookie-consent-preferences'

const DEFAULT_PREFERENCES: ConsentPreferences = {
  analytics: false,
  advertising: false,
  functional: true,
}

export const useCookieConsent = () => {
  const status = useState<ConsentStatus>('cookie-consent/status', () => 'pending')
  const preferences = useState<ConsentPreferences>('cookie-consent/preferences', () => ({
    ...DEFAULT_PREFERENCES,
  }))
  const showBanner = useState<boolean>('cookie-consent/show-banner', () => false)

  const hasConsented = computed(() => status.value !== 'pending')
  const advertisingAllowed = computed(() => status.value === 'accepted' && preferences.value.advertising)
  const analyticsAllowed = computed(() => status.value === 'accepted' && preferences.value.analytics)

  const persistState = () => {
    if (!import.meta.client) return
    localStorage.setItem(CONSENT_KEY, status.value)
    localStorage.setItem(PREFERENCES_KEY, JSON.stringify(preferences.value))
  }

  const acceptAll = () => {
    status.value = 'accepted'
    preferences.value = {
      analytics: true,
      advertising: true,
      functional: true,
    }
    showBanner.value = false
    persistState()
  }

  const rejectNonEssential = () => {
    status.value = 'rejected'
    preferences.value = {
      analytics: false,
      advertising: false,
      functional: true,
    }
    showBanner.value = false
    persistState()
  }

  const savePreferences = (prefs: Partial<ConsentPreferences>) => {
    preferences.value = {
      ...preferences.value,
      ...prefs,
      functional: true, // functional is always on
    }
    status.value = preferences.value.advertising || preferences.value.analytics
      ? 'accepted'
      : 'rejected'
    showBanner.value = false
    persistState()
  }

  const revokeConsent = () => {
    status.value = 'pending'
    preferences.value = { ...DEFAULT_PREFERENCES }
    showBanner.value = true
    persistState()
  }

  const openSettings = () => {
    showBanner.value = true
  }

  onMounted(() => {
    const stored = localStorage.getItem(CONSENT_KEY) as ConsentStatus | null
    if (stored && ['accepted', 'rejected'].includes(stored)) {
      status.value = stored
      try {
        const storedPrefs = localStorage.getItem(PREFERENCES_KEY)
        if (storedPrefs) {
          preferences.value = { ...DEFAULT_PREFERENCES, ...JSON.parse(storedPrefs) }
        }
      } catch {
        // ignore parse errors
      }
    } else {
      showBanner.value = true
    }
  })

  return {
    status,
    preferences,
    showBanner,
    hasConsented,
    advertisingAllowed,
    analyticsAllowed,
    acceptAll,
    rejectNonEssential,
    savePreferences,
    revokeConsent,
    openSettings,
  }
}
