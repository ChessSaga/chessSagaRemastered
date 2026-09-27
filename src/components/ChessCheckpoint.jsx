import {useEffect, useMemo, useRef, useState} from 'react'
import {Chess} from 'chess.js'
import {Chessboard} from 'react-chessboard'
import {normalizeSan} from '../lib/checkpoint'

const MAX_BOARD_PX = 650
const MIN_BOARD_PX = 260
const VIEWPORT_BOARD_RATIO = 0.62

const SELECTED_STYLE = {background: 'rgba(37, 99, 235, 0.45)'}
const LAST_MOVE_STYLE = {background: 'rgba(255, 179, 0, 0.45)'}
const DOT_EMPTY = 'radial-gradient(circle, rgba(37, 99, 235, 0.5) 24%, transparent 25%)'
const DOT_CAPTURE = 'radial-gradient(circle, rgba(37, 99, 235, 0.45) 84%, transparent 85%)'

// react-chessboard needs an explicit pixel width, so measure the slot it sits in.
function useBoardWidth(ref) {
  const [width, setWidth] = useState(420)

  useEffect(() => {
    const element = ref.current
    if (!element) return undefined

    function measure() {
      const available = element.clientWidth
      if (!available) return
      // On narrow screens the board should take the width it can get; on desktop
      // cap it against viewport height so the whole challenge stays on screen.
      const capped =
        window.innerWidth < 1024
          ? available
          : Math.min(available, window.innerHeight * VIEWPORT_BOARD_RATIO)
      setWidth(Math.max(MIN_BOARD_PX, Math.floor(Math.min(capped, MAX_BOARD_PX))))
    }

    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(element)
    window.addEventListener('resize', measure)

    return () => {
      observer.disconnect()
      window.removeEventListener('resize', measure)
    }
  }, [ref])

  return width
}

