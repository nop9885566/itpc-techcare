'use client'

import { useRef, useEffect, useImperativeHandle, forwardRef } from 'react'

export interface SignaturePadHandle {
  clear: () => void
  isEmpty: () => boolean
  toDataURL: () => string
}

interface SignaturePadProps {
  width?: number
  height?: number
}

const SignaturePad = forwardRef<SignaturePadHandle, SignaturePadProps>(
  ({ width, height = 200 }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const drawing = useRef(false)
    const lastPos = useRef<{ x: number; y: number } | null>(null)

    useEffect(() => {
      const canvas = canvasRef.current
      if (!canvas) return

      const ctx = canvas.getContext('2d')!
      ctx.strokeStyle = '#1a1a1a'
      ctx.lineWidth = 2.5
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
    }, [])

    function getPos(canvas: HTMLCanvasElement, e: { clientX: number; clientY: number }) {
      const rect = canvas.getBoundingClientRect()
      const scaleX = canvas.width / rect.width
      const scaleY = canvas.height / rect.height
      return {
        x: e.clientX * scaleX - rect.left * scaleX,
        y: e.clientY * scaleY - rect.top * scaleY,
      }
    }

    function startDraw(e: React.MouseEvent | React.TouchEvent) {
      e.preventDefault()
      drawing.current = true
      const canvas = canvasRef.current!
      const pos =
        'touches' in e
          ? getPos(canvas, e.touches[0])
          : getPos(canvas, e)
      lastPos.current = pos
    }

    function draw(e: React.MouseEvent | React.TouchEvent) {
      e.preventDefault()
      if (!drawing.current) return
      const canvas = canvasRef.current!
      const ctx = canvas.getContext('2d')!
      const pos =
        'touches' in e
          ? getPos(canvas, e.touches[0])
          : getPos(canvas, e)

      ctx.beginPath()
      ctx.moveTo(lastPos.current!.x, lastPos.current!.y)
      ctx.lineTo(pos.x, pos.y)
      ctx.stroke()
      lastPos.current = pos
    }

    function endDraw() {
      drawing.current = false
      lastPos.current = null
    }

    useImperativeHandle(ref, () => ({
      clear() {
        const canvas = canvasRef.current!
        const ctx = canvas.getContext('2d')!
        ctx.clearRect(0, 0, canvas.width, canvas.height)
      },
      isEmpty() {
        const canvas = canvasRef.current!
        const ctx = canvas.getContext('2d')!
        const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data
        for (let i = 3; i < pixels.length; i += 4) {
          if (pixels[i] > 0) return false
        }
        return true
      },
      toDataURL() {
        return canvasRef.current!.toDataURL('image/png')
      },
    }))

    return (
      <canvas
        ref={canvasRef}
        className="signature-canvas"
        width={width ?? 600}
        height={height}
        onMouseDown={startDraw}
        onMouseMove={draw}
        onMouseUp={endDraw}
        onMouseLeave={endDraw}
        onTouchStart={startDraw}
        onTouchMove={draw}
        onTouchEnd={endDraw}
        style={{ height: `${height}px` }}
        aria-label="พื้นที่วาดลายเซ็น"
      />
    )
  }
)

SignaturePad.displayName = 'SignaturePad'
export default SignaturePad
