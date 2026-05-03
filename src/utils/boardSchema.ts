import { v4 as uuidv4 } from 'uuid'
import type { BoardSchema } from '../types/board.types'

export function createEmptyBoard(
  creatorId: string,
  aspectRatio: BoardSchema['aspectRatio'] = '9:16',
  id: string = uuidv4(),
): BoardSchema {
  return {
    version: '1.0',
    id,
    creatorId,
    background: '#000000',
    aspectRatio,
    elements: [],
    tappables: [],
    metadata: {
      createdAt: new Date().toISOString(),
      boardStatus: 'draft',
    },
  }
}

export function serializeBoard(board: BoardSchema): string {
  return JSON.stringify(board)
}

export function deserializeBoard(json: string): BoardSchema {
  const parsed: unknown = JSON.parse(json)
  // Basic version check — future migrations go here
  if (
    typeof parsed !== 'object' ||
    parsed === null ||
    !('version' in parsed) ||
    (parsed as { version: unknown }).version !== '1.0'
  ) {
    throw new Error('Invalid or unsupported board schema version')
  }
  return parsed as BoardSchema
}
