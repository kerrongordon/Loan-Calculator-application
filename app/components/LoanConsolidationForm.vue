<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useClipboard } from '@vueuse/core'
import { useForm } from '@tanstack/vue-form'
import type { ConsolidationLoanInput } from '~~/shared/loan'
import { consolidationInputSchema } from '~~/shared/loan'
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
} = useLoanConsolidation()
const { currency, percent } = useFormatters()
const { exportRowsAsCsv, exportRowsAsXlsx } = useHistoryExport()
const { isExportingPdf, pdfExportError, downloadPdf } = usePdfExport()

const minimumLoans = 2
const fieldErrors = ref<Record<string, string>>({})
type StringFieldHandler = {
  handleChange: (value: string) => void
}
type NumberFieldHandler = {
  handleChange: (value: number) => void
}
type ConsolidationHistoryItem = (typeof history.value)[number]
const isExportingXlsx = ref(false)
const exportingItemXlsxId = ref<number | null>(null)
const exportError = ref<string | null>(null)

const newLoan = (): ConsolidationLoanInput => ({
  principal: 12000,
  interestRate: 7.2,
  remainingTermMonths: 48
})

const loans = useState<ConsolidationLoanInput[]>('loan-consolidation/form-loans', () => [newLoan(), newLoan()])

const form = useForm({
  defaultValues: {
    label: '',
    newTermMonths: 60
  },
  onSubmit: async ({ value }) => {
    const payload = {
      ...value,
      loans: loans.value
    }
    const parsed = consolidationInputSchema.safeParse(payload)

    if (!parsed.success) {
      fieldErrors.value = toErrorMap(parsed.error.issues)
      return
    }

    fieldErrors.value = {}

    const result = calculate(parsed.data)
    await save(result)
  }
})

const formValues = form.useStore((state) => state.values)

const liveResult = computed(() => {
  const payload = {
    ...formValues.value,
    loans: loans.value
  }
  const parsed = consolidationInputSchema.safeParse(payload)
  return parsed.success ? calculate(parsed.data) : null
})

const suggestedTermMonths = computed(() => {
  const totalPrincipal = loans.value.reduce((sum: number, loan: ConsolidationLoanInput) => sum + loan.principal, 0)

  if (totalPrincipal === 0) {
    return 1
  }

  const weightedTerm = loans.value.reduce(
    (sum: number, loan: ConsolidationLoanInput) => sum + loan.principal * loan.remainingTermMonths,
    0
  )

  return Math.max(1, Math.round(weightedTerm / totalPrincipal))
})

const toErrorMap = (
  issues: Array<{ path: (string | number)[]; message: string }>
): Record<string, string> => {
  const errors: Record<string, string> = {}

  for (const issue of issues) {
    const key = issue.path.join('.')

    if (!errors[key]) {
      errors[key] = issue.message
    }
  }

  return errors
}

const toNumber = (event: Event): number => {
  const value = Number((event.target as HTMLInputElement).value)
  return Number.isFinite(value) ? value : 0
}

const exportRows = computed(() =>
  history.value.map((item) => ({
    id: item.id,
    createdAt: new Date(item.createdAt).toISOString(),
    label: item.label || '',
    loanCount: item.loans.length,
    totalConsolidatedPrincipal: item.totalConsolidatedPrincipal,
    weightedAverageInterestRate: item.weightedAverageInterestRate,
    newTermMonths: item.newTermMonths,
    suggestedTermMonths: item.suggestedTermMonths,
    monthlyPayment: item.monthlyPayment,
    currentMonthlyPayments: item.currentMonthlyPayments,
    monthlyPaymentDelta: item.monthlyPaymentDelta,
    totalInterest: item.totalInterest,
    currentTotalInterest: item.currentTotalInterest,
    interestDelta: item.interestDelta
  }))
)

const onStringInput = (field: StringFieldHandler, event: Event): void => {
  field.handleChange((event.target as HTMLInputElement).value)
}

const onNumberInput = (field: NumberFieldHandler, event: Event): void => {
  field.handleChange(toNumber(event))
}

