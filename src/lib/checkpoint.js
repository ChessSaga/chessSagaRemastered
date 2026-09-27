// Shared move-to-branch matching for interactive lesson checkpoints.

export function normalizeSan(san) {
  return String(san || '').replace(/[+#!?\s]/g, '')
}

// Returns the branch whose `moves` list contains this SAN, else the branch with an
// empty `moves` list (the author's catch-all), else null.
export function matchBranch(branches, san) {
  if (!Array.isArray(branches)) return null
  const normalized = normalizeSan(san)

  return (
    branches.find((branch) => (branch?.moves || []).some((move) => normalizeSan(move) === normalized)) ||
    branches.find((branch) => branch && (!branch.moves || branch.moves.length === 0)) ||
    null
  )
}

// A wrong move sends the learner back to the board instead of spending the
// explanation immediately. On the final attempt the mistake branch plays so the
// lesson can continue.
export const MAX_CHALLENGE_ATTEMPTS = 5

export function resolveAttempt(branches, san, attemptsUsed, maxAttempts = MAX_CHALLENGE_ATTEMPTS) {
  const branch = matchBranch(branches, san)
  if (!branch) return {ok: false, unmapped: true}

  const used = attemptsUsed + 1
  if ((branch.category || '') === 'mistake' && used < maxAttempts) {
    return {ok: false, retry: true, attemptsUsed: used, attemptsLeft: maxAttempts - used}
  }

  return {ok: true, branch}
}
