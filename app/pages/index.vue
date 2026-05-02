<script setup lang="ts">
import Button from '~/components/ui/button/Button.vue'

const activeView = useState<'calculator' | 'consolidation'>('loan-ui/active-view', () => 'calculator')
</script>

<template>
  <main class="min-h-screen bg-background relative overflow-hidden px-4 py-16 selection:bg-primary/20">
    <!-- Glowing Background Blobs -->
    <div class="pointer-events-none absolute -top-40 left-0 h-[32rem] w-[32rem] rounded-full bg-primary/30 opacity-60 mix-blend-screen blur-[128px] animate-blob"></div>
    <div class="pointer-events-none absolute right-0 top-20 h-[32rem] w-[32rem] rounded-full bg-purple-600/30 opacity-60 mix-blend-screen blur-[128px] animate-blob animation-delay-2000"></div>
    <div class="pointer-events-none absolute -bottom-40 left-1/4 h-[32rem] w-[32rem] rounded-full bg-teal-500/30 opacity-60 mix-blend-screen blur-[128px] animate-blob animation-delay-4000"></div>

    <div class="relative z-10 mx-auto flex w-full max-w-7xl flex-col gap-10">
      <header class="flex flex-col items-center justify-center space-y-4 text-center">
        <div class="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-primary shadow-sm backdrop-blur-md">
          <span class="mr-2 flex h-2 w-2 rounded-full bg-primary shadow-[0_0_8px_rgba(14,165,233,0.8)]"></span>
          Loan Calculator Studio
        </div>
        <h1 class="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl lg:text-6xl drop-shadow-sm">
          Smarter <span class="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">Financing</span>
        </h1>
        <p class="max-w-2xl text-base text-muted-foreground sm:text-lg">
          Calculate standard loan payments, review amortization schedules, and evaluate consolidation scenarios in a single, refined interface.
        </p>
      </header>

      <section class="mx-auto flex justify-center">
        <div class="inline-flex rounded-full border border-white/10 bg-white/5 p-1 shadow-sm backdrop-blur-xl">
          <button
            type="button"
            class="relative rounded-full px-6 py-2.5 text-sm font-medium transition-all duration-300"
            :class="[
              activeView === 'calculator'
                ? 'bg-primary text-white shadow-float'
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
                ? 'bg-primary text-white shadow-float'
                : 'text-muted-foreground hover:text-foreground'
            ]"
            @click="activeView = 'consolidation'"
          >
            Loan Consolidation
          </button>
        </div>
      </section>

      <Transition name="fade-slide" mode="out-in">
        <div :key="activeView" class="transition-all duration-500 ease-in-out">
          <LoanCalculatorForm v-if="activeView === 'calculator'" />
          <LoanConsolidationForm v-else />
        </div>
      </Transition>
    </div>
  </main>
</template>
