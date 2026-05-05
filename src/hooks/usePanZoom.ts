import { useCallback, useEffect, useRef, useState } from 'react'
import type { IntroState } from '../types/board.types'

export const PAN_ZOOM_MIN = 1
export const PAN_ZOOM_MAX = 4

export interface PanZoomState {
  zoom: number
  tx: number // translate X in container pixels
  ty: number
}

export interface PanZoomApi {
  state: PanZoomState
  setState: (next: PanZoomState) => void
  /**
   * Convert a screen-space pointer event to normalized 0–1 board coordinates.
   * Use this in tap handlers so coords stay in board-space at any zoom.
   */
  screenToBoard: (clientX: number, clientY: number) => { x: number; y: number } | null
}

interface PointerInfo {
  id: number
  x: number
  y: number
}

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v))
}

/**
 * Custom pan/zoom hook for the Prymr board viewer.
 *
 * Tracks `{ zoom, tx, ty }` and applies it as a single CSS transform on the
 * board-content element. Container element defines screen-space bounds;
 * board content lives in normalized 0–1 inside it. Translation and pinch are
 * driven via Pointer Events so the same code path works for touch + mouse + pen.
 *
 * Pan is clamped so the board never leaves the container. Zoom is clamped to
 * [PAN_ZOOM_MIN, PAN_ZOOM_MAX]. On pointer-up after a drag we apply ~300ms of
 * exponentially-decaying inertia.
 *
 * Intro state (if provided) sets the initial transform: zoom + a normalized
 * (x, y) center point mapped to the viewport center.
 */
