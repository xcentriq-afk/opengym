// Hevy-style personal records, detected the moment a set is checked off.
//
// Three independent records per exercise, each compared against completed history only:
//   weight — heaviest load lifted (bestWeightFor: logged sets + confirmed working weight)
//   reps   — most reps in a single set (works for bodyweight too, where the load is 0)
//   volume — highest single-set load (weight × reps)
//
// The workout in progress lives in S.active and must never count against itself, so these
// helpers read S.workouts — completed history — and nothing else.
//
// prFlags() runs one pass over an entry's sets with a *running* best: once a set establishes
// a record, the best advances, so only the FIRST set to break a record is flagged — three
// sets at a new weight produce one crown, not three.

import { bestWeightFor } from './history.js'

// All-time records for one exercise: heaviest load, most reps, highest single-set volume.
// Only reps-mode sets carry `r`, so cardio ({min,speed}) and timed ({sec,w}) sets read as
// 0 and fall out on their own — no exercise-type check to keep in sync.
export function bests(S, exId) {
  let reps = 0, volume = 0
  for (const w of S.workouts || []) {
    const e = w.entries.find(e => e.id === exId)
    if (!e) continue
    for (const s of e.sets || []) {
      if (!s.done) continue
      const kg = Number(s.w) || 0
      const r = Number(s.r) || 0
      if (r > reps) reps = r
      const v = kg * r
      if (v > volume) volume = v
    }
  }
  return { weight: (S && S.workouts) ? bestWeightFor(S, exId) : 0, reps, volume }
}

// Which records each set of an entry establishes, against completed history plus the sets
// earlier in this same entry. Returns an array parallel to entry.sets, each element a
// (possibly empty) list of 'weight' | 'reps' | 'volume'.
export function prFlags(S, entry) {
  const { weight, reps, volume } = bests(S, entry && entry.id)
  let wBest = weight, rBest = reps, vBest = volume
  return (entry && entry.sets || []).map(s => {
    if (!s.done) return []
    const kg = Number(s.w) || 0
    const r = Number(s.r) || 0
    const out = []
    if (kg > 0 && kg > wBest) { out.push('weight'); wBest = kg }
    if (r > rBest) { out.push('reps'); rBest = r }
    if (kg > 0 && r > 0 && kg * r > vBest) { out.push('volume'); vBest = kg * r }
    return out
  })
}
