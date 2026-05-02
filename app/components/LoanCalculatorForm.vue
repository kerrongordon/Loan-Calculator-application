<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useClipboard } from '@vueuse/core'
import { useForm } from '@tanstack/vue-form'
import { loanCalculatorInputSchema } from '~~/shared/loan'
import Button from '~/components/ui/button/Button.vue'
import Card from '~/components/ui/card/Card.vue'
import CardContent from '~/components/ui/card/CardContent.vue'
import CardDescription from '~/components/ui/card/CardDescription.vue'
import CardHeader from '~/components/ui/card/CardHeader.vue'
import CardTitle from '~/components/ui/card/CardTitle.vue'
import Input from '~/components/ui/input/Input.vue'
import Tooltip from '~/components/ui/tooltip/Tooltip.vue'

const {
  latestResult,
  history,
  hasHistory,
  isSaving,
  isLoadingHistory,
  calculate,
  save,
  loadHistory,
  removeHistoryItem,
  clearHistory
} = useLoanCalculator()
const { currency } = useFormatters()
const { exportRowsAsCsv, exportRowsAsXlsx } = useHistoryExport()
const { isExportingPdf, pdfExportError, downloadPdf } = usePdfExport()

const principalRule = loanCalculatorInputSchema.shape.principal
const interestRateRule = loanCalculatorInputSchema.shape.interestRate
const termRule = loanCalculatorInputSchema.shape.termMonths
type NumberFieldHandler = {
  handleChange: (value: number) => void
}
type LoanHistoryItem = (typeof history.value)[number]
const isExportingXlsx = ref(false)
const exportingItemXlsxId = ref<number | null>(null)
const exportError = ref<string | null>(null)
const showReport = ref(false)

const validateNumber = (rule: typeof principalRule, value: number): string | undefined => {
  const parsed = rule.safeParse(value)
  return parsed.success ? undefined : parsed.error.issues[0]?.message
}

const toNumber = (event: Event): number => {
  const parsed = Number((event.target as HTMLInputElement).value)
  return Number.isFinite(parsed) ? parsed : 0
}

const exportRows = computed(() =>
  history.value.map((item) => ({
    id: item.id,
    createdAt: new Date(item.createdAt).toISOString(),
    principal: item.principal,
    interestRate: item.interestRate,
    termMonths: item.termMonths,
    monthlyPayment: item.monthlyPayment,
    totalPayment: item.totalPayment,
    totalInterest: item.totalInterest
  }))
)

const onNumberInput = (field: NumberFieldHandler, event: Event): void => {
  field.handleChange(toNumber(event))
}

const formatTerm = (months: number): string => {
  const years = Math.floor(months / 12)
  const rem = months % 12
  if (years === 0) return `${rem}m`
  if (rem === 0) return `${years}y`
  return `${years}y ${rem}m`
}

const downloadHistoryCsv = (): void => {
  exportError.value = null
  exportRowsAsCsv(exportRows.value, 'loan-calculation-history')
}

const downloadHistoryXlsx = async (): Promise<void> => {
  exportError.value = null
  isExportingXlsx.value = true

  try {
    await exportRowsAsXlsx(exportRows.value, 'loan-calculation-history', 'Calculations')
  } catch {
    exportError.value = 'XLSX export failed.'
  } finally {
    isExportingXlsx.value = false
  }
}

const toItemExportRows = (item: LoanHistoryItem) =>
  item.amortization.map((row) => ({
    historyId: item.id,
    createdAt: new Date(item.createdAt).toISOString(),
    principal: item.principal,
    interestRate: item.interestRate,
    termMonths: item.termMonths,
    month: row.month,
    payment: row.payment,
    principalPayment: row.principal,
    interestPayment: row.interest,
    balance: row.balance
  }))

const downloadHistoryItemCsv = (item: LoanHistoryItem): void => {
  exportError.value = null
  exportRowsAsCsv(toItemExportRows(item), `loan-calculation-${item.id}`)
}

