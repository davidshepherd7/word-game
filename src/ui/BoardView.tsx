import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { type Board, BoardLocation, boardWord, type Letter } from '../logic/board.ts'

function nextPath(path: BoardLocation[], col: number, row: number): BoardLocation[] {
  const last = path[path.length - 1]
  if (!last) return [new BoardLocation(col, row)]

  // Re-entering the previous cell backtracks, so a mis-drag can be corrected.
  const prev = path[path.length - 2]
  if (prev && prev.col === col && prev.row === row) {
    return path.slice(0, -1)
  }

  const alreadyUsed = path.some((loc) => loc.col === col && loc.row === row)
  const adjacent = Math.max(Math.abs(last.col - col), Math.abs(last.row - row)) === 1
  if (alreadyUsed || !adjacent) return path

  return [...path, new BoardLocation(col, row)]
}

export function BoardView({
  board,
  onWord,
}: {
  board: Board
  onWord?: (letters: readonly Letter[]) => void
}) {
  // Fraction of a tile's width, measured from its centre, within which a drag
  // registers that tile. Smaller means you must drag nearer the centre.
  const hitRadiusRatio = 0.5

  const [path, setPath] = useState<BoardLocation[]>([])
  const [selecting, setSelecting] = useState(false)
  const [points, setPoints] = useState<{ x: number; y: number }[]>([])

  const svgRef = useRef<SVGSVGElement>(null)
  const cellRefs = useRef(new Map<string, HTMLDivElement>())

  // The pointerup listener fires from outside React, so read the live path
  // through a ref rather than a stale closure.
  const pathRef = useRef(path)
  useEffect(() => {
    pathRef.current = path
  }, [path])

  useEffect(() => {
    if (!selecting) return
    const stop = () => {
      setSelecting(false)
      if (pathRef.current.length > 0) onWord?.(boardWord(board, pathRef.current))
      setPath([])
    }
    window.addEventListener('pointerup', stop)
    return () => window.removeEventListener('pointerup', stop)
  }, [selecting, onWord, board])

  // Trace the line through the centres of the selected cells, measured from the
  // DOM so it stays correct as the cells resize.
  const measure = useCallback(() => {
    const origin = svgRef.current?.getBoundingClientRect()
    if (!origin) return
    setPoints(
      path.map(({ col, row }) => {
        const rect = cellRefs.current.get(`${row}-${col}`)!.getBoundingClientRect()
        return {
          x: rect.left - origin.left + rect.width / 2,
          y: rect.top - origin.top + rect.height / 2,
        }
      }),
    )
  }, [path])

  useLayoutEffect(measure, [measure])

  useEffect(() => {
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [measure])

  const isSelected = (col: number, row: number) =>
    path.some((loc) => loc.col === col && loc.row === row)

  const word = boardWord(board, path)
    .map((letter) => letter.alpha)
    .join('')

  return (
    <div className="board-area">
      <div className="current-word" aria-live="polite">
        {word || <span className="hint">Drag across letters to spell a word</span>}
      </div>
      <div className="board" role="grid" onContextMenu={(event) => event.preventDefault()}>
        {board.grid.map((cells, row) => (
          <div className="board-row" role="row" key={row}>
            {cells.map((letter, col) => (
              <div
                className="board-cell"
                role="gridcell"
                aria-selected={isSelected(col, row)}
                key={col}
                ref={(el) => {
                  const key = `${row}-${col}`
                  if (el) cellRefs.current.set(key, el)
                  else cellRefs.current.delete(key)
                }}
                onPointerDown={(event) => {
                  if (event.button !== 0) return
                  // Touch implicitly captures the pointer to this cell, which
                  // would send every later pointermove here instead of to the
                  // cell under the finger. Release it so the drag can advance.
                  event.currentTarget.releasePointerCapture(event.pointerId)
                  setSelecting(true)
                  setPath([new BoardLocation(col, row)])
                }}
                onPointerMove={(event) => {
                  if (!selecting) return
                  const rect = event.currentTarget.getBoundingClientRect()
                  const dx = event.clientX - (rect.left + rect.width / 2)
                  const dy = event.clientY - (rect.top + rect.height / 2)
                  if (Math.hypot(dx, dy) <= rect.width * hitRadiusRatio) {
                    setPath((current) => nextPath(current, col, row))
                  }
                }}
              >
                {letter.alpha === 'QU' ? 'Qu' : letter.alpha}
              </div>
            ))}
          </div>
        ))}
        <svg className="select-line" ref={svgRef} aria-hidden="true">
          <g className="select-line-trace">
            <polyline points={points.map((point) => `${point.x},${point.y}`).join(' ')} />
            {points.map((point, index) => (
              <circle cx={point.x} cy={point.y} r={14} key={index} />
            ))}
          </g>
        </svg>
      </div>
    </div>
  )
}
