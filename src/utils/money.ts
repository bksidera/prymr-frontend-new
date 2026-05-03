// Money utilities — keep units consistent.
// Stripe API always works in cents (integers).
// Database and display always work in dollars (strings/numbers).

export function dollarsToCents(dollars: number): number {
  return Math.round(dollars * 100)
}

export function centsToDollars(cents: number): number {
  return cents / 100
}

export function formatCurrency(dollars: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(dollars)
}