const downloadHistoryItemXlsx = async (item: LoanHistoryItem): Promise<void> => {
  exportError.value = null
  exportingItemXlsxId.value = item.id

  try {
    await exportRowsAsXlsx(toItemExportRows(item), `loan-calculation-${item.id}`, 'Calculation')
  } catch {
    exportError.value = 'XLSX export failed.'
  } finally {
    exportingItemXlsxId.value = null
  }
}

const deleteHistoryItem = (item: LoanHistoryItem): void => {
  if (!import.meta.client) {
    return
  }

  const shouldDelete = window.confirm('Delete this calculation from history?')

  if (shouldDelete) {
    removeHistoryItem(item.id)
  }
}

const deleteAllHistory = (): void => {
  if (!import.meta.client) {
    return
  }

  const shouldDelete = window.confirm('Delete all calculation history?')

  if (shouldDelete) {
    clearHistory()
  }
}

const displayError = (errors: unknown[]): string | null => {
  const first = errors[0]

  if (!first) {
    return null
  }

  if (typeof first === 'string') {
    return first
  }

  if (first instanceof Error) {
    return first.message
  }

  return String(first)
}

const form = useForm({
  defaultValues: {
    principal: 25000,
    interestRate: 6.5,
    termMonths: 60,
    extraMonthlyPayment: 0
  },
  onSubmit: async ({ value }) => {
    const parsed = loanCalculatorInputSchema.safeParse(value)

    if (!parsed.success) {
      return
    }

    const result = calculate(parsed.data)
    await save(result)

    form.reset()
  }
})

const formValues = form.useStore((state) => state.values)

const liveResult = computed(() => {
  const parsed = loanCalculatorInputSchema.safeParse(formValues.value)
  return parsed.success ? calculate(parsed.data) : null
})

const route = useRoute()
const router = useRouter()
const { copy, copied } = useClipboard({ source: computed(() => window.location.href) })

onMounted(() => {
  void loadHistory()

  // Pre-fill from URL
  if (route.query.principal) form.setFieldValue('principal', Number(route.query.principal))
  if (route.query.interestRate) form.setFieldValue('interestRate', Number(route.query.interestRate))
  if (route.query.termMonths) form.setFieldValue('termMonths', Number(route.query.termMonths))
  if (route.query.extraMonthlyPayment) form.setFieldValue('extraMonthlyPayment', Number(route.query.extraMonthlyPayment))
})

// Sync form values to URL
watch(formValues, (newVals) => {
  router.replace({
    query: {
      ...route.query,
      principal: newVals.principal,
      interestRate: newVals.interestRate,
      termMonths: newVals.termMonths,
      extraMonthlyPayment: newVals.extraMonthlyPayment > 0 ? newVals.extraMonthlyPayment : undefined
    }
  })
}, { deep: true })
</script>

