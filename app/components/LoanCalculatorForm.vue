<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useForm } from '@tanstack/vue-form'
import { loanCalculatorInputSchema } from '~~/shared/loan'
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
} = useLoanCalculator()
const { currency } = useFormatters()
const { exportRowsAsCsv, exportRowsAsXlsx } = useHistoryExport()

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
    termMonths: 60
  },
  onSubmit: async ({ value }) => {
    const parsed = loanCalculatorInputSchema.safeParse(value)

    if (!parsed.success) {
      return
    }

    const result = calculate(parsed.data)
    await save(result)
  }
})

onMounted(() => {
  void loadHistory()
})
</script>

<template>
  <Card class="border-0 shadow-soft bg-white/80 backdrop-blur-2xl ring-1 ring-border/40 overflow-hidden rounded-3xl">
    <CardHeader class="border-b border-border/30 bg-muted/30 pb-8 pt-8">
      <CardTitle class="text-2xl font-extrabold text-foreground tracking-tight">Loan Calculator</CardTitle>
      <CardDescription class="text-muted-foreground text-base mt-2">
        Enter principal, annual interest rate, and term to compute payment details and amortization.
      </CardDescription>
    </CardHeader>
    <CardContent class="space-y-10 pt-8 px-6 sm:px-10">
      <form class="grid gap-8 sm:grid-cols-2 xl:grid-cols-3" @submit.prevent="form.handleSubmit">
        <form.Field
          name="principal"
          :validators="{
            onBlur: ({ value }) => validateNumber(principalRule, value)
          }"
        >
          <template #default="{ field }">
            <div class="space-y-2">
              <label class="mb-1 block text-sm font-semibold tracking-wide text-foreground/80" :for="field.name">Principal ($)</label>
              <Input
                :id="field.name"
                class="rounded-xl border-border/60 bg-white/60 px-4 py-6 text-lg transition-all focus:ring-2 focus:ring-primary/40 focus:border-primary shadow-sm"
                type="number"
                :min="1"
                step="0.01"
                :model-value="field.state.value"
                @input="onNumberInput(field, $event)"
                @blur="field.handleBlur"
              />
              <p
                class="min-h-5 text-xs font-medium text-red-500"
                :class="{ invisible: !(field.state.meta.isTouched && displayError(field.state.meta.errors)) }"
              >
                {{ displayError(field.state.meta.errors) || '-' }}
              </p>
            </div>
          </template>
        </form.Field>

        <form.Field
          name="interestRate"
          :validators="{
            onBlur: ({ value }) => validateNumber(interestRateRule, value)
          }"
        >
          <template #default="{ field }">
            <div class="space-y-2">
              <div class="flex items-center justify-between mb-1">
                <label class="block text-sm font-semibold tracking-wide text-foreground/80" :for="field.name">Interest Rate</label>
                <span class="rounded-full bg-primary/10 px-3 py-0.5 text-sm font-bold text-primary">{{ field.state.value.toFixed(2) }}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="30"
                step="0.25"
                :value="field.state.value"
                class="w-full cursor-pointer accent-primary"
                @input="onNumberInput(field, $event)"
                @blur="field.handleBlur"
              />
              <div class="flex justify-between text-xs font-medium text-muted-foreground/60 px-1">
                <span>0%</span>
                <span>15%</span>
                <span>30%</span>
              </div>
              <Input
                :id="field.name"
                class="rounded-xl border-border/60 bg-white/60 px-4 py-6 text-lg transition-all focus:ring-2 focus:ring-primary/40 focus:border-primary shadow-sm"
                type="number"
                :min="0"
                :max="100"
                step="0.01"
                :model-value="field.state.value"
                @input="onNumberInput(field, $event)"
                @blur="field.handleBlur"
              />
              <p
                class="min-h-5 text-xs font-medium text-red-500"
                :class="{ invisible: !(field.state.meta.isTouched && displayError(field.state.meta.errors)) }"
              >
                {{ displayError(field.state.meta.errors) || '-' }}
              </p>
            </div>
          </template>
        </form.Field>

        <form.Field
          name="termMonths"
          :validators="{
            onBlur: ({ value }) => validateNumber(termRule, value)
          }"
        >
          <template #default="{ field }">
            <div class="space-y-2">
              <div class="flex items-center justify-between mb-1">
                <label class="block text-sm font-semibold tracking-wide text-foreground/80" :for="field.name">Term (months)</label>
                <span class="rounded-full bg-primary/10 px-3 py-0.5 text-sm font-bold text-primary">{{ formatTerm(field.state.value) }}</span>
              </div>
              <Input
                :id="field.name"
                class="rounded-xl border-border/60 bg-white/60 px-4 py-6 text-lg transition-all focus:ring-2 focus:ring-primary/40 focus:border-primary shadow-sm"
                type="number"
                :min="1"
                :step="1"
                :model-value="field.state.value"
                @input="onNumberInput(field, $event)"
                @blur="field.handleBlur"
              />
              <p
                class="min-h-5 text-xs font-medium text-red-500"
                :class="{ invisible: !(field.state.meta.isTouched && displayError(field.state.meta.errors)) }"
              >
                {{ displayError(field.state.meta.errors) || '-' }}
              </p>
            </div>
          </template>
        </form.Field>

        <div class="sm:col-span-2 xl:col-span-3 pt-4 border-t border-border/40">
          <form.Subscribe
            :selector="(state) => ({ canSubmit: state.canSubmit, isSubmitting: state.isSubmitting })"
          >
            <template #default="{ canSubmit, isSubmitting }">
              <Button 
                class="w-full sm:w-auto px-8 py-6 rounded-full text-base font-bold bg-primary hover:bg-accent text-white shadow-float transition-all duration-300 transform hover:-translate-y-0.5"
                type="submit" 
                :disabled="!canSubmit || isSubmitting || isSaving"
              >
                {{ isSubmitting || isSaving ? 'Saving...' : 'Calculate & Save' }}
              </Button>
            </template>
          </form.Subscribe>
        </div>
      </form>

      <div v-if="latestResult" class="space-y-6 rounded-3xl border border-primary/20 bg-primary/5 p-6 sm:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <h3 class="text-xl font-bold text-foreground">Latest Result</h3>
        <div class="grid gap-6 lg:grid-cols-[auto_1fr] items-center">
          <div class="flex flex-col items-center justify-center p-5 bg-white/60 border border-border/40 rounded-2xl shadow-sm backdrop-blur-sm">
            <DonutChart
              :data="[
                { label: 'Principal', value: form.state.values.principal, color: '#0ea5e9' },
                { label: 'Interest', value: latestResult.totalInterest, color: '#f59e0b' }
              ]"
              :size="150"
              :strokeWidth="16"
              centerLabel="Total Pay"
              :centerValue="currency(latestResult.totalPayment)"
            />
            <div class="flex items-center gap-4 mt-5 text-xs font-bold text-muted-foreground">
              <span class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-[#0ea5e9]"></span> Principal</span>
              <span class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-[#f59e0b]"></span> Interest</span>
            </div>
          </div>

          <div class="grid gap-4 sm:grid-cols-1 md:grid-cols-3 h-full">
            <div class="bg-white/60 rounded-2xl p-5 border border-border/40 shadow-sm backdrop-blur-sm flex flex-col justify-center">
              <p class="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-1">Monthly Payment</p>
              <p class="text-3xl font-extrabold text-foreground">{{ currency(latestResult.monthlyPayment) }}</p>
            </div>
            <div class="bg-white/60 rounded-2xl p-5 border border-border/40 shadow-sm backdrop-blur-sm flex flex-col justify-center">
              <p class="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-1">Total Payment</p>
              <p class="text-xl font-extrabold text-foreground mt-1">{{ currency(latestResult.totalPayment) }}</p>
            </div>
            <div class="bg-white/60 rounded-2xl p-5 border border-border/40 shadow-sm backdrop-blur-sm flex flex-col justify-center">
              <p class="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-1">Total Interest</p>
              <p class="text-xl font-extrabold text-foreground mt-1">{{ currency(latestResult.totalInterest) }}</p>
            </div>
          </div>
        </div>
        <div class="bg-white/80 rounded-2xl p-2 border border-border/40 overflow-hidden shadow-sm">
          <AmortizationTable :rows="latestResult.amortization" />
        </div>
      </div>

      <div class="space-y-4 pt-10 border-t border-border/40">
        <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h3 class="text-xl font-bold text-foreground">History</h3>
          <div class="flex flex-wrap gap-2">
            <Button type="button" variant="outline" class="h-9 px-4 rounded-full text-xs font-semibold" :disabled="!hasHistory" @click="downloadHistoryCsv">
              Download All CSV
            </Button>
            <Button type="button" variant="outline" class="h-9 px-4 rounded-full text-xs font-semibold" :disabled="!hasHistory || isExportingXlsx" @click="downloadHistoryXlsx">
              {{ isExportingXlsx ? 'Preparing XLSX...' : 'Download All XLSX' }}
            </Button>
            <Button type="button" variant="ghost" class="h-9 px-4 rounded-full text-xs font-semibold text-red-500 hover:text-red-600 hover:bg-red-50" :disabled="!hasHistory" @click="deleteAllHistory">
              Delete All
            </Button>
          </div>
        </div>
        <p v-if="exportError" class="text-xs font-medium text-red-500">{{ exportError }}</p>
        <p v-if="isLoadingHistory" class="text-sm font-medium text-muted-foreground/70 animate-pulse">Loading calculation history...</p>
        <div v-else-if="hasHistory" class="space-y-3">
          <details
            v-for="item in history"
            :key="item.id"
            class="group overflow-hidden rounded-2xl border border-border/60 bg-white transition-all shadow-sm open:shadow-md"
          >
            <summary class="cursor-pointer list-none p-5 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50">
              <div class="flex flex-wrap items-center justify-between gap-4">
                <span class="text-sm font-medium text-muted-foreground">{{ new Date(item.createdAt).toLocaleString() }}</span>
                <span class="text-xl font-bold text-foreground">{{ currency(item.monthlyPayment) }}<span class="text-sm font-medium text-muted-foreground">/mo</span></span>
                <span class="rounded-full bg-muted/60 px-3 py-1 text-xs font-bold text-foreground/70">{{ item.interestRate.toFixed(2) }}% &mdash; {{ formatTerm(item.termMonths) }}</span>
              </div>
            </summary>
            <div class="space-y-5 border-t border-border/40 bg-muted/10 p-5">
              <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <p class="text-xs font-bold uppercase tracking-wider text-muted-foreground">Monthly Payment Breakdown</p>
                <div class="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    class="h-8 px-4 rounded-full text-xs font-semibold bg-white"
                    @click.stop.prevent="downloadHistoryItemCsv(item)"
                  >
                    CSV
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    class="h-8 px-4 rounded-full text-xs font-semibold bg-white"
                    :disabled="exportingItemXlsxId === item.id"
                    @click.stop.prevent="downloadHistoryItemXlsx(item)"
                  >
                    {{ exportingItemXlsxId === item.id ? '...' : 'XLSX' }}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    class="h-8 px-4 rounded-full text-xs font-semibold text-red-500 hover:text-red-600 hover:bg-red-50"
                    @click.stop.prevent="deleteHistoryItem(item)"
                  >
                    Delete
                  </Button>
                </div>
              </div>
              <div class="bg-white rounded-xl overflow-hidden border border-border/40 shadow-sm">
                <AmortizationTable :rows="item.amortization" />
              </div>
            </div>
          </details>
        </div>
        <p v-else class="text-sm font-medium text-muted-foreground/70 py-8 text-center italic border border-dashed border-border rounded-xl">No saved calculations yet.</p>
      </div>
    </CardContent>
  </Card>
</template>
