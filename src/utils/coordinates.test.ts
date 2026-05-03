import { describe, it, expect } from 'vitest'
import {
  normalizeX,
  normalizeY,
  normalizeW,
  normalizeH,
  denormalizeX,
  denormalizeY,
  toCSSPercent,
  clampNormalized,
} from './coordinates'

describe('coordinates', () => {
  it('normalizes pixel positions to 0–1 floats', () => {
    expect(normalizeX(100, 400)).toBe(0.25)
    expect(normalizeY(50, 200)).toBe(0.25)
    expect(normalizeW(200, 400)).toBe(0.5)
    expect(normalizeH(100, 400)).toBe(0.25)
  })

  it('denormalizes back to pixels', () => {
    expect(denormalizeX(0.25, 400)).toBe(100)
    expect(denormalizeY(0.5, 200)).toBe(100)
  })

  it('round-trips pixel → normalized → pixel', () => {
    const canvas = { w: 800, h: 600 }
    const pixel = { x: 120, y: 90 }
    const norm = { x: normalizeX(pixel.x, canvas.w), y: normalizeY(pixel.y, canvas.h) }
    expect(denormalizeX(norm.x, canvas.w)).toBe(pixel.x)
    expect(denormalizeY(norm.y, canvas.h)).toBe(pixel.y)
  })

  it('converts to CSS percent strings', () => {
    expect(toCSSPercent(0.25)).toBe('25%')
    expect(toCSSPercent(1)).toBe('100%')
    expect(toCSSPercent(0)).toBe('0%')
  })

  it('clamps values to 0–1', () => {
    expect(clampNormalized(-0.5)).toBe(0)
    expect(clampNormalized(1.5)).toBe(1)
    expect(clampNormalized(0.5)).toBe(0.5)
  })
})
