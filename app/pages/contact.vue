<script setup lang="ts">
useHead({
  title: 'Contact',
  meta: [
    { name: 'description', content: 'Contact LoanCalc — get in touch with us for questions, feedback, or support.' },
    { property: 'og:title', content: 'Contact | LoanCalc' },
  ],
})

const formData = ref({
  name: '',
  email: '',
  subject: '',
  message: '',
})
const formSubmitted = ref(false)
const formError = ref(false)

const handleSubmit = async () => {
  formError.value = false
  // For now, just show success state — wire up to a server endpoint later
  try {
    // await $fetch('/api/contact', { method: 'POST', body: formData.value })
    formSubmitted.value = true
    formData.value = { name: '', email: '', subject: '', message: '' }
  } catch {
    formError.value = true
  }
}
</script>

<template>
  <div class="mx-auto max-w-4xl px-4 py-10 sm:py-16">
    <!-- Header -->
    <div class="mb-10 text-center">
      <div class="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-blue-600 shadow-xl shadow-primary/25">
        <svg class="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      </div>
      <h1 class="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">Get in Touch</h1>
      <p class="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-muted-foreground">
        Have a question, suggestion, or found a bug? We'd love to hear from you.
      </p>
    </div>

    <div class="grid gap-8 lg:grid-cols-5">
      <!-- Contact Info Cards -->
      <div class="space-y-4 lg:col-span-2">
        <div class="rounded-2xl border border-border bg-card p-5 shadow-card">
          <div class="flex items-center gap-3 mb-3">
            <div class="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 class="text-sm font-bold text-foreground">Email</h3>
          </div>
          <p class="text-sm text-muted-foreground">support@yourdomain.com</p>
        </div>

        <div class="rounded-2xl border border-border bg-card p-5 shadow-card">
          <div class="flex items-center gap-3 mb-3">
            <div class="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 class="text-sm font-bold text-foreground">Response Time</h3>
          </div>
          <p class="text-sm text-muted-foreground">We typically respond within 24–48 hours.</p>
        </div>

        <div class="rounded-2xl border border-border bg-card p-5 shadow-card">
          <div class="flex items-center gap-3 mb-3">
            <div class="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h3 class="text-sm font-bold text-foreground">Privacy</h3>
          </div>
          <p class="text-sm text-muted-foreground">
            Your information is handled per our
            <NuxtLink to="/privacy-policy" class="text-primary hover:underline">Privacy Policy</NuxtLink>.
          </p>
        </div>
      </div>

      <!-- Contact Form -->
      <div class="lg:col-span-3">
        <div class="rounded-2xl border border-border bg-card p-6 shadow-card sm:p-8">
          <!-- Success State -->
          <div v-if="formSubmitted" class="flex flex-col items-center py-8 text-center">
            <div class="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-500/10">
              <svg class="h-7 w-7 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 class="text-lg font-bold text-foreground">Message Sent!</h3>
            <p class="mt-2 text-sm text-muted-foreground">Thank you for reaching out. We'll get back to you soon.</p>
            <button type="button" class="mt-4 text-sm font-medium text-primary hover:underline" @click="formSubmitted = false">
              Send another message
            </button>
          </div>

          <!-- Form -->
          <form v-else class="space-y-5" @submit.prevent="handleSubmit">
            <div>
              <label for="contact-name" class="mb-1.5 block text-xs font-semibold text-foreground">Name</label>
              <input
                id="contact-name"
                v-model="formData.name"
                type="text"
                required
                placeholder="Your name"
                class="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground/50"
              />
            </div>
            <div>
              <label for="contact-email" class="mb-1.5 block text-xs font-semibold text-foreground">Email</label>
              <input
                id="contact-email"
                v-model="formData.email"
                type="email"
                required
                placeholder="you@example.com"
                class="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground/50"
              />
            </div>
            <div>
              <label for="contact-subject" class="mb-1.5 block text-xs font-semibold text-foreground">Subject</label>
              <input
                id="contact-subject"
                v-model="formData.subject"
                type="text"
                required
                placeholder="What is this about?"
                class="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground/50"
              />
            </div>
            <div>
              <label for="contact-message" class="mb-1.5 block text-xs font-semibold text-foreground">Message</label>
              <textarea
                id="contact-message"
                v-model="formData.message"
                rows="5"
                required
                placeholder="Tell us more..."
                class="w-full resize-none rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground/50"
              />
            </div>

            <div v-if="formError" class="rounded-lg border border-red-500/30 bg-red-500/5 p-3 text-xs text-red-500">
              Something went wrong. Please try again later.
            </div>

            <button
              type="submit"
              class="w-full rounded-xl bg-primary px-6 py-3 text-sm font-bold text-white shadow-lg shadow-primary/25 transition-all hover:shadow-xl hover:shadow-primary/30 hover:brightness-110 active:scale-[0.98]"
            >
              Send Message
            </button>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>
