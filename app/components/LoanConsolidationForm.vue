<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
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

const liveResult = computed(() => {
  const payload = {
    ...form.state.values,
    loans: loans.value
  }
  const parsed = consolidationInputSchema.safeParse(payload)
  return parsed.success ? calculate(parsed.data) : null
})

const suggestedTermMonths = computed(() => {
  const totalPrincipal = loans.value.reduce((sum, loan) => sum + loan.principal, 0)

  if (totalPrincipal === 0) {
    return 1
  }

  const weightedTerm = loans.value.reduce(
    (sum, loan) => sum + loan.principal * loan.remainingTermMonths,
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

  loans.value = loans.value.filter((_, currentIndex) => currentIndex !== index)
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

onMounted(() => {
  void loadHistory()
  syncValidation()
})
</script>

<template>
  <div class="space-y-8 h-full">
    <!-- Top Row: 40/60 Split -->
    <div class="grid grid-cols-1 lg:grid-cols-[2fr_3fr] gap-6 xl:gap-8 items-start">
      
      <!-- LEFT: Calculator Form (40%) -->
      <Card class="bg-white rounded-[2rem] shadow-sm border border-border/30 overflow-hidden">
        <CardHeader class="border-b border-border/20 bg-slate-50 pb-6 pt-6 px-6 sm:px-8">
          <CardTitle class="text-xl font-extrabold text-[#1e1b4b] tracking-tight">Loan Consolidation</CardTitle>
          <CardDescription class="text-muted-foreground text-sm mt-1">
            Configure your scenario and add existing loans.
          </CardDescription>
        </CardHeader>
        <CardContent class="p-6 sm:p-8">
          <form class="space-y-8" @submit.prevent="form.handleSubmit">
            <div class="space-y-6">
              <form.Field name="label">
                <template #default="{ field }">
                  <div class="space-y-2">
                    <label class="block text-sm font-bold tracking-wide text-[#1e1b4b]" :for="field.name">Scenario Label</label>
                    <Input
                      :id="field.name"
                      class="rounded-xl border-border/40 bg-[#f8fafc] px-4 py-6 text-base focus:ring-2 focus:ring-primary/40 focus:border-primary shadow-inner"
                      :model-value="field.state.value"
                      placeholder="Debt Refinance Option A"
                      @input="onStringInput(field, $event)"
                      @blur="field.handleBlur"
                    />
                  </div>
                </template>
              </form.Field>

              <div class="space-y-3">
                <form.Field name="newTermMonths">
                  <template #default="{ field }">
                    <div class="space-y-2">
                      <label class="block text-sm font-bold tracking-wide text-[#1e1b4b]" :for="field.name">New Term (months)</label>
                      <Input
                        :id="field.name"
                        class="rounded-xl border-border/40 bg-[#f8fafc] px-4 py-6 text-base focus:ring-2 focus:ring-primary/40 focus:border-primary shadow-inner"
                        type="number"
                        :min="1"
                        step="1"
                        :model-value="field.state.value"
                        placeholder="60"
                        @input="onNumberInput(field, $event)"
                        @blur="field.handleBlur"
                      />
                      <p class="min-h-5 text-xs font-medium text-red-500" :class="{ invisible: !errorFor('newTermMonths') }">
                        {{ errorFor('newTermMonths') || '-' }}
                      </p>
                    </div>
                  </template>
                </form.Field>
                <Button type="button" variant="outline" class="w-full rounded-xl border-primary/30 text-primary hover:bg-primary/5 font-semibold shadow-sm" @click="applySuggestedTerm">
                  Use Suggested: {{ suggestedTermMonths }} mo
                </Button>
              </div>
            </div>

            <div class="space-y-6 pt-6 border-t border-border/20">
              <div class="flex items-center justify-between">
                <label class="block text-sm font-bold tracking-wide text-[#1e1b4b]">Existing Loans</label>
                <Button type="button" variant="outline" class="rounded-full px-4 text-xs font-bold shadow-sm" @click="addLoan">
                  + Add
                </Button>
              </div>

              <p v-if="errorFor('loans')" class="text-xs font-medium text-red-500 bg-red-50 p-3 rounded-xl border border-red-200">{{ errorFor('loans') }}</p>

              <div class="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                <div
                  v-for="(loan, index) in loans"
                  :key="`loan-${index}`"
                  class="flex flex-col gap-4 rounded-2xl border border-border/40 bg-[#f8fafc] p-5 relative"
                >
                  <div class="absolute right-4 top-4">
                    <button type="button" class="text-red-400 hover:text-red-600 focus:outline-none" :disabled="loans.length <= minimumLoans" @click="removeLoan(index)">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                    </button>
                  </div>
                  
                  <div class="font-bold text-xs text-muted-foreground uppercase tracking-wider">Loan {{ index + 1 }}</div>
                  
                  <div class="space-y-4">
                    <div class="grid grid-cols-2 gap-4">
                      <div>
                        <label class="block text-xs font-semibold text-muted-foreground mb-1">Principal</label>
                        <Input class="rounded-lg h-9 text-sm" type="number" :min="1" step="0.01" :model-value="loan.principal" @input="onLoanNumberInput(index, 'principal', $event)" @blur="syncValidation" />
                      </div>
                      <div>
                        <label class="block text-xs font-semibold text-muted-foreground mb-1">Rate (%)</label>
                        <Input class="rounded-lg h-9 text-sm" type="number" :min="0" :max="100" step="0.01" :model-value="loan.interestRate" @input="onLoanNumberInput(index, 'interestRate', $event)" @blur="syncValidation" />
                      </div>
                    </div>
                    <div>
                      <label class="block text-xs font-semibold text-muted-foreground mb-1">Remaining (mo)</label>
                      <Input class="rounded-lg h-9 text-sm" type="number" :min="1" step="1" :model-value="loan.remainingTermMonths" @input="onLoanNumberInput(index, 'remainingTermMonths', $event)" @blur="syncValidation" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="pt-6 border-t border-border/20">
              <form.Subscribe :selector="(state) => ({ canSubmit: state.canSubmit, isSubmitting: state.isSubmitting })">
                <template #default="{ canSubmit, isSubmitting }">
                  <Button 
                    class="w-full py-6 rounded-2xl text-base font-bold bg-[#1e1b4b] hover:bg-[#1e1b4b]/90 text-white shadow-md transition-all"
                    type="submit" 
                    :disabled="!canSubmit || isSubmitting || isSaving"
                  >
                    {{ isSubmitting || isSaving ? 'Saving...' : 'Save Consolidation' }}
                  </Button>
                </template>
              </form.Subscribe>
            </div>
          </form>
        </CardContent>
      </Card>

      <!-- RIGHT: Live Preview (60%) -->
      <div class="flex flex-col gap-6" v-if="liveResult">
        <Card class="bg-white rounded-[2rem] shadow-sm border border-border/30 overflow-hidden">
          <CardHeader class="border-b border-border/20 bg-slate-50 pb-6 pt-6 px-6 sm:px-8">
            <CardTitle class="text-xl font-extrabold text-[#1e1b4b] tracking-tight">Live Consolidation Preview</CardTitle>
          </CardHeader>
          <CardContent class="p-6 sm:p-8 space-y-8">
            
            <div class="grid grid-cols-1 md:grid-cols-[auto_1fr] gap-8 items-center">
              <div class="flex justify-center">
                <DonutChart
                  :data="[
                    { label: 'New Principal', value: liveResult.totalConsolidatedPrincipal, color: '#0ea5e9' },
                    { label: 'New Interest', value: liveResult.totalInterest, color: '#10b981' }
                  ]"
                  :size="220"
                  :strokeWidth="28"
                  centerLabel="Consolidated Pay"
                  :centerValue="currency(liveResult.totalPayment)"
                />
              </div>

              <div class="grid grid-cols-2 gap-4">
                <div class="bg-[#f8fafc] rounded-xl p-4 border border-border/40">
                  <p class="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">New Principal</p>
                  <p class="text-xl font-extrabold text-[#1e1b4b]">{{ currency(liveResult.totalConsolidatedPrincipal) }}</p>
                </div>
                <div class="bg-[#f8fafc] rounded-xl p-4 border border-border/40">
                  <p class="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Weighted Rate</p>
                  <p class="text-xl font-extrabold text-[#1e1b4b]">{{ percent(liveResult.weightedAverageInterestRate) }}</p>
                </div>
                <div class="bg-[#f8fafc] rounded-xl p-4 border border-border/40">
                  <p class="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Suggested Term</p>
                  <p class="text-xl font-extrabold text-[#1e1b4b]">{{ liveResult.suggestedTermMonths }} mo</p>
                </div>
                <div class="bg-primary/5 rounded-xl p-4 border border-primary/20">
                  <p class="text-xs font-semibold uppercase tracking-wider text-primary mb-1">New Payment</p>
                  <p class="text-xl font-extrabold text-primary">{{ currency(liveResult.monthlyPayment) }}</p>
                </div>
              </div>
            </div>

            <div class="bg-[#f8fafc] rounded-xl p-6 border border-border/40 grid grid-cols-1 sm:grid-cols-3 gap-6 items-center">
              <div>
                <p class="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Monthly Delta</p>
                <p class="text-2xl font-extrabold" :class="liveResult.monthlyPaymentDelta <= 0 ? 'text-green-600' : 'text-red-500'">
                  {{ liveResult.monthlyPaymentDelta <= 0 ? '' : '+' }}{{ currency(liveResult.monthlyPaymentDelta) }}
                </p>
              </div>
              <div class="col-span-2 space-y-2">
                 <p class="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Current vs New Monthly Total</p>
                 <div class="flex items-center gap-4">
                   <div class="flex-1 h-3 bg-red-400 rounded-full relative group cursor-pointer" :style="{ width: '100%' }">
                     <span class="absolute -top-6 left-0 text-xs font-bold text-red-500 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">Current: {{ currency(liveResult.currentMonthlyPayments) }}</span>
                   </div>
                   <span class="text-sm font-bold text-muted-foreground">&rarr;</span>
                   <div class="flex-1 h-3 bg-primary rounded-full relative group cursor-pointer" :style="{ width: `${(liveResult.monthlyPayment / liveResult.currentMonthlyPayments) * 100}%` }">
                      <span class="absolute -top-6 right-0 text-xs font-bold text-primary whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">New: {{ currency(liveResult.monthlyPayment) }}</span>
                   </div>
                 </div>
                 <div class="flex justify-between text-xs font-bold text-muted-foreground mt-1">
                   <span>{{ currency(liveResult.currentMonthlyPayments) }}</span>
                   <span>{{ currency(liveResult.monthlyPayment) }}</span>
                 </div>
              </div>
            </div>

            <div>
              <h3 class="text-lg font-bold text-[#1e1b4b] mb-4">Amortization Schedule</h3>
              <div class="bg-white rounded-xl overflow-hidden border border-border/30">
                <AmortizationTable :rows="liveResult.amortization" />
              </div>
            </div>
            
          </CardContent>
        </Card>
      </div>
      
      <div v-else class="flex items-center justify-center h-full bg-white rounded-[2rem] shadow-sm border border-border/30 border-dashed min-h-[400px]">
         <p class="text-muted-foreground font-medium text-center max-w-xs">Enter valid loan consolidation parameters to see your live preview.</p>
      </div>

    </div>

    <!-- Bottom: History (Full width) -->
    <Card class="bg-white rounded-[2rem] shadow-sm border border-border/30 overflow-hidden w-full">
      <CardHeader class="border-b border-border/20 bg-slate-50 flex flex-col sm:flex-row sm:items-center sm:justify-between pb-6 pt-6 px-6 sm:px-8">
        <CardTitle class="text-xl font-extrabold text-[#1e1b4b] tracking-tight">Consolidation History</CardTitle>
        <Button type="button" variant="ghost" class="h-9 px-4 rounded-full text-xs font-semibold text-red-500 hover:text-red-600 hover:bg-red-50 mt-4 sm:mt-0" :disabled="!hasHistory" @click="deleteAllHistory">
          Delete All
        </Button>
      </CardHeader>
      <CardContent class="p-6 sm:p-8">
        <p v-if="exportError" class="text-xs font-medium text-red-500">{{ exportError }}</p>
        <p v-if="isLoadingHistory" class="text-sm font-medium text-muted-foreground/70 animate-pulse">Loading consolidation history...</p>
        
        <div v-else-if="hasHistory" class="space-y-4">
          <details
            v-for="item in history"
            :key="item.id"
            class="group overflow-hidden rounded-[1.5rem] border border-border/30 bg-[#f8fafc] transition-all shadow-sm open:shadow-md"
          >
            <summary class="cursor-pointer list-none p-6 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50">
              <div class="flex flex-wrap items-center justify-between gap-4">
                <div class="flex flex-col sm:flex-row sm:items-center gap-4">
                  <span class="rounded-full bg-white border border-border/40 px-4 py-1.5 text-sm font-bold text-[#1e1b4b] shadow-sm">{{ item.label || 'Untitled Scenario' }}</span>
                  <span class="text-sm font-medium text-muted-foreground">{{ new Date(item.createdAt).toLocaleString() }}</span>
                </div>
                <span class="text-xl font-extrabold text-[#1e1b4b]">{{ currency(item.monthlyPayment) }}<span class="text-sm font-medium text-muted-foreground">/mo</span></span>
              </div>
            </summary>
            <div class="space-y-6 border-t border-border/20 bg-white p-6">
              <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <p class="text-xs font-extrabold uppercase tracking-wider text-muted-foreground">Schedule Breakdown</p>
                <div class="flex flex-wrap gap-2">
                  <Button type="button" variant="outline" class="h-8 px-4 rounded-full text-xs font-semibold bg-[#f8fafc]" @click.stop.prevent="downloadHistoryItemCsv(item)">
                    CSV
                  </Button>
                  <Button type="button" variant="outline" class="h-8 px-4 rounded-full text-xs font-semibold bg-[#f8fafc]" :disabled="exportingItemXlsxId === item.id" @click.stop.prevent="downloadHistoryItemXlsx(item)">
                    {{ exportingItemXlsxId === item.id ? '...' : 'XLSX' }}
                  </Button>
                  <Button type="button" variant="ghost" class="h-8 px-4 rounded-full text-xs font-semibold text-red-500 hover:text-red-600 hover:bg-red-50" @click.stop.prevent="deleteHistoryItem(item)">
                    Delete
                  </Button>
                </div>
              </div>
              <div class="bg-white rounded-2xl overflow-hidden border border-border/30 shadow-sm">
                <AmortizationTable :rows="item.amortization" />
              </div>
            </div>
          </details>
        </div>
        <p v-else class="text-sm font-medium text-muted-foreground/70 py-12 text-center border border-dashed border-border/40 rounded-[2rem] bg-white">No saved consolidations yet.</p>
      </CardContent>
    </Card>
  </div>
</template>
