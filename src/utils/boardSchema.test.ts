import { describe, it, expect } from 'vitest'
import { createEmptyBoard, serializeBoard, deserializeBoard } from './boardSchema'

describe('boardSchema', () => {
  it('creates an empty board with correct defaults', () => {
    const board = createEmptyBoard('user-123', '9:16', 'fixed-id')
    expect(board.version).toBe('1.0')
    expect(board.id).toBe('fixed-id')
    expect(board.creatorId).toBe('user-123')
    expect(board.aspectRatio).toBe('9:16')
    expect(board.elements).toEqual([])
    expect(board.tappables).toEqual([])
    expect(board.metadata.boardStatus).toBe('draft')
  })

  it('round-trips through serialization', () => {
    const board = createEmptyBoard('user-123', '1:1', 'fixed-id-2')
    const serialized = serializeBoard(board)
    const deserialized = deserializeBoard(serialized)
    expect(deserialized).toEqual(board)
  })

  it('throws on invalid schema version', () => {
    expect(() => deserializeBoard(JSON.stringify({ version: '0.9' }))).toThrow()
  })

  it('throws on non-object input', () => {
    expect(() => deserializeBoard('"not an object"')).toThrow()
  })
})
