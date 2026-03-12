<script setup lang="ts">
import Button from '~/components/ui/button/Button.vue'

const activeView = useState<'calculator' | 'consolidation'>('loan-ui/active-view', () => 'calculator')
</script>

<template>
  <main class="min-h-screen bg-gradient-to-br from-cyan-50 via-slate-50 to-amber-50 px-4 py-10">
    <div class="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <header class="space-y-3">
        <p class="text-xs uppercase tracking-[0.2em] text-slate-500">Nuxt 4 • TanStack Form • Drizzle</p>
        <h1 class="text-3xl font-bold text-slate-900 md:text-4xl">Loan Calculator Studio</h1>
        <p class="max-w-3xl text-sm text-slate-600 md:text-base">
          Calculate standard loan payments, review amortization schedules, and compare loan consolidation
          scenarios with persisted history.
        </p>
      </header>

      <section class="rounded-xl border border-border bg-white/80 p-3 backdrop-blur-sm">
        <div class="flex flex-wrap gap-2">
          <Button
            :variant="activeView === 'calculator' ? 'default' : 'outline'"
            type="button"
            @click="activeView = 'calculator'"
          >
            Loan Calculator
          </Button>
          <Button
            :variant="activeView === 'consolidation' ? 'default' : 'outline'"
            type="button"
            @click="activeView = 'consolidation'"
          >
            Loan Consolidation
          </Button>
        </div>
      </section>

      <LoanCalculatorForm v-if="activeView === 'calculator'" />
      <LoanConsolidationForm v-else />
    </div>
  </main>
</template>
