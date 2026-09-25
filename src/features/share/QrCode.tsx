import { useMemo } from 'react'
import { encode } from 'uqr'

/** QR code em SVG puro (sempre preto no branco, com margem, para qualquer câmera ler). */
export function QrCode({
  value,
  label,
  className,
}: {
  value: string
  label: string
  className?: string
}) {
  const path = useMemo(() => {
    const { data, size } = encode(value, { ecc: 'M', border: 2 })
    let d = ''
    data.forEach((row, y) =>
      row.forEach((on, x) => {
        if (on) d += `M${x} ${y}h1v1h-1z`
      }),
    )
    return { d, size }
  }, [value])
  return (
    <svg
      role="img"
      aria-label={label}
      viewBox={`0 0 ${path.size} ${path.size}`}
      shapeRendering="crispEdges"
      className={className}
    >
      <rect width={path.size} height={path.size} fill="#ffffff" />
      <path d={path.d} fill="#000000" />
    </svg>
  )
}
