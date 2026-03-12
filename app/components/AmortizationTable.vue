<script setup lang="ts">
import type { AmortizationRow } from '~~/shared/loan'

defineProps<{
  rows: AmortizationRow[]
}>()

const { currency } = useFormatters()
</script>

<template>
  <div class="max-h-96 overflow-auto rounded-md border border-border">
    <table class="min-w-full text-left text-sm">
      <thead class="sticky top-0 bg-slate-100 text-slate-700">
        <tr>
          <th class="px-3 py-2 font-medium">Month</th>
          <th class="px-3 py-2 font-medium">Payment</th>
          <th class="px-3 py-2 font-medium">Principal</th>
          <th class="px-3 py-2 font-medium">Interest</th>
          <th class="px-3 py-2 font-medium">Balance</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="row in rows" :key="row.month" class="border-t border-slate-100">
          <td class="px-3 py-2">{{ row.month }}</td>
          <td class="px-3 py-2">{{ currency(row.payment) }}</td>
          <td class="px-3 py-2">{{ currency(row.principal) }}</td>
          <td class="px-3 py-2">{{ currency(row.interest) }}</td>
          <td class="px-3 py-2">{{ currency(row.balance) }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