const addLoan = (): void => {
  loans.value = [...loans.value, newLoan()]
}

const removeLoan = (index: number): void => {
  if (loans.value.length <= minimumLoans) {
    return
  }

  loans.value = loans.value.filter((_: ConsolidationLoanInput, currentIndex: number) => currentIndex !== index)
}

const updateLoan = (
  index: number,
  field: keyof ConsolidationLoanInput,
  event: Event
): void => {
  const nextLoans = [...loans.value]
  const currentLoan = nextLoans[index]

  if (!currentLoan) {
    return
  }

  nextLoans[index] = {
    ...currentLoan,
    [field]: toNumber(event)
  }

  loans.value = nextLoans
}

const onLoanNumberInput = (
  index: number,
  field: keyof ConsolidationLoanInput,
  event: Event
): void => {
  updateLoan(index, field, event)
}

const downloadHistoryCsv = (): void => {
  exportError.value = null
  exportRowsAsCsv(exportRows.value, 'loan-consolidation-history')
}

const downloadHistoryXlsx = async (): Promise<void> => {
  exportError.value = null
  isExportingXlsx.value = true

  try {
    await exportRowsAsXlsx(exportRows.value, 'loan-consolidation-history', 'Consolidations')
  } catch {
    exportError.value = 'XLSX export failed.'
  } finally {
    isExportingXlsx.value = false
  }
}

const toItemExportRows = (item: ConsolidationHistoryItem) =>
  item.amortization.map((row) => ({
    historyId: item.id,
    createdAt: new Date(item.createdAt).toISOString(),
    label: item.label || '',
    totalConsolidatedPrincipal: item.totalConsolidatedPrincipal,
    weightedAverageInterestRate: item.weightedAverageInterestRate,
    newTermMonths: item.newTermMonths,
    month: row.month,
    payment: row.payment,
    principalPayment: row.principal,
    interestPayment: row.interest,
    balance: row.balance
  }))

const downloadHistoryItemCsv = (item: ConsolidationHistoryItem): void => {
  exportError.value = null
  exportRowsAsCsv(toItemExportRows(item), `loan-consolidation-${item.id}`)
}

const downloadHistoryItemXlsx = async (item: ConsolidationHistoryItem): Promise<void> => {
  exportError.value = null
  exportingItemXlsxId.value = item.id

  try {
    await exportRowsAsXlsx(toItemExportRows(item), `loan-consolidation-${item.id}`, 'Consolidation')
  } catch {
    exportError.value = 'XLSX export failed.'
  } finally {
    exportingItemXlsxId.value = null
  }
}

const deleteHistoryItem = (item: ConsolidationHistoryItem): void => {
  if (!import.meta.client) {
    return
  }

  const shouldDelete = window.confirm('Delete this consolidation from history?')

  if (shouldDelete) {
    removeHistoryItem(item.id)
  }
}

const deleteAllHistory = (): void => {
  if (!import.meta.client) {
    return
  }

  const shouldDelete = window.confirm('Delete all consolidation history?')

  if (shouldDelete) {
    clearHistory()
  }
}

const syncValidation = (): void => {
  const parsed = consolidationInputSchema.safeParse({
    ...form.state.values,
    loans: loans.value
  })

  fieldErrors.value = parsed.success ? {} : toErrorMap(parsed.error.issues)
}

const applySuggestedTerm = (): void => {
  form.setFieldValue('newTermMonths', suggestedTermMonths.value)
  syncValidation()
}

const errorFor = (path: string): string | undefined => fieldErrors.value[path]

const route = useRoute()
const router = useRouter()
const { copy, copied } = useClipboard({ source: computed(() => window.location.href) })

onMounted(() => {
  void loadHistory()

  // Pre-fill from URL
  if (route.query.newTermMonths) form.setFieldValue('newTermMonths', Number(route.query.newTermMonths))
  if (route.query.loans) {
    try {
      const decodedLoans = JSON.parse(decodeURIComponent(route.query.loans as string))
      if (Array.isArray(decodedLoans) && decodedLoans.length >= 2) {
        loans.value = decodedLoans
      }
    } catch (e) {
      console.error('Failed to parse loans from URL')
    }
  }
})

