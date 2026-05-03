<script setup lang="ts">
useHead({
  title: 'About',
  meta: [
    { name: 'description', content: 'About LoanCalc — a free, modern loan calculator with amortization schedules, consolidation tools, and export features.' },
    { property: 'og:title', content: 'About | LoanCalc' },
  ],
})

const features = [
  { icon: 'M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z', title: 'Loan Calculator', desc: 'Calculate monthly payments, total interest, and total cost for any loan with adjustable parameters.' },
  { icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10', title: 'Loan Consolidation', desc: 'Combine multiple loans and compare consolidated vs. individual payments side-by-side.' },
  { icon: 'M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z', title: 'Amortization Schedules', desc: 'View detailed month-by-month breakdown of principal and interest payments.' },
  { icon: 'M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z', title: 'Export & Reports', desc: 'Download results as PDF or Excel spreadsheets for offline analysis and record-keeping.' },
  { icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z', title: 'Multi-Currency', desc: 'Switch between USD, EUR, GBP, and JPY to calculate loans in your preferred currency.' },
  { icon: 'M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z', title: 'Dark Mode', desc: 'Automatic, light, and dark themes for comfortable use in any environment.' },
]
</script>

<template>
  <div class="mx-auto max-w-4xl px-4 py-10 sm:py-16">
    <!-- Hero -->
    <div class="mb-12 text-center">
      <div class="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-blue-600 shadow-xl shadow-primary/25">
        <svg class="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <h1 class="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
        About <span class="text-primary">LoanCalc</span>
      </h1>
      <p class="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground">
        LoanCalc is a free, modern loan calculator built to help you make smarter financial decisions. Whether you're
        planning a mortgage, auto loan, or consolidating debt — our tools give you instant clarity on payments,
        interest, and amortization.
      </p>
    </div>

    <!-- Features Grid -->
    <div class="mb-12">
      <h2 class="mb-6 text-center text-lg font-bold text-foreground">What We Offer</h2>
      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div
          v-for="feature in features"
          :key="feature.title"
          class="group rounded-2xl border border-border bg-card p-5 shadow-card transition-all duration-300 hover:shadow-card-hover hover:border-primary/30"
        >
          <div class="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary/20">
            <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" :d="feature.icon" />
            </svg>
          </div>
          <h3 class="text-sm font-bold text-foreground">{{ feature.title }}</h3>
          <p class="mt-1.5 text-xs leading-relaxed text-muted-foreground">{{ feature.desc }}</p>
        </div>
      </div>
    </div>

    <!-- Mission -->
    <div class="rounded-2xl border border-border bg-card p-6 shadow-card sm:p-8">
      <h2 class="text-xl font-bold text-foreground mb-3">Our Mission</h2>
      <p class="text-sm leading-relaxed text-muted-foreground mb-3">
        We believe financial literacy should be accessible to everyone. LoanCalc was built to provide transparent,
        easy-to-understand loan calculations without the complexity of spreadsheets or the cost of financial software.
      </p>
      <p class="text-sm leading-relaxed text-muted-foreground mb-3">
        Our tools are designed with accuracy and simplicity in mind — powered by standard amortization formulas used
        by financial institutions worldwide.
      </p>
      <div class="mt-4 rounded-xl border border-primary/20 bg-primary/5 p-4">
        <p class="text-xs font-medium text-primary">
          <strong>Note:</strong> LoanCalc is for educational purposes only and does not constitute financial advice.
          Always consult a qualified financial professional for personalized guidance.
        </p>
      </div>
    </div>
  </div>
</template>
