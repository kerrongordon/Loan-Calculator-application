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
  <Card>
    <CardHeader>
      <CardTitle>Loan Calculator</CardTitle>
      <CardDescription>
        Enter principal, annual interest rate, and term to compute payment details and amortization.
      </CardDescription>
    </CardHeader>
    <CardContent class="space-y-6">
      <form class="grid gap-5 sm:grid-cols-2 xl:grid-cols-3" @submit.prevent="form.handleSubmit">
        <form.Field
          name="principal"
          :validators="{
            onBlur: ({ value }) => validateNumber(principalRule, value)
          }"
        >
          <template #default="{ field }">
            <div class="space-y-1.5">
              <label class="block text-sm font-medium text-slate-700" :for="field.name">Principal ($)</label>
              <Input
                :id="field.name"
                type="number"
                :min="1"
                step="0.01"
                :model-value="field.state.value"
                @input="onNumberInput(field, $event)"
                @blur="field.handleBlur"
              />
              <p
                class="min-h-4 text-xs text-red-600"
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
            <div class="space-y-1.5">
              <div class="flex items-center justify-between">
                <label class="block text-sm font-medium text-slate-700" :for="field.name">Interest Rate</label>
                <span class="text-sm font-semibold text-teal-700">{{ field.state.value.toFixed(2) }}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="30"
                step="0.25"
                :value="field.state.value"
                class="w-full cursor-pointer accent-teal-600"
                @input="onNumberInput(field, $event)"
                @blur="field.handleBlur"
              />
              <div class="flex justify-between text-xs text-slate-400">
                <span>0%</span>
                <span>15%</span>
                <span>30%</span>
              </div>
              <Input
                :id="field.name"
                type="number"
                :min="0"
                :max="100"
                step="0.01"
                :model-value="field.state.value"
                @input="onNumberInput(field, $event)"
                @blur="field.handleBlur"
              />
              <p
                class="min-h-4 text-xs text-red-600"
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
            <div class="space-y-1.5">
              <div class="flex items-center justify-between">
                <label class="block text-sm font-medium text-slate-700" :for="field.name">Term (months)</label>
                <span class="text-sm font-semibold text-teal-700">{{ formatTerm(field.state.value) }}</span>
              </div>
              <Input
                :id="field.name"
                type="number"
                :min="1"
                :step="1"
                :model-value="field.state.value"
                @input="onNumberInput(field, $event)"
                @blur="field.handleBlur"
              />
              <p
                class="min-h-4 text-xs text-red-600"
                :class="{ invisible: !(field.state.meta.isTouched && displayError(field.state.meta.errors)) }"
              >
                {{ displayError(field.state.meta.errors) || '-' }}
              </p>
            </div>
          </template>
        </form.Field>

        <div class="sm:col-span-2 xl:col-span-3 pt-1">
          <form.Subscribe
            :selector="(state) => ({ canSubmit: state.canSubmit, isSubmitting: state.isSubmitting })"
          >
            <template #default="{ canSubmit, isSubmitting }">
              <Button type="submit" :disabled="!canSubmit || isSubmitting || isSaving">
                {{ isSubmitting || isSaving ? 'Saving Calculation...' : 'Calculate & Save' }}
              </Button>
            </template>
          </form.Subscribe>
        </div>
      </form>

      <div v-if="latestResult" class="space-y-4 rounded-lg border border-border bg-slate-50 p-4">
        <h3 class="text-base font-semibold">Latest Result</h3>
        <div class="grid gap-3 text-sm md:grid-cols-3">
          <p><span class="font-medium">Monthly Payment:</span> {{ currency(latestResult.monthlyPayment) }}</p>
          <p><span class="font-medium">Total Payment:</span> {{ currency(latestResult.totalPayment) }}</p>
          <p><span class="font-medium">Total Interest:</span> {{ currency(latestResult.totalInterest) }}</p>
        </div>
        <AmortizationTable :rows="latestResult.amortization" />
      </div>

      <div class="space-y-2">
        <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h3 class="text-base font-semibold">History</h3>
          <div class="flex flex-wrap gap-2">
            <Button type="button" variant="outline" class="h-8 px-3 py-1" :disabled="!hasHistory" @click="downloadHistoryCsv">
              Download All CSV
            </Button>
            <Button type="button" variant="outline" class="h-8 px-3 py-1" :disabled="!hasHistory || isExportingXlsx" @click="downloadHistoryXlsx">
              {{ isExportingXlsx ? 'Preparing XLSX...' : 'Download All XLSX' }}
            </Button>
            <Button type="button" variant="ghost" class="h-8 px-3 py-1 text-red-600" :disabled="!hasHistory" @click="deleteAllHistory">
              Delete All
            </Button>
          </div>
        </div>
        <p v-if="exportError" class="text-xs text-red-600">{{ exportError }}</p>
        <p v-if="isLoadingHistory" class="text-sm text-slate-500">Loading calculation history...</p>
        <div v-else-if="hasHistory" class="space-y-2">
          <details
            v-for="item in history"
            :key="item.id"
            class="overflow-hidden rounded-md border border-border bg-white"
          >
            <summary class="cursor-pointer list-none px-3 py-2">
              <div class="flex flex-wrap items-center justify-between gap-2 text-sm">
                <span>{{ new Date(item.createdAt).toLocaleString() }}</span>
                <span class="font-medium">{{ currency(item.monthlyPayment) }}/mo</span>
                <span class="text-slate-500">{{ item.interestRate.toFixed(2) }}% &mdash; {{ formatTerm(item.termMonths) }}</span>
              </div>
            </summary>
            <div class="space-y-3 border-t border-border bg-slate-50 p-3">
              <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <p class="text-xs font-medium uppercase tracking-wide text-slate-500">Monthly Payment Breakdown</p>
                <div class="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    class="h-8 px-3 py-1"
                    @click.stop.prevent="downloadHistoryItemCsv(item)"
                  >
                    Download This CSV
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    class="h-8 px-3 py-1"
                    :disabled="exportingItemXlsxId === item.id"
                    @click.stop.prevent="downloadHistoryItemXlsx(item)"
                  >
                    {{ exportingItemXlsxId === item.id ? 'Preparing XLSX...' : 'Download This XLSX' }}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    class="h-8 px-3 py-1 text-red-600"
                    @click.stop.prevent="deleteHistoryItem(item)"
                  >
                    Delete This
                  </Button>
                </div>
              </div>
              <AmortizationTable :rows="item.amortization" />
            </div>
          </details>
        </div>
        <p v-else class="text-sm text-slate-500">No saved calculations yet.</p>
      </div>
    </CardContent>
  </Card>
</template>
