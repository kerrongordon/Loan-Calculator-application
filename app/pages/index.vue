<script setup lang="ts">
import Button from '~/components/ui/button/Button.vue'

const activeView = useState<'calculator' | 'consolidation'>('loan-ui/active-view', () => 'calculator')
</script>

<template>
  <main class="min-h-screen bg-background px-4 py-16 selection:bg-primary/20">
    <div class="mx-auto flex w-full max-w-7xl flex-col gap-10">
      <header class="flex flex-col items-center justify-center space-y-4 text-center">
        <div class="inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary shadow-sm backdrop-blur-md">
          <span class="mr-2 flex h-2 w-2 rounded-full bg-primary shadow-[0_0_8px_rgba(14,165,233,0.8)]"></span>
          Loan Calculator Studio
        </div>
        <h1 class="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
          Smarter <span class="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">Financing</span>
        </h1>
        <p class="max-w-2xl text-base text-muted-foreground sm:text-lg">
          Calculate standard loan payments, review amortization schedules, and evaluate consolidation scenarios in a single, refined interface.
        </p>
      </header>

      <section class="mx-auto flex justify-center">
        <div class="inline-flex inset-0 rounded-full border border-border/50 bg-white/60 p-1 shadow-sm backdrop-blur-md">
          <button
            type="button"
            class="relative rounded-full px-6 py-2.5 text-sm font-medium transition-all duration-300"
            :class="[
              activeView === 'calculator'
                ? 'bg-primary text-primary-foreground shadow-float'
                : 'text-muted-foreground hover:text-foreground'
            ]"
            @click="activeView = 'calculator'"
          >
            Loan Calculator
          </button>
          <button
            type="button"
            class="relative rounded-full px-6 py-2.5 text-sm font-medium transition-all duration-300"
            :class="[
              activeView === 'consolidation'
                ? 'bg-primary text-primary-foreground shadow-float'
                : 'text-muted-foreground hover:text-foreground'
            ]"
            @click="activeView = 'consolidation'"
          >
            Loan Consolidation
          </button>
        </div>
      </section>

      <div class="transition-all duration-500 ease-in-out">
        <LoanCalculatorForm v-if="activeView === 'calculator'" />
        <LoanConsolidationForm v-else />
      </div>
    </div>
  </main>
</template>
