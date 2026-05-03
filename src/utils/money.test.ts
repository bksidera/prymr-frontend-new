import { describe, it, expect } from 'vitest'
import { dollarsToCents, centsToDollars, formatCurrency } from './money'

describe('money', () => {
  it('converts dollars to cents', () => {
    expect(dollarsToCents(5)).toBe(500)
    expect(dollarsToCents(1.99)).toBe(199)
    expect(dollarsToCents(0.1)).toBe(10)
  })

  it('converts cents to dollars', () => {
    expect(centsToDollars(500)).toBe(5)
    expect(centsToDollars(199)).toBe(1.99)
  })

  it('formats currency for display', () => {
    expect(formatCurrency(5)).toBe('$5.00')
    expect(formatCurrency(1.99)).toBe('$1.99')
  })
})
