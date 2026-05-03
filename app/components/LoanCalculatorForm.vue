<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useClipboard } from '@vueuse/core'
import { useForm } from '@tanstack/vue-form'
import { loanCalculatorInputSchema } from '~~/shared/loan'
import Button from '~/components/ui/button/Button.vue'
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
  <div class="space-y-8">
    <!-- Main Calculator Card -->
    <div class="bg-card rounded-2xl shadow-card overflow-hidden">
      <div class="grid grid-cols-1 lg:grid-cols-2">

        <!-- LEFT: Form Inputs -->
        <div class="p-8 sm:p-10 lg:border-r border-border">
          <form @submit.prevent="form.handleSubmit">

            <!-- Loan Amount -->
            <form.Field
              name="principal"
              :validators="{ onBlur: ({ value }) => validateNumber(principalRule, value) }"
            >
              <template #default="{ field }">
                <div class="py-6 border-b border-border/60">
                  <div class="flex items-center justify-between mb-4">
                    <div class="flex items-center gap-2">
                      <label class="text-sm font-semibold text-muted-foreground" :for="field.name">Loan amount</label>
                      <Tooltip text="The total initial amount you are borrowing from the lender." />
                    </div>
                    <div class="flex items-center gap-1 border-b border-muted-foreground/30 focus-within:border-primary transition-colors pb-0.5">
                      <span class="text-muted-foreground font-semibold text-sm">$</span>
                      <input
                        :id="field.name"
                        class="w-28 bg-transparent border-none p-0 text-right text-base font-bold text-foreground focus:ring-0 focus:outline-none"
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
                    class="w-full"
                    @input="onNumberInput(field, $event)"
                    @blur="field.handleBlur"
                  />
                  <p class="min-h-4 text-xs font-medium text-red-500 mt-1" :class="{ invisible: !(field.state.meta.isTouched && displayError(field.state.meta.errors)) }">
                    {{ displayError(field.state.meta.errors) || '-' }}
                  </p>
                </div>
              </template>
            </form.Field>

            <!-- Rate of Interest -->
            <form.Field
              name="interestRate"
              :validators="{ onBlur: ({ value }) => validateNumber(interestRateRule, value) }"
            >
              <template #default="{ field }">
                <div class="py-6 border-b border-border/60">
                  <div class="flex items-center justify-between mb-4">
                    <div class="flex items-center gap-2">
                      <label class="text-sm font-semibold text-muted-foreground" :for="field.name">Rate of interest</label>
                      <Tooltip text="The annual percentage rate (APR) charged for borrowing the money." />
                    </div>
                    <div class="flex items-center gap-1 border-b border-muted-foreground/30 focus-within:border-primary transition-colors pb-0.5">
                      <span class="text-muted-foreground font-semibold text-sm">%</span>
                      <input
                        :id="field.name"
                        class="w-20 bg-transparent border-none p-0 text-right text-base font-bold text-foreground focus:ring-0 focus:outline-none"
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
                    class="w-full"
                    @input="onNumberInput(field, $event)"
                    @blur="field.handleBlur"
                  />
                  <p class="min-h-4 text-xs font-medium text-red-500 mt-1" :class="{ invisible: !(field.state.meta.isTouched && displayError(field.state.meta.errors)) }">
                    {{ displayError(field.state.meta.errors) || '-' }}
                  </p>
                </div>
              </template>
            </form.Field>

            <!-- Loan Tenure -->
            <form.Field
              name="termMonths"
              :validators="{ onBlur: ({ value }) => validateNumber(termRule, value) }"
            >
              <template #default="{ field }">
                <div class="py-6 border-b border-border/60">
                  <div class="flex items-center justify-between mb-4">
                    <label class="text-sm font-semibold text-muted-foreground" :for="field.name">Loan tenure</label>
                    <div class="flex items-center gap-1 border-b border-muted-foreground/30 focus-within:border-primary transition-colors pb-0.5">
                      <span class="text-muted-foreground font-semibold text-sm">Months</span>
                      <input
                        :id="field.name"
                        class="w-16 bg-transparent border-none p-0 text-right text-base font-bold text-foreground focus:ring-0 focus:outline-none"
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
                    class="w-full"
                    @input="onNumberInput(field, $event)"
                    @blur="field.handleBlur"
                  />
                  <p class="min-h-4 text-xs font-medium text-red-500 mt-1" :class="{ invisible: !(field.state.meta.isTouched && displayError(field.state.meta.errors)) }">
                    {{ displayError(field.state.meta.errors) || '-' }}
                  </p>
                </div>
              </template>
            </form.Field>

            <!-- Extra Payment -->
            <form.Field name="extraMonthlyPayment">
              <template #default="{ field }">
                <div class="py-6">
                  <div class="flex items-center justify-between mb-4">
                    <div class="flex items-center gap-2">
                      <label class="text-sm font-semibold text-muted-foreground" :for="field.name">Extra payment</label>
                      <Tooltip text="Optional additional amount paid each month to reduce the loan faster." />
                    </div>
                    <div class="flex items-center gap-1 border-b border-muted-foreground/30 focus-within:border-primary transition-colors pb-0.5">
                      <span class="text-muted-foreground font-semibold text-sm">$</span>
                      <input
                        :id="field.name"
                        class="w-20 bg-transparent border-none p-0 text-right text-base font-bold text-foreground focus:ring-0 focus:outline-none"
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
                    class="w-full"
                    @input="onNumberInput(field, $event)"
                    @blur="field.handleBlur"
                  />
                </div>
              </template>
            </form.Field>

            <!-- EMI Display -->
            <div v-if="liveResult" class="flex items-center justify-between py-6 border-t border-border/60">
              <span class="text-lg font-extrabold text-foreground">EMI</span>
              <span class="text-2xl font-extrabold text-primary">{{ currency(liveResult.monthlyPayment) }}</span>
            </div>

            <!-- Action Buttons -->
            <div class="flex items-center gap-4 pt-4">
              <form.Subscribe :selector="(state) => ({ canSubmit: state.canSubmit, isSubmitting: state.isSubmitting })">
                <template #default="{ canSubmit, isSubmitting }">
                  <Button 
                    class="flex-1 h-11 rounded-xl text-sm font-bold bg-primary hover:bg-primary/90 text-white shadow-sm transition-all"
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
                class="flex-1 h-11 rounded-xl text-sm font-bold bg-card border-border text-foreground hover:bg-muted transition-all"
                @click="showReport = !showReport"
              >
                {{ showReport ? 'Hide report' : 'View report' }}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                class="h-11 rounded-xl text-xs font-semibold bg-card border-border text-muted-foreground hover:bg-muted transition-all px-4"
                @click="copy()"
              >
                {{ copied ? '✓ Copied' : 'Share' }}
              </Button>
            </div>
          </form>
        </div>

        <!-- RIGHT: Donut Chart + Legend -->
        <div class="p-8 sm:p-10 flex flex-col items-center justify-center min-h-[480px] bg-card" v-if="liveResult" id="calculator-live-preview">
          <!-- PDF Download -->
          <div class="self-end mb-4" data-html2canvas-ignore="true">
            <button 
              type="button"
              class="text-xs font-semibold text-muted-foreground hover:text-primary transition-colors"
              :disabled="isExportingPdf" 
              @click="downloadPdf('calculator-live-preview', 'loan-calculation-summary.pdf')"
            >
              {{ isExportingPdf ? 'Generating...' : '↓ PDF' }}
            </button>
          </div>

          <DonutChart
            :data="[
              { label: 'Principal', value: formValues.principal, color: '#00c6fb' },
              { label: 'Interest', value: liveResult.totalInterest, color: '#ff6b35' }
            ]"
            :size="280"
            :strokeWidth="28"
            centerLabel="Total amount:"
            :centerValue="currency(liveResult.totalPayment)"
          />
          
          <!-- Legend -->
          <div class="mt-10 flex flex-col gap-3 w-full max-w-xs text-sm">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div class="w-3 h-3 rounded-full bg-[#00c6fb]"></div>
                <span class="text-muted-foreground font-medium">Principal amount</span>
              </div>
              <span class="text-foreground font-bold">{{ currency(formValues.principal) }}</span>
            </div>
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div class="w-3 h-3 rounded-full bg-[#ff6b35]"></div>
                <span class="text-muted-foreground font-medium">Total interest</span>
              </div>
              <span class="text-foreground font-bold">{{ currency(liveResult.totalInterest) }}</span>
            </div>
            <!-- Savings if extra payment -->
            <template v-if="liveResult.interestSaved > 0">
              <div class="flex items-center justify-between pt-3 mt-1 border-t border-border">
                <div class="flex items-center gap-3">
                  <div class="w-3 h-3 rounded-full bg-emerald-500"></div>
                  <span class="text-emerald-600 font-medium">Interest saved</span>
                </div>
                <span class="text-emerald-600 font-bold">{{ currency(liveResult.interestSaved) }}</span>
              </div>
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                  <div class="w-3 h-3 rounded-full bg-emerald-500"></div>
                  <span class="text-emerald-600 font-medium">Time saved</span>
                </div>
                <span class="text-emerald-600 font-bold">{{ formValues.termMonths - liveResult.actualTermMonths }} mo</span>
              </div>
            </template>
          </div>
        </div>

        <!-- Empty state -->
        <div v-else class="p-8 sm:p-10 flex items-center justify-center min-h-[480px]">
          <p class="text-muted-foreground font-medium text-center max-w-xs">Enter valid loan parameters to see your calculation.</p>
        </div>

      </div>
    </div>

    <!-- Amortization Report (toggleable) -->
    <Transition name="fade-slide" mode="out-in">
      <div v-if="showReport && liveResult" class="bg-card rounded-2xl shadow-card overflow-hidden p-8 sm:p-10">
        <div class="flex items-center justify-between mb-6">
          <div class="flex items-center gap-2">
            <h3 class="text-lg font-bold text-foreground">Amortization Schedule</h3>
            <Tooltip text="A complete table of periodic loan payments, showing the amount of principal and the amount of interest that comprise each payment." />
          </div>
        </div>
        <div class="bg-muted rounded-xl overflow-hidden border border-border mb-6 p-4">
          <AreaChart :data="liveResult.amortization" color="#00c6fb" class="h-80" />
        </div>
        <div class="bg-muted rounded-xl overflow-hidden border border-border">
          <AmortizationTable :rows="liveResult.amortization" />
        </div>
      </div>
    </Transition>

    <!-- History -->
    <div class="bg-card rounded-2xl shadow-card overflow-hidden">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between p-6 sm:p-8 border-b border-border">
        <h2 class="text-lg font-bold text-foreground">Calculation History</h2>
        <div class="flex flex-wrap gap-3 mt-4 sm:mt-0">
          <button type="button" class="text-xs font-semibold text-muted-foreground hover:text-primary transition-colors disabled:opacity-40" :disabled="!hasHistory" @click="downloadHistoryCsv">
            CSV
          </button>
          <button type="button" class="text-xs font-semibold text-muted-foreground hover:text-primary transition-colors disabled:opacity-40" :disabled="!hasHistory || isExportingXlsx" @click="downloadHistoryXlsx">
            {{ isExportingXlsx ? '...' : 'XLSX' }}
          </button>
          <button type="button" class="text-xs font-semibold text-red-400 hover:text-red-500 transition-colors disabled:opacity-40" :disabled="!hasHistory" @click="deleteAllHistory">
            Clear all
          </button>
        </div>
      </div>
      
      <div class="p-6 sm:p-8">
        <p v-if="exportError" class="text-xs font-medium text-red-500 mb-4">{{ exportError }}</p>
        <p v-if="isLoadingHistory" class="text-sm font-medium text-muted-foreground animate-pulse">Loading history...</p>
        
        <div v-else-if="hasHistory" class="space-y-3">
          <details
            v-for="item in history"
            :key="item.id"
            class="group overflow-hidden rounded-xl border border-border bg-card transition-all hover:shadow-card-hover"
          >
            <summary class="cursor-pointer list-none p-5 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50">
              <div class="flex flex-wrap items-center justify-between gap-4">
                <div class="flex flex-col sm:flex-row sm:items-center gap-3">
                   <span class="text-sm font-medium text-muted-foreground">{{ new Date(item.createdAt).toLocaleString() }}</span>
                   <span class="rounded-full bg-muted border border-border px-3 py-1 text-xs font-bold text-foreground">{{ item.interestRate.toFixed(2) }}% &mdash; {{ formatTerm(item.termMonths) }}</span>
                </div>
                <span class="text-lg font-extrabold text-foreground">{{ currency(item.monthlyPayment) }}<span class="text-sm font-medium text-muted-foreground">/mo</span></span>
              </div>
            </summary>
            <div class="space-y-4 border-t border-border p-5">
              <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p class="text-xs font-extrabold uppercase tracking-wider text-muted-foreground">Schedule Breakdown</p>
                <div class="flex flex-wrap gap-2">
                  <button type="button" class="text-xs font-semibold text-muted-foreground hover:text-primary transition-colors" @click.stop.prevent="downloadHistoryItemCsv(item)">
                    CSV
                  </button>
                  <button type="button" class="text-xs font-semibold text-muted-foreground hover:text-primary transition-colors" :disabled="exportingItemXlsxId === item.id" @click.stop.prevent="downloadHistoryItemXlsx(item)">
                    {{ exportingItemXlsxId === item.id ? '...' : 'XLSX' }}
                  </button>
                  <button type="button" class="text-xs font-semibold text-red-400 hover:text-red-500 transition-colors" @click.stop.prevent="deleteHistoryItem(item)">
                    Delete
                  </button>
                </div>
              </div>
              <div class="bg-muted rounded-xl overflow-hidden border border-border">
                <AmortizationTable :rows="item.amortization" />
              </div>
            </div>
          </details>
        </div>
        <p v-else class="text-sm font-medium text-muted-foreground py-12 text-center border border-dashed border-border rounded-xl bg-muted">No saved calculations yet.</p>
      </div>
    </div>
  </div>
</template>
