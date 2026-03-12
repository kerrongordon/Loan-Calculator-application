# Agents & Project Context

## Project Overview
Build a Loan Calculator application using Nuxt 4.
📖 Reference Docs: Nuxt 4 Introduction

## Core Stack

| Layer | Technology |
|---|---|
| Framework | Nuxt 4 |
| Language | TypeScript |
| Styling | Tailwind CSS & Shadcn-Vue |

## Data & Logic

### Forms
- TanStack Form paired with Zod for schema validation — ensuring airtight, type-safe form handling.

### Database / ORM
- Drizzle ORM for database interactions.

### State Management
- A mix of Nuxt `useState` and VueUse composables for reactive, shared state across the application.

---

## Agent Instructions

When building or modifying this project, agents should:

1. **Always use TypeScript** — no plain `.js` files. All components, composables, and utilities must be typed.
2. **Follow Nuxt 4 conventions** — use the `app/` directory structure, auto-imports, and Nuxt 4 specific APIs as outlined in the official docs.
3. **Style with Tailwind CSS** — use utility classes. For UI components, prefer Shadcn-Vue components over building from scratch.
4. **Validate all forms with Zod** — define Zod schemas first, then wire them into TanStack Form. Never skip validation.
5. **Use Drizzle ORM** for any database queries or schema definitions — do not use raw SQL or other ORMs.
6. **Manage state via `useState` or VueUse** — avoid Pinia unless explicitly instructed. Prefer composables for encapsulating logic.
7. **Keep components small and composable** — separate loan calculation logic into dedicated composables (e.g., `useLoanCalculator`, `useLoanConsolidation`).

---

## Loan Calculator — Feature Scope

The application should support:

- Inputting loan principal, interest rate, and loan term
- Calculating monthly payment, total payment, and total interest
- Displaying an amortization schedule
- Form validation (required fields, numeric ranges, etc.) via Zod + TanStack Form
- Persisting calculation history using Drizzle ORM
- Reactive UI updates using `useState` / VueUse

---

## Loan Consolidation — Feature Scope

The application should also support consolidating multiple loans into one, including:

- **Adding multiple loans** — users can input 2 or more existing loans, each with their own principal, interest rate, and remaining term
- **Consolidated summary** — calculate and display a single combined loan showing:
  - Total consolidated principal
  - Weighted average interest rate across all input loans
  - Suggested new loan term (user-adjustable)
  - New monthly payment, total payment, and total interest
- **Savings comparison** — side-by-side view comparing:
  - Current total monthly payments across all individual loans
  - New consolidated monthly payment
  - Total interest saved (or added) by consolidating
- **Amortization schedule** — display a full amortization schedule for the consolidated loan
- **Form validation** — all consolidation inputs validated with Zod (minimum 2 loans, valid numeric ranges, etc.)
- **Persist consolidation history** — save consolidation results alongside standard loan calculations using Drizzle ORM
- **Composable** — encapsulate all consolidation logic in a dedicated `useLoanConsolidation` composable

### Consolidation Schema (Zod)
Each loan entry in the consolidation form should validate:
- `principal`: positive number, required
- `interestRate`: number between 0–100, required
- `remainingTermMonths`: positive integer, required

The consolidation form itself should require a minimum of 2 loan entries before submission is allowed.

### Drizzle Schema Note
Add a `consolidations` table to store:
- A JSON array of input loans
- The resulting consolidated loan details
- A timestamp
- An optional user-provided label/name for the consolidation scenario