<template>
  <div class="space-y-8 h-full">
    <!-- Top Row: 40/60 Split -->
    <div class="grid grid-cols-1 lg:grid-cols-[2fr_3fr] gap-6 xl:gap-8 items-start">
      
      <!-- LEFT: Calculator Form (40%) -->
      <Card class="bg-white/5 rounded-[2rem] shadow-sm border border-white/10 overflow-hidden backdrop-blur-xl">
        <CardHeader class="border-b border-white/10 bg-white/5 pb-6 pt-6 px-6 sm:px-8 flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle class="text-xl font-extrabold text-white tracking-tight">Loan Calculator</CardTitle>
            <CardDescription class="text-muted-foreground text-sm mt-1">
              Configure parameters to compute payment details and amortization.
            </CardDescription>
          </div>
          <Button type="button" variant="outline" class="h-9 px-4 rounded-full text-xs font-semibold bg-white/5 border-white/10 shadow-sm text-slate-300 mt-4 sm:mt-0" @click="copy()">
            {{ copied ? 'Copied!' : 'Copy Link' }}
          </Button>
        </CardHeader>
        <CardContent class="p-6 sm:p-8">
          <form class="space-y-8" @submit.prevent="form.handleSubmit">
            <form.Field
              name="principal"
              :validators="{ onBlur: ({ value }) => validateNumber(principalRule, value) }"
            >
              <template #default="{ field }">
                <div class="space-y-2">
                  <div class="flex items-center justify-between">
                    <div class="flex items-center gap-2">
                      <label class="block text-sm font-bold tracking-wide text-white" :for="field.name">Principal & Interest</label>
                      <Tooltip text="The total initial amount borrowed, which accrues interest over time." />
                    </div>
                    <div class="relative w-32 sm:w-40 flex items-center border-b border-white/20 focus-within:border-primary transition-colors pb-1">
                      <span class="text-muted-foreground font-bold mr-2">$</span>
                      <input
                        :id="field.name"
                        class="w-full bg-transparent border-none p-0 text-right text-lg font-bold text-white focus:ring-0 focus:outline-none"
                        type="number"
                        :min="1"
                        step="0.01"
                        :value="field.state.value"
                        @input="onNumberInput(field, $event)"
                        @blur="field.handleBlur"
                      />
                    </div>
                  </div>
                  <input
                    type="range"
                    min="1000"
                    max="1000000"
                    step="5000"
                    :value="field.state.value"
                    class="w-full cursor-pointer accent-primary mt-2"
                    @input="onNumberInput(field, $event)"
                    @blur="field.handleBlur"
                  />
                  <p class="min-h-4 text-xs font-medium text-red-500" :class="{ invisible: !(field.state.meta.isTouched && displayError(field.state.meta.errors)) }">
                    {{ displayError(field.state.meta.errors) || '-' }}
                  </p>
                </div>
              </template>
            </form.Field>

            <form.Field
              name="interestRate"
              :validators="{ onBlur: ({ value }) => validateNumber(interestRateRule, value) }"
            >
              <template #default="{ field }">
                <div class="space-y-2">
                  <div class="flex items-center justify-between">
                    <div class="flex items-center gap-2">
                      <label class="block text-sm font-bold tracking-wide text-white" :for="field.name">Rate of Interest</label>
                      <Tooltip text="The annual percentage rate (APR) charged for borrowing the money." />
                    </div>
                    <div class="relative w-24 sm:w-32 flex items-center border-b border-white/20 focus-within:border-primary transition-colors pb-1">
                      <span class="text-muted-foreground font-bold mr-2">%</span>
                      <input
                        :id="field.name"
                        class="w-full bg-transparent border-none p-0 text-right text-lg font-bold text-white focus:ring-0 focus:outline-none"
                        type="number"
                        :min="0"
                        :max="100"
                        step="0.01"
                        :value="field.state.value"
                        @input="onNumberInput(field, $event)"
                        @blur="field.handleBlur"
                      />
                    </div>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="15"
                    step="0.1"
                    :value="field.state.value"
                    class="w-full cursor-pointer accent-[#a855f7] mt-2"
                    @input="onNumberInput(field, $event)"
                    @blur="field.handleBlur"
                  />
                  <p class="min-h-4 text-xs font-medium text-red-500" :class="{ invisible: !(field.state.meta.isTouched && displayError(field.state.meta.errors)) }">
                    {{ displayError(field.state.meta.errors) || '-' }}
                  </p>
                </div>
              </template>
            </form.Field>

            <form.Field
              name="termMonths"
              :validators="{ onBlur: ({ value }) => validateNumber(termRule, value) }"
            >
              <template #default="{ field }">
                <div class="space-y-2">
                  <div class="flex items-center justify-between">
                    <label class="block text-sm font-bold tracking-wide text-white" :for="field.name">Loan Tenure (Months)</label>
                    <div class="relative w-24 sm:w-32 flex items-center border-b border-white/20 focus-within:border-primary transition-colors pb-1">
                      <span class="text-muted-foreground font-bold mr-2 text-sm">Mo</span>
                      <input
                        :id="field.name"
                        class="w-full bg-transparent border-none p-0 text-right text-lg font-bold text-white focus:ring-0 focus:outline-none"
                        type="number"
                        :min="1"
                        :step="1"
                        :value="field.state.value"
                        @input="onNumberInput(field, $event)"
                        @blur="field.handleBlur"
                      />
                    </div>
                  </div>
                  <input
                    type="range"
                    min="12"
                    max="360"
                    step="12"
                    :value="field.state.value"
                    class="w-full cursor-pointer accent-[#10b981] mt-2"
                    @input="onNumberInput(field, $event)"
                    @blur="field.handleBlur"
                  />
                  <p class="min-h-4 text-xs font-medium text-red-500" :class="{ invisible: !(field.state.meta.isTouched && displayError(field.state.meta.errors)) }">
                    {{ displayError(field.state.meta.errors) || '-' }}
                  </p>
                </div>
              </template>
            </form.Field>

            <form.Field
              name="extraMonthlyPayment"
            >
              <template #default="{ field }">
                <div class="space-y-2">
                  <div class="flex items-center justify-between">
                    <label class="block text-sm font-bold tracking-wide text-white" :for="field.name">Extra Payment</label>
                    <div class="relative w-24 sm:w-32 flex items-center border-b border-white/20 focus-within:border-primary transition-colors pb-1">
                      <span class="text-muted-foreground font-bold mr-2">$</span>
                      <input
                        :id="field.name"
                        class="w-full bg-transparent border-none p-0 text-right text-lg font-bold text-white focus:ring-0 focus:outline-none"
                        type="number"
                        :min="0"
                        step="1"
                        :value="field.state.value"
                        @input="onNumberInput(field, $event)"
                        @blur="field.handleBlur"
                      />
                    </div>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="5000"
                    step="50"
                    :value="field.state.value"
                    class="w-full cursor-pointer accent-teal-400 mt-2"
                    @input="onNumberInput(field, $event)"
                    @blur="field.handleBlur"
                  />
                  <p class="min-h-4 text-xs font-medium text-red-500" :class="{ invisible: !(field.state.meta.isTouched && displayError(field.state.meta.errors)) }">
                    {{ displayError(field.state.meta.errors) || '-' }}
                  </p>
                </div>
              </template>
            </form.Field>

            <div class="pt-8 mt-4 border-t border-white/10 flex flex-col gap-6">
              <div v-if="liveResult" class="flex items-center justify-between">
                <span class="text-xl font-extrabold text-white tracking-tight">EMI</span>
                <span class="text-2xl font-extrabold text-[#0ea5e9]">{{ currency(liveResult.monthlyPayment) }}</span>
              </div>
              <div class="flex items-center gap-4">
                <form.Subscribe :selector="(state) => ({ canSubmit: state.canSubmit, isSubmitting: state.isSubmitting })">
                  <template #default="{ canSubmit, isSubmitting }">
                    <Button 
                      class="flex-1 h-12 rounded-xl text-sm font-bold bg-[#1e1b4b] hover:bg-[#1e1b4b]/90 text-white shadow-sm transition-all"
                      type="submit" 
                      :disabled="!canSubmit || isSubmitting || isSaving"
                    >
                      {{ isSubmitting || isSaving ? 'Saving...' : 'Save result' }}
                    </Button>
                  </template>
                </form.Subscribe>
                <Button 
                  v-if="liveResult"
                  type="button" 
                  variant="outline" 
                  class="flex-1 h-12 rounded-xl text-sm font-bold bg-transparent border-white/20 text-white hover:bg-white/5 transition-all"
                  @click="showReport = !showReport"
                >
                  {{ showReport ? 'Hide report' : 'View report' }}
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      <!-- RIGHT: Live Preview (60%) -->
      <div class="flex flex-col gap-6" v-if="liveResult">
        <Card id="calculator-live-preview" class="bg-white/5 rounded-[2rem] shadow-sm border border-white/10 overflow-hidden backdrop-blur-xl">
          <CardHeader data-html2canvas-ignore="true" class="border-b border-white/10 bg-white/5 flex flex-col sm:flex-row sm:items-center sm:justify-between pb-6 pt-6 px-6 sm:px-8">
            <CardTitle class="text-xl font-extrabold text-white tracking-tight">Live Calculation Preview</CardTitle>
            <Button type="button" variant="outline" class="h-9 px-4 rounded-full text-xs font-semibold bg-white/5 border-white/10 shadow-sm text-slate-300 mt-4 sm:mt-0" :disabled="isExportingPdf" @click="downloadPdf('calculator-live-preview', 'loan-calculation-summary.pdf')">
              {{ isExportingPdf ? 'Generating PDF...' : 'Download PDF' }}
            </Button>
          </CardHeader>
          <CardContent class="p-6 sm:p-8 flex flex-col items-center min-h-[500px]">
            <div class="flex-1 flex flex-col items-center justify-center w-full">
              <DonutChart
                :data="[
                  { label: 'Principal', value: formValues.principal, color: '#0ea5e9' },
                  { label: 'Interest', value: liveResult.totalInterest, color: '#10b981' }
                ]"
                :size="320"
                :strokeWidth="36"
                centerLabel="Total amount"
                :centerValue="currency(liveResult.totalPayment)"
              />
              
              <div class="mt-12 flex flex-col gap-4 w-full max-w-xs text-sm font-semibold">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-3">
                    <div class="w-3 h-3 rounded-full bg-[#0ea5e9]"></div>
                    <span class="text-slate-300">Principal amount</span>
                  </div>
                  <span class="text-white text-base">{{ currency(formValues.principal) }}</span>
                </div>
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-3">
                    <div class="w-3 h-3 rounded-full bg-[#10b981]"></div>
                    <span class="text-slate-300">Total interest</span>
                  </div>
                  <span class="text-white text-base">{{ currency(liveResult.totalInterest) }}</span>
                </div>
                <template v-if="liveResult.interestSaved > 0">
                  <div class="flex items-center justify-between pt-4 mt-2 border-t border-white/10">
                    <div class="flex items-center gap-3">
                      <div class="w-3 h-3 rounded-full bg-primary shadow-[0_0_8px_rgba(14,165,233,0.8)]"></div>
                      <span class="text-primary">Interest saved</span>
                    </div>
                    <span class="text-white text-base">{{ currency(liveResult.interestSaved) }}</span>
                  </div>
                  <div class="flex items-center justify-between">
                    <div class="flex items-center gap-3">
                      <div class="w-3 h-3 rounded-full bg-primary shadow-[0_0_8px_rgba(14,165,233,0.8)]"></div>
                      <span class="text-primary">Time saved</span>
                    </div>
                    <span class="text-white text-base">{{ formValues.termMonths - liveResult.actualTermMonths }} months</span>
                  </div>
                </template>
              </div>
            </div>

            <div v-if="showReport" class="w-full mt-12 animate-in slide-in-from-top-4 fade-in duration-300">
               <div class="flex items-center mb-4">
                 <h3 class="text-lg font-bold text-white">Amortization Schedule</h3>
                 <Tooltip text="A complete table of periodic loan payments, showing the amount of principal and the amount of interest that comprise each payment." />
               </div>
               <div class="bg-black/20 rounded-xl overflow-hidden border border-white/10 mb-6 p-4">
                 <AreaChart :data="liveResult.amortization" color="#0ea5e9" class="h-48" />
               </div>
               <div class="bg-black/20 rounded-xl overflow-hidden border border-white/10">
                 <AmortizationTable :rows="liveResult.amortization" />
               </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div v-else class="flex items-center justify-center h-full bg-white/5 backdrop-blur-xl rounded-[2rem] shadow-sm border border-white/10 border-dashed min-h-[400px]">
         <p class="text-muted-foreground font-medium text-center max-w-xs">Enter valid loan parameters to see your live preview.</p>
      </div>

    </div>

    <!-- Bottom: History (Full width) -->
    <Card class="bg-white/5 rounded-[2rem] shadow-sm border border-white/10 overflow-hidden w-full backdrop-blur-xl">
      <CardHeader class="border-b border-white/10 bg-white/5 flex flex-col sm:flex-row sm:items-center sm:justify-between pb-6 pt-6 px-6 sm:px-8">
        <CardTitle class="text-xl font-extrabold text-white tracking-tight">Calculation History</CardTitle>
        <div class="flex flex-wrap gap-3 mt-4 sm:mt-0">
          <Button type="button" variant="outline" class="h-9 px-4 rounded-full text-xs font-semibold bg-white/5 border-white/10 shadow-sm text-slate-300" :disabled="!hasHistory" @click="downloadHistoryCsv">
            CSV
          </Button>
          <Button type="button" variant="outline" class="h-9 px-4 rounded-full text-xs font-semibold bg-white/5 border-white/10 shadow-sm text-slate-300" :disabled="!hasHistory || isExportingXlsx" @click="downloadHistoryXlsx">
            {{ isExportingXlsx ? '...' : 'XLSX' }}
          </Button>
          <Button type="button" variant="ghost" class="h-9 px-4 rounded-full text-xs font-semibold text-red-400 hover:text-red-300 hover:bg-red-500/20" :disabled="!hasHistory" @click="deleteAllHistory">
            Delete All
          </Button>
        </div>
      </CardHeader>
      
      <CardContent class="p-6 sm:p-8">
        <p v-if="exportError" class="text-xs font-medium text-red-500">{{ exportError }}</p>
        <p v-if="isLoadingHistory" class="text-sm font-medium text-muted-foreground/70 animate-pulse">Loading calculation history...</p>
        
        <div v-else-if="hasHistory" class="space-y-4">
          <details
            v-for="item in history"
            :key="item.id"
            class="group overflow-hidden rounded-[1.5rem] border border-white/10 bg-black/20 transition-all shadow-sm open:shadow-md"
          >
            <summary class="cursor-pointer list-none p-6 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50">
              <div class="flex flex-wrap items-center justify-between gap-4">
                <div class="flex flex-col sm:flex-row sm:items-center gap-4">
                   <span class="text-sm font-medium text-muted-foreground">{{ new Date(item.createdAt).toLocaleString() }}</span>
                   <span class="rounded-full bg-white/5 border border-white/10 px-4 py-1.5 text-xs font-bold text-white">{{ item.interestRate.toFixed(2) }}% &mdash; {{ formatTerm(item.termMonths) }}</span>
                </div>
                <span class="text-xl font-extrabold text-white">{{ currency(item.monthlyPayment) }}<span class="text-sm font-medium text-muted-foreground">/mo</span></span>
              </div>
            </summary>
            <div class="space-y-6 border-t border-white/10 bg-transparent p-6">
              <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <p class="text-xs font-extrabold uppercase tracking-wider text-muted-foreground">Schedule Breakdown</p>
                <div class="flex flex-wrap gap-2">
                  <Button type="button" variant="outline" class="h-8 px-4 rounded-full text-xs font-semibold bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 hover:text-white" @click.stop.prevent="downloadHistoryItemCsv(item)">
                    CSV
                  </Button>
                  <Button type="button" variant="outline" class="h-8 px-4 rounded-full text-xs font-semibold bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 hover:text-white" :disabled="exportingItemXlsxId === item.id" @click.stop.prevent="downloadHistoryItemXlsx(item)">
                    {{ exportingItemXlsxId === item.id ? '...' : 'XLSX' }}
                  </Button>
                  <Button type="button" variant="ghost" class="h-8 px-4 rounded-full text-xs font-semibold text-red-400 hover:text-red-300 hover:bg-red-500/20" @click.stop.prevent="deleteHistoryItem(item)">
                    Delete
                  </Button>
                </div>
              </div>
              <div class="bg-black/20 rounded-2xl overflow-hidden border border-white/10 shadow-sm">
                <AmortizationTable :rows="item.amortization" />
              </div>
            </div>
          </details>
        </div>
        <p v-else class="text-sm font-medium text-muted-foreground/70 py-12 text-center border border-dashed border-white/20 rounded-[2rem] bg-black/20 backdrop-blur-md">No saved calculations yet.</p>
      </CardContent>
    </Card>
  </div>
</template>
