<script setup lang="ts">
import Button from '~/components/ui/button/Button.vue'

const activeView = useState<'calculator' | 'consolidation'>('loan-ui/active-view', () => 'calculator')
const { currencyCode } = useFormatters()
</script>

<template>
  <main class="min-h-screen bg-background px-4 py-10 sm:py-16 selection:bg-primary/20">
    <div class="mx-auto flex w-full max-w-6xl flex-col gap-8">

      <!-- Top Bar: Title + Controls -->
      <div class="flex items-center justify-between">
        <h1 class="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
          Loan calculator
        </h1>
        <div class="flex items-center gap-3">
          <ThemeSwitcher />
          <div class="relative">
            <select v-model="currencyCode" class="appearance-none bg-card border border-border text-foreground text-sm rounded-xl px-4 py-2 outline-none hover:border-primary/50 transition-colors cursor-pointer pr-8 shadow-card">
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
              <option value="GBP">GBP (£)</option>
              <option value="JPY">JPY (¥)</option>
            </select>
            <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground">
              <svg class="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" fill-rule="evenodd"></path></svg>
            </div>
          </div>
        </div>
      </div>

      <!-- Tab Navigation -->
      <nav class="flex items-center gap-1 border-b border-border">
        <button
          type="button"
          class="relative px-5 py-3 text-sm font-semibold transition-all duration-200"
          :class="[
            activeView === 'calculator'
              ? 'text-primary border-b-2 border-primary'
              : 'text-muted-foreground hover:text-foreground'
          ]"
          @click="activeView = 'calculator'"
        >
          <span class="flex items-center gap-2">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>
            Loan Calculator
          </span>
        </button>
        <button
          type="button"
          class="relative px-5 py-3 text-sm font-semibold transition-all duration-200"
          :class="[
            activeView === 'consolidation'
              ? 'text-primary border-b-2 border-primary'
              : 'text-muted-foreground hover:text-foreground'
          ]"
          @click="activeView = 'consolidation'"
        >
          <span class="flex items-center gap-2">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/></svg>
            Consolidation
          </span>
        </button>
      </nav>

      <!-- Content -->
      <Transition name="fade-slide" mode="out-in">
        <div :key="activeView">
          <LoanCalculatorForm v-if="activeView === 'calculator'" />
          <LoanConsolidationForm v-else />
        </div>
      </Transition>
    </div>
  </main>
</template>