export function usePanZoom(
  containerRef: React.RefObject<HTMLElement>,
  introState?: IntroState | null,
): PanZoomApi {
  const [state, setRawState] = useState<PanZoomState>({ zoom: 1, tx: 0, ty: 0 })
  const stateRef = useRef(state)
  stateRef.current = state

  const containerSize = useRef({ w: 0, h: 0 })
  const pointers = useRef<Map<number, PointerInfo>>(new Map())
  const dragStart = useRef<{ tx: number; ty: number; px: number; py: number } | null>(null)
  const pinchStart = useRef<{ dist: number; zoom: number; mx: number; my: number } | null>(null)
  const lastMoveTime = useRef(0)
  const velocity = useRef({ vx: 0, vy: 0 })
  const inertiaRaf = useRef<number | null>(null)

  // Clamp & commit a new transform.
  const commit = useCallback((next: PanZoomState) => {
    const { w, h } = containerSize.current
    const zoom = clamp(next.zoom, PAN_ZOOM_MIN, PAN_ZOOM_MAX)
    const tx = clamp(next.tx, w * (1 - zoom), 0)
    const ty = clamp(next.ty, h * (1 - zoom), 0)
    setRawState({ zoom, tx, ty })
  }, [])

  // Initialize from intro state once container size is known.
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    containerSize.current = { w: rect.width, h: rect.height }

    if (introState && introState.zoom > PAN_ZOOM_MIN) {
      const z = clamp(introState.zoom, PAN_ZOOM_MIN, PAN_ZOOM_MAX)
      const tx = rect.width / 2 - introState.x * rect.width * z
      const ty = rect.height / 2 - introState.y * rect.height * z
      commit({ zoom: z, tx, ty })
    }

    const ro = new ResizeObserver(() => {
      const r = el.getBoundingClientRect()
      containerSize.current = { w: r.width, h: r.height }
      commit(stateRef.current)
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [containerRef, introState, commit])

  const stopInertia = useCallback(() => {
    if (inertiaRaf.current !== null) {
      cancelAnimationFrame(inertiaRaf.current)
      inertiaRaf.current = null
    }
  }, [])

  const startInertia = useCallback(() => {
    stopInertia()
    let { vx, vy } = velocity.current
    if (Math.abs(vx) < 0.05 && Math.abs(vy) < 0.05) return
    const tick = () => {
      vx *= 0.9
      vy *= 0.9
      const next = {
        zoom: stateRef.current.zoom,
        tx: stateRef.current.tx + vx * 16,
        ty: stateRef.current.ty + vy * 16,
      }
      commit(next)
      if (Math.abs(vx) > 0.05 || Math.abs(vy) > 0.05) {
        inertiaRaf.current = requestAnimationFrame(tick)
      } else {
        inertiaRaf.current = null
      }
    }
    inertiaRaf.current = requestAnimationFrame(tick)
  }, [commit, stopInertia])

  // Wire pointer events on the container.
  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const onPointerDown = (e: PointerEvent) => {
      stopInertia()
      pointers.current.set(e.pointerId, { id: e.pointerId, x: e.clientX, y: e.clientY })
      el.setPointerCapture(e.pointerId)

      if (pointers.current.size === 1) {
        dragStart.current = {
          tx: stateRef.current.tx,
          ty: stateRef.current.ty,
          px: e.clientX,
          py: e.clientY,
        }
        velocity.current = { vx: 0, vy: 0 }
      } else if (pointers.current.size === 2) {
        const arr = Array.from(pointers.current.values())
        const a = arr[0]!
        const b = arr[1]!
        const dx = b.x - a.x
        const dy = b.y - a.y
        pinchStart.current = {
          dist: Math.hypot(dx, dy),
          zoom: stateRef.current.zoom,
          mx: (a.x + b.x) / 2,
          my: (a.y + b.y) / 2,
        }
        dragStart.current = null
      }
    }

    const onPointerMove = (e: PointerEvent) => {
      const p = pointers.current.get(e.pointerId)
      if (!p) return
      const prevX = p.x
      const prevY = p.y
      p.x = e.clientX
      p.y = e.clientY

      if (pointers.current.size === 2 && pinchStart.current) {
        const arr = Array.from(pointers.current.values())
        const a = arr[0]!
        const b = arr[1]!
        const dist = Math.hypot(b.x - a.x, b.y - a.y)
        const ratio = dist / pinchStart.current.dist
        const newZoom = clamp(pinchStart.current.zoom * ratio, PAN_ZOOM_MIN, PAN_ZOOM_MAX)
        // Anchor zoom around the pinch midpoint.
        const rect = el.getBoundingClientRect()
        const ax = pinchStart.current.mx - rect.left
        const ay = pinchStart.current.my - rect.top
        const ratio2 = newZoom / stateRef.current.zoom
        const newTx = ax - (ax - stateRef.current.tx) * ratio2
        const newTy = ay - (ay - stateRef.current.ty) * ratio2
        commit({ zoom: newZoom, tx: newTx, ty: newTy })
        return
      }

      if (dragStart.current && pointers.current.size === 1) {
        const dx = e.clientX - dragStart.current.px
        const dy = e.clientY - dragStart.current.py
        const now = performance.now()
        const dt = Math.max(1, now - lastMoveTime.current)
        velocity.current = {
          vx: (e.clientX - prevX) / dt,
          vy: (e.clientY - prevY) / dt,
        }
        lastMoveTime.current = now
        commit({
          zoom: stateRef.current.zoom,
          tx: dragStart.current.tx + dx,
          ty: dragStart.current.ty + dy,
        })
      }
    }

    const onPointerUp = (e: PointerEvent) => {
      pointers.current.delete(e.pointerId)
      if (pointers.current.size < 2) pinchStart.current = null
      if (pointers.current.size === 0) {
        dragStart.current = null
        startInertia()
      }
    }

    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      stopInertia()
      const rect = el.getBoundingClientRect()
      const ax = e.clientX - rect.left
      const ay = e.clientY - rect.top
      const factor = Math.exp(-e.deltaY * 0.0015)
      const newZoom = clamp(stateRef.current.zoom * factor, PAN_ZOOM_MIN, PAN_ZOOM_MAX)
      const ratio = newZoom / stateRef.current.zoom
      const newTx = ax - (ax - stateRef.current.tx) * ratio
      const newTy = ay - (ay - stateRef.current.ty) * ratio
      commit({ zoom: newZoom, tx: newTx, ty: newTy })
    }

    el.addEventListener('pointerdown', onPointerDown)
    el.addEventListener('pointermove', onPointerMove)
    el.addEventListener('pointerup', onPointerUp)
    el.addEventListener('pointercancel', onPointerUp)
    el.addEventListener('wheel', onWheel, { passive: false })

    return () => {
      el.removeEventListener('pointerdown', onPointerDown)
      el.removeEventListener('pointermove', onPointerMove)
      el.removeEventListener('pointerup', onPointerUp)
      el.removeEventListener('pointercancel', onPointerUp)
      el.removeEventListener('wheel', onWheel)
    }
  }, [containerRef, commit, startInertia, stopInertia])

  const screenToBoard = useCallback(
    (clientX: number, clientY: number) => {
      const el = containerRef.current
      if (!el) return null
      const rect = el.getBoundingClientRect()
      const px = clientX - rect.left
      const py = clientY - rect.top
      const { zoom, tx, ty } = stateRef.current
      const bx = (px - tx) / (rect.width * zoom)
      const by = (py - ty) / (rect.height * zoom)
      return {
        x: clamp(bx, 0, 1),
        y: clamp(by, 0, 1),
      }
    },
    [containerRef],
  )

  return { state, setState: commit, screenToBoard }
}
