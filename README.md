# Loan Calculator (Nuxt 4)

Loan calculator and loan consolidation app built with Nuxt 4, TypeScript, Tailwind CSS, and TanStack Form + Zod.

## Setup

### Docker Compose

```bash
docker compose up --build
```

The app runs on `http://localhost:3000`.

### Local

```bash
npm install
npm run dev
```

## Features

- Standard loan calculations (monthly payment, total payment, total interest)
- Full amortization schedule rendering
- Loan consolidation for 2+ loans with weighted-average interest rate
- Savings comparison between current loans vs. consolidated loan
- Calculation and consolidation history persisted in browser `localStorage`
- Download history exports as CSV or XLSX

## Tech

- Nuxt 4
- TypeScript
- Tailwind CSS + Shadcn-style UI components
- TanStack Vue Form + Zod validation
- VueUse local storage persistence
- XLSX export via SheetJS (`xlsx`)
