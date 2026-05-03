<script setup lang="ts">
useHead({
  title: 'Terms of Service',
  meta: [
    { name: 'description', content: 'Terms of Service for LoanCalc — rules and guidelines for using our free loan calculator tools.' },
    { property: 'og:title', content: 'Terms of Service | LoanCalc' },
  ],
})
const lastUpdated = 'May 3, 2026'
</script>

<template>
  <div class="mx-auto max-w-4xl px-4 py-10 sm:py-16">
    <div class="mb-10">
      <div class="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary mb-4">
        <svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        Legal
      </div>
      <h1 class="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">Terms of Service</h1>
      <p class="mt-3 text-sm text-muted-foreground">Last updated: {{ lastUpdated }}</p>
    </div>

    <div class="prose-custom space-y-8">
      <section>
        <h2>1. Acceptance of Terms</h2>
        <p>By accessing and using LoanCalc ("the Service"), you accept and agree to be bound by these Terms of Service. If you do not agree, please do not use the Service.</p>
        <p>We reserve the right to modify these terms at any time. Continued use after changes constitutes acceptance.</p>
      </section>

      <section>
        <h2>2. Description of Service</h2>
        <p>LoanCalc provides free online loan calculation tools including:</p>
        <ul>
          <li>Loan payment calculators with amortization schedules</li>
          <li>Loan consolidation analysis tools</li>
          <li>PDF and Excel export functionality</li>
          <li>Multi-currency support</li>
        </ul>
        <p>These tools are provided for informational and educational purposes only.</p>
      </section>

      <section>
        <h2>3. Disclaimer — Not Financial Advice</h2>
        <div class="rounded-xl border border-accent/30 bg-accent/5 p-4 mb-3">
          <p class="text-sm font-semibold text-accent flex items-center gap-2 mb-2">
            <svg class="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            Important Disclaimer
          </p>
          <p class="text-sm text-muted-foreground">The calculations and information provided by LoanCalc are for general informational and educational purposes only. They do <strong class="text-foreground">not</strong> constitute financial, investment, tax, or legal advice.</p>
        </div>
        <p>Always consult with a qualified financial advisor before making any financial decisions. We do not guarantee the accuracy or suitability of any information provided.</p>
      </section>

      <section>
        <h2>4. User Responsibilities</h2>
        <p>When using the Service, you agree to:</p>
        <ul>
          <li>Use the Service only for lawful purposes</li>
          <li>Provide accurate information when using our calculators</li>
          <li>Not attempt to disrupt, damage, or compromise the Service</li>
          <li>Not use automated systems to access the Service without permission</li>
        </ul>
      </section>

      <section>
        <h2>5. Intellectual Property</h2>
        <p>All content, features, and functionality of the Service are the exclusive property of LoanCalc and are protected by copyright, trademark, and other intellectual property laws.</p>
      </section>

      <section>
        <h2>6. Advertising</h2>
        <p>The Service may display advertisements provided by third-party advertising networks, including Google AdSense. These advertisements are subject to the respective network's terms and privacy policies.</p>
        <p>We are not responsible for the content of third-party advertisements.</p>
      </section>

      <section>
        <h2>7. Limitation of Liability</h2>
        <p>To the fullest extent permitted by law, LoanCalc shall not be liable for any indirect, incidental, special, or consequential damages, including:</p>
        <ul>
          <li>Loss of profits, data, or other intangible losses</li>
          <li>Financial decisions made based on our calculator results</li>
          <li>Errors or inaccuracies in calculations</li>
          <li>Interruption or unavailability of the Service</li>
        </ul>
      </section>

      <section>
        <h2>8. Governing Law</h2>
        <p>These Terms shall be governed by and construed in accordance with applicable laws, without regard to conflict of law principles.</p>
      </section>

      <section>
        <h2>9. Contact</h2>
        <p>For questions about these Terms, please visit our <NuxtLink to="/contact" class="text-primary hover:underline">Contact page</NuxtLink>.</p>
      </section>
    </div>
  </div>
</template>

<style scoped>
.prose-custom h2 { @apply text-xl font-bold text-foreground mt-2 mb-3; }
.prose-custom p { @apply text-sm leading-relaxed text-muted-foreground mb-3; }
.prose-custom ul { @apply list-disc pl-5 space-y-1.5 text-sm text-muted-foreground mb-3; }
.prose-custom section { @apply rounded-2xl border border-border bg-card p-6 shadow-card; }
</style>
