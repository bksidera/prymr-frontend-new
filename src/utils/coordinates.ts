// Normalized coordinate utilities.
// All board element positions are stored as 0–1 floats.
// These helpers convert between pixels and normalized values.

export function normalizeX(pixelLeft: number, canvasWidth: number): number {
  return pixelLeft / canvasWidth
}

export function normalizeY(pixelTop: number, canvasHeight: number): number {
  return pixelTop / canvasHeight
}

export function normalizeW(pixelWidth: number, canvasWidth: number): number {
  return pixelWidth / canvasWidth
}

export function normalizeH(pixelHeight: number, canvasHeight: number): number {
  return pixelHeight / canvasHeight
}

export function denormalizeX(normalizedX: number, canvasWidth: number): number {
  return normalizedX * canvasWidth
}

export function denormalizeY(normalizedY: number, canvasHeight: number): number {
  return normalizedY * canvasHeight
}

// Convert a normalized position to a CSS percentage string for the player.
// e.g. toCSSPercent(0.25) => "25%"
export function toCSSPercent(normalized: number): string {
  return `${normalized * 100}%`
}

// Clamp a value to the 0–1 range (prevents elements going off-board).
export function clampNormalized(value: number): number {
  return Math.max(0, Math.min(1, value))
}