export default function ChessCheckpoint({fen, hint, onResolve}) {
  // The starting position is never mutated; a staged move is computed on a copy.
  const base = useMemo(() => new Chess(fen), [fen])

  const [pending, setPending] = useState(null)
  const [moveFrom, setMoveFrom] = useState('')
  const [hintOpen, setHintOpen] = useState(false)
  const [feedback, setFeedback] = useState(null)
  const [attemptsLeft, setAttemptsLeft] = useState(null)

  const wrapRef = useRef(null)
  const boardWidth = useBoardWidth(wrapRef)

  const orientation = base.turn() === 'b' ? 'black' : 'white'

  function ownPieceOn(square) {
    const piece = base.get(square)
    return Boolean(piece && piece.color === base.turn())
  }

  // Returns the staged move without touching `base`.
  function stageMove(from, to) {
    const probe = new Chess(fen)
    let move = null
    try {
      move = probe.move({from, to, promotion: 'q'})
    } catch {
      move = null
    }
    if (!move) return null
    return {from: move.from, to: move.to, san: move.san, fen: probe.fen()}
  }

  function handleDrop(sourceSquare, targetSquare) {
    const staged = stageMove(sourceSquare, targetSquare)
    setMoveFrom('')
    if (!staged) return false
    setPending(staged)
    setFeedback(null)
    return true
  }

  // Tap-to-select, tap-to-move. Works on touch, where dragging often does not.
  function handleSquareClick(square) {
    if (!moveFrom) {
      if (ownPieceOn(square)) {
        setMoveFrom(square)
        setFeedback(null)
      }
      return
    }

    if (square === moveFrom) {
      setMoveFrom('')
      return
    }

    const staged = stageMove(moveFrom, square)
    if (staged) {
      setPending(staged)
      setMoveFrom('')
      setFeedback(null)
      return
    }

    setMoveFrom(ownPieceOn(square) ? square : '')
  }

  function handleReset() {
    setPending(null)
    setMoveFrom('')
    setFeedback(null)
  }

  function handleSubmit() {
    if (!pending) return

    const result = onResolve(normalizeSan(pending.san)) || {}
    if (result.ok) return // resolved: the board is about to collapse away

    const played = pending.san

    // Put the board back so they can try something else.
    setPending(null)
    setMoveFrom('')

    if (result.retry) {
      setAttemptsLeft(result.attemptsLeft)
      setFeedback({
        tone: 'retry',
        text: `${played} isn't the strongest move here. Look for a better one.`,
      })
      return
    }

    // Legal, but the author mapped no branch to it. Doesn't cost an attempt.
    setFeedback({
      tone: 'unmapped',
      text: `${played} isn't part of this challenge. Try a different move.`,
    })
  }

  const squareStyles = useMemo(() => {
    const styles = {}

    if (pending) {
      styles[pending.from] = LAST_MOVE_STYLE
      styles[pending.to] = LAST_MOVE_STYLE
      return styles
    }

    if (!moveFrom) return styles

    styles[moveFrom] = SELECTED_STYLE
    for (const move of base.moves({square: moveFrom, verbose: true})) {
      styles[move.to] = {background: base.get(move.to) ? DOT_CAPTURE : DOT_EMPTY}
    }
    return styles
  }, [moveFrom, pending, base])

  return (
    <div className="flex w-full flex-col items-center">
      {/* The outer div stays full width so measuring it can't feed back into the
          board size; the inner one is exactly board-sized so mx-auto centres it.
          react-chessboard renders its own width:100% wrapper, so justify-center
          on the measured element would have nothing to centre. */}
      <div ref={wrapRef} className="w-full">
        <div className="mx-auto" style={{width: boardWidth}}>
          <Chessboard
            position={pending ? pending.fen : fen}
            boardOrientation={orientation}
            boardWidth={boardWidth}
            onPieceDrop={handleDrop}
            onSquareClick={handleSquareClick}
            customSquareStyles={squareStyles}
            customBoardStyle={{borderRadius: '0.5rem', boxShadow: '0 10px 30px rgba(11, 59, 111, 0.18)'}}
          />
        </div>
      </div>

      <div className="mt-4 flex w-full items-center justify-center gap-2" style={{maxWidth: boardWidth}}>
        <button
          type="button"
          onClick={handleReset}
          disabled={!pending && !moveFrom}
          className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-40"
        >
          Reset
        </button>

        {hint ? (
          <button
            type="button"
            onClick={() => setHintOpen((open) => !open)}
            className={`rounded-xl border px-4 py-2.5 text-sm font-semibold transition ${
              hintOpen
                ? 'border-amber-300 bg-amber-50 text-amber-900'
                : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
            }`}
          >
            Hint
          </button>
        ) : null}

        <button
          type="button"
          onClick={handleSubmit}
          disabled={!pending}
          className="flex-1 rounded-xl bg-[var(--color-primary)] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {pending ? `Submit ${pending.san}` : 'Submit move'}
        </button>
      </div>

      <div className="mx-auto mt-2.5 min-h-[2.75rem] w-full text-center" style={{maxWidth: boardWidth}}>
        {feedback ? (
          <div
            className={`rounded-lg border px-3 py-2 text-sm font-medium ${
              feedback.tone === 'retry'
                ? 'border-amber-300 bg-amber-50 text-amber-900'
                : 'border-slate-300 bg-slate-50 text-slate-700'
            }`}
          >
            <p>{feedback.text}</p>
            {feedback.tone === 'retry' && attemptsLeft !== null ? (
              <p className="mt-0.5 text-xs font-normal">
                {attemptsLeft === 1
                  ? 'Last attempt — after this the explanation plays.'
                  : `${attemptsLeft} attempts left.`}
              </p>
            ) : null}
          </div>
        ) : hintOpen && hint ? (
          <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">{hint}</p>
        ) : (
          <p className="text-xs text-slate-500">
            {pending
              ? 'Submit to see the explanation, or reset to change your mind.'
              : 'Tap a piece, then tap where it goes.'}
          </p>
        )}
      </div>
    </div>
  )
}
