// Run: node src/lib/checkpoint.test.js
import assert from 'node:assert/strict'
import {Chess} from 'chess.js'
import {matchBranch, normalizeSan, resolveAttempt} from './checkpoint.js'

// Legal Petrov position after 1.e4 e5 2.Nf3 Nf6 - white to move.
const FEN = 'rnbqkb1r/pppp1ppp/5n2/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 0 3'

const branches = [
  {category: 'correct', moves: ['Nxe5'], startSec: 270, endSec: 310},
  {category: 'alternative', moves: ['Nc3', 'Bc4'], startSec: 310, endSec: 360},
  {category: 'mistake', moves: [], startSec: 360, endSec: 440}, // catch-all
]

// chess.js v1 throws on an illegal move rather than returning null, which is why the
// board component wraps move() in try/catch. Mirror that here.
function sanFor(from, to) {
  const game = new Chess(FEN)
  try {
    const move = game.move({from, to, promotion: 'q'})
    return move ? normalizeSan(move.san) : null
  } catch {
    return null
  }
}

// Illegal move produces no SAN, so no branch can fire.
assert.equal(sanFor('e1', 'e3'), null, 'king cannot jump two squares')

// Correct move routes to the correct branch.
assert.equal(matchBranch(branches, sanFor('f3', 'e5')).category, 'correct')

// Alternative move routes to the alternative branch.
assert.equal(matchBranch(branches, sanFor('f1', 'c4')).category, 'alternative')

// A legal but unlisted move falls through to the catch-all.
assert.equal(matchBranch(branches, sanFor('d2', 'd4')).category, 'mistake')

// Author wrote "Nxe5" but chess.js may emit "Nxe5+" / "Nxe5#" - decorations are stripped.
assert.equal(matchBranch(branches, 'Nxe5+').category, 'correct')
assert.equal(matchBranch([{category: 'correct', moves: ['Qh5#']}], 'Qh5').category, 'correct')

// With no catch-all branch, an unlisted move matches nothing and the learner retries.
assert.equal(matchBranch([{category: 'correct', moves: ['Nxe5']}], 'd4'), null)
assert.equal(matchBranch(undefined, 'd4'), null)

console.log('checkpoint matching: all assertions passed')

// --- attempt rule -----------------------------------------------------------

const real = [
  {category: 'correct', moves: ['Qxf6']},
  {category: 'alternative', moves: ['gxf6']},
  {category: 'mistake', moves: []}, // catch-all
]

// Five wrong moves: the first four send the learner back, the fifth plays it.
let used = 0
for (let attempt = 1; attempt <= 5; attempt += 1) {
  const out = resolveAttempt(real, 'Qe8', used)
  if (attempt < 5) {
    assert.equal(out.ok, false, `attempt ${attempt} should not resolve`)
    assert.equal(out.retry, true)
    assert.equal(out.attemptsLeft, 5 - attempt)
    used = out.attemptsUsed
  } else {
    assert.equal(out.ok, true, 'fifth attempt must play the mistake branch')
    assert.equal(out.branch.category, 'mistake')
  }
}
assert.equal(used, 4, 'four attempts consumed before the final one')

// A correct or alternative move resolves immediately, whatever the attempt count.
assert.equal(resolveAttempt(real, 'Qxf6', 0).branch.category, 'correct')
assert.equal(resolveAttempt(real, 'Qxf6', 3).ok, true)
assert.equal(resolveAttempt(real, 'gxf6', 3).branch.category, 'alternative')

// An unmapped move costs no attempt (only possible without a catch-all branch).
const noCatchAll = [{category: 'correct', moves: ['Qxf6']}]
const miss = resolveAttempt(noCatchAll, 'd5', 0)
assert.equal(miss.ok, false)
assert.equal(miss.unmapped, true)
assert.equal(miss.retry, undefined, 'unmapped is not a retry')

console.log('attempt rule: all assertions passed')
