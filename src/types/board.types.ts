// Board JSON Schema v1.0
// This is the contract between builder, API, and player.
// All positions are normalized 0–1 floats (never pixels).

export interface BoardSchema {
  version: '1.0'
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
  }
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