// Sync form values to URL
watch([formValues, loans], ([newFormVals, newLoans]) => {
  router.replace({
    query: {
      ...route.query,
      newTermMonths: newFormVals.newTermMonths,
      loans: encodeURIComponent(JSON.stringify(newLoans))
    }
  })
}, { deep: true })
</script>

<template>
  <div class="space-y-8">
    <!-- Main Consolidation Card -->
    <div class="bg-white rounded-2xl shadow-card overflow-hidden">
      <div class="grid grid-cols-1 lg:grid-cols-2">

        <!-- LEFT: Form Inputs -->
        <div class="p-8 sm:p-10 lg:border-r border-border">
          <form @submit.prevent="form.handleSubmit">
            <div class="space-y-6">
              <!-- Scenario Label -->
              <form.Field name="label">
                <template #default="{ field }">
                  <div class="py-4 border-b border-border/60">
                    <label class="block text-sm font-semibold text-muted-foreground mb-2" :for="field.name">Scenario Label</label>
                    <Input
                      :id="field.name"
                      class="rounded-xl border-border bg-muted/50 px-4 py-3 text-base focus:ring-2 focus:ring-primary/30 focus:border-primary"
                      :model-value="field.state.value"
                      placeholder="Debt Refinance Option A"
                      @input="onStringInput(field, $event)"
                      @blur="field.handleBlur"
                    />
                  </div>
                </template>
              </form.Field>

              <!-- New Term -->
              <form.Field name="newTermMonths">
                <template #default="{ field }">
                  <div class="py-4 border-b border-border/60">
                    <div class="flex items-center justify-between mb-2">
                      <label class="text-sm font-semibold text-muted-foreground" :for="field.name">New Term</label>
                      <div class="flex items-center gap-1 border-b border-muted-foreground/30 focus-within:border-primary transition-colors pb-0.5">
                        <span class="text-muted-foreground font-semibold text-sm">Mo</span>
                        <input
                          :id="field.name"
                          class="w-16 bg-transparent border-none p-0 text-right text-base font-bold text-foreground focus:ring-0 focus:outline-none"
                          type="number"
                          :min="1"
                          step="1"
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
                    />
                    <p class="min-h-4 text-xs font-medium text-red-500 mt-1" :class="{ invisible: !errorFor('newTermMonths') }">
                      {{ errorFor('newTermMonths') || '-' }}
                    </p>
                    <button type="button" class="mt-2 text-xs font-semibold text-primary hover:text-primary/80 transition-colors" @click="applySuggestedTerm">
                      Use Suggested: {{ suggestedTermMonths }} mo
                    </button>
                  </div>
                </template>
              </form.Field>
            </div>

            <!-- Existing Loans -->
            <div class="space-y-4 pt-6">
              <div class="flex items-center justify-between">
                <label class="block text-sm font-bold text-foreground">Existing Loans</label>
                <button type="button" class="text-xs font-bold text-primary hover:text-primary/80 transition-colors" @click="addLoan">
                  + Add Loan
                </button>
              </div>

              <p v-if="errorFor('loans')" class="text-xs font-medium text-red-500 bg-red-50 p-3 rounded-xl border border-red-200">{{ errorFor('loans') }}</p>

              <div class="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                <div
                  v-for="(loan, index) in loans"
                  :key="`loan-${index}`"
                  class="flex flex-col gap-3 rounded-xl border border-border bg-muted/30 p-4 relative"
                >
                  <div class="absolute right-3 top-3">
                    <button type="button" class="text-red-400 hover:text-red-600 focus:outline-none disabled:opacity-30" :disabled="loans.length <= minimumLoans" @click="removeLoan(index)">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                    </button>
                  </div>
                  
                  <div class="font-bold text-xs text-muted-foreground uppercase tracking-wider">Loan {{ index + 1 }}</div>
                  
                  <div class="space-y-3">
                    <div class="grid grid-cols-2 gap-3">
                      <div>
                        <label class="block text-xs font-semibold text-muted-foreground mb-1">Principal</label>
                        <Input class="rounded-lg h-9 text-sm border-border" type="number" :min="1" step="0.01" :model-value="loan.principal" @input="onLoanNumberInput(index, 'principal', $event)" @blur="syncValidation" />
                      </div>
                      <div>
                        <label class="block text-xs font-semibold text-muted-foreground mb-1">Rate (%)</label>
                        <Input class="rounded-lg h-9 text-sm border-border" type="number" :min="0" :max="100" step="0.01" :model-value="loan.interestRate" @input="onLoanNumberInput(index, 'interestRate', $event)" @blur="syncValidation" />
                      </div>
                    </div>
                    <div>
                      <label class="block text-xs font-semibold text-muted-foreground mb-1">Remaining (mo)</label>
                      <Input class="rounded-lg h-9 text-sm border-border" type="number" :min="1" step="1" :model-value="loan.remainingTermMonths" @input="onLoanNumberInput(index, 'remainingTermMonths', $event)" @blur="syncValidation" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Action Buttons -->
            <div class="flex items-center gap-4 pt-8 mt-4 border-t border-border/60">
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
                type="button" 
                variant="outline" 
                class="h-11 rounded-xl text-xs font-semibold bg-white border-border text-muted-foreground hover:bg-muted transition-all px-4"
                @click="copy()"
              >
                {{ copied ? '✓ Copied' : 'Share' }}
              </Button>
            </div>
          </form>
        </div>

        <!-- RIGHT: Live Preview -->
        <div class="p-8 sm:p-10 flex flex-col items-center justify-center min-h-[480px] bg-white" v-if="liveResult" id="consolidation-live-preview">
          <div class="self-end mb-4" data-html2canvas-ignore="true">
            <button 
              type="button"
              class="text-xs font-semibold text-muted-foreground hover:text-primary transition-colors"
              :disabled="isExportingPdf" 
              @click="downloadPdf('consolidation-live-preview', 'loan-consolidation-summary.pdf')"
            >
              {{ isExportingPdf ? 'Generating...' : '↓ PDF' }}
            </button>
          </div>

          <DonutChart
            :data="[
              { label: 'Principal', value: liveResult.totalConsolidatedPrincipal, color: '#00c6fb' },
              { label: 'Interest', value: liveResult.totalInterest, color: '#ff6b35' }
            ]"
            :size="260"
            :strokeWidth="26"
            centerLabel="Consolidated total:"
            :centerValue="currency(liveResult.totalPayment)"
          />
          
          <div class="mt-10 flex flex-col gap-3 w-full max-w-sm text-sm">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div class="w-3 h-3 rounded-full bg-[#00c6fb]"></div>
                <span class="text-muted-foreground font-medium">New principal</span>
              </div>
              <span class="text-foreground font-bold">{{ currency(liveResult.totalConsolidatedPrincipal) }}</span>
            </div>
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div class="w-3 h-3 rounded-full bg-[#ff6b35]"></div>
                <span class="text-muted-foreground font-medium">Total interest</span>
              </div>
              <span class="text-foreground font-bold">{{ currency(liveResult.totalInterest) }}</span>
            </div>
            <div class="pt-3 mt-1 border-t border-border space-y-3">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <span class="text-muted-foreground font-medium">Weighted rate</span>
                  <Tooltip text="The blended average interest rate across all your combined loans, weighted by each loan's principal amount." />
                </div>
                <span class="text-foreground font-bold">{{ percent(liveResult.weightedAverageInterestRate) }}</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-muted-foreground font-medium">New payment</span>
                <span class="text-primary font-extrabold text-base">{{ currency(liveResult.monthlyPayment) }}</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-muted-foreground font-medium">Monthly delta</span>
                <span class="font-extrabold text-base" :class="liveResult.monthlyPaymentDelta <= 0 ? 'text-emerald-500' : 'text-red-500'">
                  {{ liveResult.monthlyPaymentDelta <= 0 ? '' : '+' }}{{ currency(liveResult.monthlyPaymentDelta) }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div v-else class="p-8 sm:p-10 flex items-center justify-center min-h-[480px]">
          <p class="text-muted-foreground font-medium text-center max-w-xs">Enter valid consolidation parameters to see your preview.</p>
        </div>

      </div>
    </div>

    <!-- Amortization -->
    <div v-if="liveResult" class="bg-white rounded-2xl shadow-card overflow-hidden p-8 sm:p-10">
      <div class="flex items-center gap-2 mb-6">
        <h3 class="text-lg font-bold text-foreground">Amortization Schedule</h3>
        <Tooltip text="A complete table showing how the new consolidated loan balance will decrease over the chosen term." />
      </div>
      <div class="bg-muted rounded-xl overflow-hidden border border-border mb-6 p-4">
        <AreaChart :data="liveResult.amortization" color="#00c6fb" class="h-48" />
      </div>
      <div class="bg-muted rounded-xl overflow-hidden border border-border">
        <AmortizationTable :rows="liveResult.amortization" />
      </div>
    </div>

    <!-- History -->
    <div class="bg-white rounded-2xl shadow-card overflow-hidden">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between p-6 sm:p-8 border-b border-border">
        <h2 class="text-lg font-bold text-foreground">Consolidation History</h2>
        <button type="button" class="text-xs font-semibold text-red-400 hover:text-red-500 transition-colors disabled:opacity-40 mt-4 sm:mt-0" :disabled="!hasHistory" @click="deleteAllHistory">
          Clear all
        </button>
      </div>
      <div class="p-6 sm:p-8">
        <p v-if="exportError" class="text-xs font-medium text-red-500 mb-4">{{ exportError }}</p>
        <p v-if="isLoadingHistory" class="text-sm font-medium text-muted-foreground animate-pulse">Loading history...</p>
        
        <div v-else-if="hasHistory" class="space-y-3">
          <details
            v-for="item in history"
            :key="item.id"
            class="group overflow-hidden rounded-xl border border-border bg-white transition-all hover:shadow-card-hover"
          >
            <summary class="cursor-pointer list-none p-5 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50">
              <div class="flex flex-wrap items-center justify-between gap-4">
                <div class="flex flex-col sm:flex-row sm:items-center gap-3">
                  <span class="rounded-full bg-muted border border-border px-3 py-1 text-sm font-bold text-foreground">{{ item.label || 'Untitled Scenario' }}</span>
                  <span class="text-sm font-medium text-muted-foreground">{{ new Date(item.createdAt).toLocaleString() }}</span>
                </div>
                <span class="text-lg font-extrabold text-foreground">{{ currency(item.monthlyPayment) }}<span class="text-sm font-medium text-muted-foreground">/mo</span></span>
              </div>
            </summary>
            <div class="space-y-4 border-t border-border p-5">
              <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p class="text-xs font-extrabold uppercase tracking-wider text-muted-foreground">Schedule Breakdown</p>
                <div class="flex flex-wrap gap-2">
                  <button type="button" class="text-xs font-semibold text-muted-foreground hover:text-primary transition-colors" @click.stop.prevent="downloadHistoryItemCsv(item)">CSV</button>
                  <button type="button" class="text-xs font-semibold text-muted-foreground hover:text-primary transition-colors" :disabled="exportingItemXlsxId === item.id" @click.stop.prevent="downloadHistoryItemXlsx(item)">
                    {{ exportingItemXlsxId === item.id ? '...' : 'XLSX' }}
                  </button>
                  <button type="button" class="text-xs font-semibold text-red-400 hover:text-red-500 transition-colors" @click.stop.prevent="deleteHistoryItem(item)">Delete</button>
                </div>
              </div>
              <div class="bg-muted rounded-xl overflow-hidden border border-border">
                <AmortizationTable :rows="item.amortization" />
              </div>
            </div>
          </details>
        </div>
        <p v-else class="text-sm font-medium text-muted-foreground py-12 text-center border border-dashed border-border rounded-xl bg-muted">No saved consolidations yet.</p>
      </div>
    </div>
  </div>
</template>

