<script setup lang="ts">
import type { AmortizationRow } from '~~/shared/loan'

defineProps<{
  rows: AmortizationRow[]
}>()

const { currency } = useFormatters()
</script>

<template>
  <div class="max-h-96 overflow-auto rounded-md border border-white/10">
    <table class="min-w-full text-left text-sm">
      <thead class="sticky top-0 bg-white/10 backdrop-blur-md text-slate-200">
        <tr>
          <th class="px-3 py-2 font-medium">Month</th>
          <th class="px-3 py-2 font-medium">Payment</th>
          <th class="px-3 py-2 font-medium">Principal</th>
          <th class="px-3 py-2 font-medium">Interest</th>
          <th class="px-3 py-2 font-medium">Balance</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="row in rows" :key="row.month" class="border-t border-white/10 text-slate-300 hover:bg-white/5 transition-colors">
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
