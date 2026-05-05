// Board JSON Schema v2
// Contract between builder, API, and player.
// All positions are normalized 0–1 floats (never pixels).

export type BoardSchemaVersion = '1.0' | '2'

export interface BoardSchema {
  version: BoardSchemaVersion
  id: string
  creatorId: string
  title?: string
  description?: string
  background: string // CSS color, gradient, or image URL
  aspectRatio: '9:16' | '1:1' | '4:3' | '16:9'
  elements: BoardElement[]
  tappables: TappableZone[]
  metadata: {
    createdAt: string // ISO 8601
    publishedAt?: string
    boardStatus: 'draft' | 'published'
    /**
     * Optional intro state set by the creator. Defines initial zoom and
     * pan position when the board first opens. If null/missing, the
     * viewer fits the entire board to the viewport (zoom = 1).
     *
     * x/y are normalized 0–1 (center point of the intro view).
     */
    introState?: IntroState | null
  }
}

export interface IntroState {
  zoom: number // 1.0 = fit-to-viewport; max ~4
  x: number // normalized 0–1 center
  y: number // normalized 0–1 center
}

export interface BoardElement {
  id: string
  type: 'image' | 'video' | 'gif' | 'text' | 'shape'

  // All positions normalized 0–1 relative to board dimensions
  x: number
  y: number
  w: number
  h: number
  rotation: number // degrees 0–360
  zIndex: number // layer order, higher = on top
  initiallyHidden?: boolean // hidden until a tappable reveals/switches it

  url?: string // S3 URL (image, video, gif)
  content?: string // text content

  style?: {
    fontFamily?: string
    fontSize?: number // normalized relative to board height
    color?: string
    backgroundColor?: string
    opacity?: number // 0–1
    borderRadius?: number // pixels (visual, not positional)
  }

  // Video/GIF playback
  autoplay?: boolean // default: true
  loop?: boolean // default: true
  muted?: boolean // default: true (required for autoplay)
}

export interface TappableZone {
  id: string

  // Normalized 0–1
  x: number
  y: number
  w: number
  h: number

  action: TappableAction

  visible: boolean
  style?: {
    opacity?: number
    borderRadius?: number
    color?: string
  }
}

export type TappableAction =
  | { type: 'appreciation'; suggestedAmount?: number }
  | { type: 'link'; url: string; openIn: 'same' | 'new' }
  | { type: 'reveal'; elementId: string }
  | { type: 'vanish'; elementId: string }
  | { type: 'switch'; fromElementId?: string; toElementId: string }
  | {
      type: 'infoOverlay'
      title: string
      body?: string
      imageUrl?: string
      price?: number
      purchaseUrl?: string
    }
  | { type: 'follow' }
  | { type: 'purchase'; saleItemId: string }

/**
 * Runtime forward-migration: any board read from the backend that's
 * still on `version: '1.0'` gets upgraded in place to v2 by adding
 * `introState: null` (defaults to fit-to-viewport at view time).
 *
 * Mutates and returns the same object.
 */
export function migrateBoardSchema(schema: BoardSchema): BoardSchema {
  if (schema.version === '2') return schema
  if (!schema.metadata) {
    schema.metadata = {
      createdAt: new Date().toISOString(),
      boardStatus: 'draft',
      introState: null,
    }
  } else if (schema.metadata.introState === undefined) {
    schema.metadata.introState = null
  }
  schema.version = '2'
  return schema
}
