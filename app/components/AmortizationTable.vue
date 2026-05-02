<script setup lang="ts">
import type { AmortizationRow } from '~~/shared/loan'

defineProps<{
  rows: AmortizationRow[]
}>()

const { currency } = useFormatters()
</script>

<template>
  <div class="max-h-96 overflow-auto rounded-md">
    <table class="min-w-full text-left text-sm">
      <thead class="sticky top-0 bg-muted text-muted-foreground">
        <tr>
          <th class="px-3 py-2.5 font-semibold">Month</th>
          <th class="px-3 py-2.5 font-semibold">Payment</th>
          <th class="px-3 py-2.5 font-semibold">Principal</th>
          <th class="px-3 py-2.5 font-semibold">Interest</th>
          <th class="px-3 py-2.5 font-semibold">Balance</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="row in rows" :key="row.month" class="border-t border-border text-foreground hover:bg-muted/50 transition-colors">
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
