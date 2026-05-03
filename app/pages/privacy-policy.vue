<script setup lang="ts">
useHead({
  title: 'Privacy Policy',
  meta: [
    { name: 'description', content: 'Privacy Policy for LoanCalc — learn how we collect, use, and protect your data, including information about cookies and Google AdSense.' },
    { property: 'og:title', content: 'Privacy Policy | LoanCalc' },
    { property: 'og:description', content: 'Learn how LoanCalc handles your data, cookies, and third-party advertising.' },
  ],
})

const lastUpdated = 'May 3, 2026'
</script>

<template>
  <div class="mx-auto max-w-4xl px-4 py-10 sm:py-16">
    <!-- Page Header -->
    <div class="mb-10">
      <div class="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary mb-4">
        <svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
        Legal
      </div>
      <h1 class="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">Privacy Policy</h1>
      <p class="mt-3 text-sm text-muted-foreground">Last updated: {{ lastUpdated }}</p>
    </div>

    <!-- Content -->
    <div class="prose-custom space-y-8">
      <section>
        <h2>1. Introduction</h2>
        <p>
          Welcome to LoanCalc ("we," "our," or "us"). We are committed to protecting your privacy and ensuring the security
          of your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your
          information when you visit our website and use our loan calculator services.
        </p>
        <p>
          By using our website, you agree to the collection and use of information in accordance with this policy. If you
          do not agree with the terms of this Privacy Policy, please do not access the site.
        </p>
      </section>

      <section>
        <h2>2. Information We Collect</h2>
        <h3>2.1 Information You Provide</h3>
        <p>We may collect the following information when you use our calculator tools:</p>
        <ul>
          <li>Loan principal amounts, interest rates, and loan terms you enter into our calculators</li>
          <li>Contact information (name, email address) if you choose to contact us</li>
          <li>Any other information you voluntarily provide through our services</li>
        </ul>

        <h3>2.2 Automatically Collected Information</h3>
        <p>When you visit our website, we may automatically collect certain information, including:</p>
        <ul>
          <li>Browser type and version</li>
          <li>Operating system</li>
          <li>IP address (anonymized where possible)</li>
          <li>Pages visited and time spent on our site</li>
          <li>Referring website addresses</li>
          <li>Device information (screen size, device type)</li>
        </ul>
      </section>

      <section>
        <h2>3. Cookies and Tracking Technologies</h2>
        <p>
          We use cookies and similar tracking technologies to enhance your experience on our website. Cookies are small
          data files stored on your device that help us improve our services.
        </p>
        <h3>3.1 Types of Cookies We Use</h3>
        <ul>
          <li>
            <strong>Essential Cookies:</strong> Required for the website to function properly, including storing your
            theme preference and cookie consent choice.
          </li>
          <li>
            <strong>Analytics Cookies:</strong> Help us understand how visitors interact with our website so we can
            improve the user experience.
          </li>
          <li>
            <strong>Advertising Cookies:</strong> Used by Google AdSense and other advertising partners to display
            relevant advertisements based on your browsing behavior.
          </li>
        </ul>

        <h3>3.2 Managing Cookies</h3>
        <p>
          You can manage your cookie preferences at any time through the cookie settings banner that appears when you
          first visit our website, or by clicking "Cookie Settings" in our website footer. You may also configure your
          browser to reject cookies, although this may affect site functionality.
        </p>
      </section>

      <section>
        <h2>4. Google AdSense and Third-Party Advertising</h2>
        <p>
          We use Google AdSense to display advertisements on our website. Google AdSense uses cookies to serve ads based
          on your prior visits to our website and other websites on the Internet.
        </p>
        <ul>
          <li>
            Google's use of advertising cookies enables it and its partners to serve ads based on your visit to our site
            and/or other sites on the Internet.
          </li>
          <li>
            You may opt out of personalized advertising by visiting
            <a href="https://www.google.com/settings/ads" target="_blank" rel="noopener noreferrer" class="text-primary hover:underline">
              Google Ads Settings</a>.
          </li>
          <li>
            Alternatively, you may opt out of a third-party vendor's use of cookies by visiting the
            <a href="https://optout.networkadvertising.org/" target="_blank" rel="noopener noreferrer" class="text-primary hover:underline">
              Network Advertising Initiative opt-out page</a>.
          </li>
        </ul>
        <p>
          For more information about how Google uses your data, please review
          <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" class="text-primary hover:underline">
            Google's Privacy Policy</a>.
        </p>
      </section>

      <section>
        <h2>5. How We Use Your Information</h2>
        <p>We use the information we collect to:</p>
        <ul>
          <li>Provide and maintain our loan calculator services</li>
          <li>Improve and personalize your experience on our website</li>
          <li>Analyze usage patterns to improve our services</li>
          <li>Display relevant advertisements through Google AdSense</li>
          <li>Respond to your inquiries and provide customer support</li>
          <li>Comply with legal obligations</li>
        </ul>
      </section>

      <section>
        <h2>6. Data Sharing and Disclosure</h2>
        <p>We do not sell your personal information. We may share your information with:</p>
        <ul>
          <li>
            <strong>Google AdSense:</strong> For the purpose of serving personalized or non-personalized advertisements
          </li>
          <li>
            <strong>Analytics Providers:</strong> To help us analyze website traffic and usage
          </li>
          <li>
            <strong>Legal Authorities:</strong> When required by law or to protect our rights
          </li>
        </ul>
      </section>

      <section>
        <h2>7. Your Rights (GDPR/CCPA)</h2>
        <p>Depending on your location, you may have the following rights regarding your personal data:</p>
        <ul>
          <li><strong>Right of Access:</strong> Request a copy of the personal data we hold about you</li>
          <li><strong>Right to Rectification:</strong> Request correction of inaccurate personal data</li>
          <li><strong>Right to Erasure:</strong> Request deletion of your personal data</li>
          <li><strong>Right to Restrict Processing:</strong> Request restriction of processing of your data</li>
          <li><strong>Right to Data Portability:</strong> Request transfer of your data to another service</li>
          <li><strong>Right to Object:</strong> Object to the processing of your personal data</li>
          <li><strong>Right to Withdraw Consent:</strong> Withdraw consent at any time for cookie-based processing</li>
        </ul>
        <p>
          To exercise any of these rights, please contact us using the information provided on our
          <NuxtLink to="/contact" class="text-primary hover:underline">Contact page</NuxtLink>.
        </p>
      </section>

      <section>
        <h2>8. Data Retention</h2>
        <p>
          We retain your personal information only for as long as necessary to fulfill the purposes outlined in this
          Privacy Policy, unless a longer retention period is required by law. Calculation data stored locally in your
          browser is retained until you clear your browser data.
        </p>
      </section>

      <section>
        <h2>9. Data Security</h2>
        <p>
          We implement appropriate technical and organizational measures to protect your personal information against
          unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the
          Internet is 100% secure, and we cannot guarantee absolute security.
        </p>
      </section>

      <section>
        <h2>10. Children's Privacy</h2>
        <p>
          Our website is not intended for children under the age of 13. We do not knowingly collect personal information
          from children under 13. If we discover that we have inadvertently collected such information, we will take steps
          to delete it promptly.
        </p>
      </section>

      <section>
        <h2>11. Changes to This Policy</h2>
        <p>
          We may update this Privacy Policy from time to time. Any changes will be posted on this page with an updated
          "Last updated" date. We encourage you to review this policy periodically.
        </p>
      </section>

      <section>
        <h2>12. Contact Us</h2>
        <p>
          If you have any questions or concerns about this Privacy Policy, please contact us through our
          <NuxtLink to="/contact" class="text-primary hover:underline">Contact page</NuxtLink>.
        </p>
      </section>
    </div>
  </div>
</template>

<style scoped>
.prose-custom h2 {
  @apply text-xl font-bold text-foreground mt-2 mb-3;
}
.prose-custom h3 {
  @apply text-base font-semibold text-foreground mt-4 mb-2;
}
.prose-custom p {
  @apply text-sm leading-relaxed text-muted-foreground mb-3;
}
.prose-custom ul {
  @apply list-disc pl-5 space-y-1.5 text-sm text-muted-foreground mb-3;
}
.prose-custom section {
  @apply rounded-2xl border border-border bg-card p-6 shadow-card;
}
</style>
