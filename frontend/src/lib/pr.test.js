import { describe, it, expect } from 'vitest'
import { bests, prFlags } from './pr.js'

// History for 'bench': best weight 100 (topW confirmed), best reps 5, best volume 90×5=450.
// The 90×3 set is unchecked and must not count.
const S = {
  workouts: [
    { d: '2026-01-01', entries: [{ id: 'bench', sets: [{ w: 80, r: 5, done: true }] }] },
    { d: '2026-01-08', entries: [{ id: 'bench', sets: [{ w: 90, r: 5, done: true }, { w: 90, r: 3, done: false }], topW: 100 }] },
    { d: '2026-01-15', entries: [{ id: 'run', sets: [{ min: 30, speed: 10, done: true }] }] }
  ]
}

describe('bests', () => {
  it('returns weight, reps and volume records from completed history', () => {
    expect(bests(S, 'bench')).toEqual({ weight: 100, reps: 5, volume: 450 })
  })

  it('ignores unchecked sets and unrelated exercises', () => {
    expect(bests(S, 'run')).toEqual({ weight: 0, reps: 0, volume: 0 })
    expect(bests(S, 'nope')).toEqual({ weight: 0, reps: 0, volume: 0 })
  })

  it('survives empty or missing history', () => {
    expect(bests({ workouts: [] }, 'bench')).toEqual({ weight: 0, reps: 0, volume: 0 })
    expect(bests({}, 'bench')).toEqual({ weight: 0, reps: 0, volume: 0 })
    expect(bests(S, null)).toEqual({ weight: 0, reps: 0, volume: 0 })
  })
})

describe('prFlags', () => {
  const entry = id => ({ id, sets: [] })

  it('flags a heavier load and the volume that comes with it', () => {
    const e = entry('bench')
    e.sets = [{ w: 105, r: 5, done: true }]
    expect(prFlags(S, e)).toEqual([['weight', 'volume']])
  })

  it('flags more reps at the same weight as a reps + volume record', () => {
    const e = entry('bench')
    e.sets = [{ w: 100, r: 6, done: true }]
    expect(prFlags(S, e)).toEqual([['reps', 'volume']])
  })

  it('flags a volume record without a heavier load or more reps', () => {
    const e = entry('bench')
    e.sets = [{ w: 88, r: 6, done: true }]  // 528 > 450, but 88 < 100 and 6 > 5
    expect(prFlags(S, e)).toEqual([['reps', 'volume']])
  })

  it('stays quiet when nothing is beaten', () => {
    const e = entry('bench')
    e.sets = [{ w: 90, r: 5, done: true }]  // equals the records, does not beat them
    expect(prFlags(S, e)).toEqual([[]])
  })

  it('flags only the first set to break a record, not its twins', () => {
    const e = entry('bench')
    e.sets = [
      { w: 105, r: 5, done: true },
      { w: 105, r: 5, done: true },
      { w: 110, r: 5, done: true }
    ]
    expect(prFlags(S, e)).toEqual([['weight', 'volume'], [], ['weight', 'volume']])
  })

  it('treats the very first set ever as a record across all three', () => {
    const e = entry('deadlift')
    e.sets = [{ w: 140, r: 3, done: true }, { w: 140, r: 3, done: true }]
    expect(prFlags({ workouts: [] }, e)).toEqual([['weight', 'reps', 'volume'], []])
  })

  it('flags a bodyweight rep record but no weight/volume', () => {
    const bw = { workouts: [{ d: '2026-01-01', entries: [{ id: 'pushup', sets: [{ w: 0, r: 20, done: true }] }] }] }
    const e = entry('pushup')
    e.sets = [{ w: 0, r: 25, done: true }]
    expect(prFlags(bw, e)).toEqual([['reps']])
  })

  it('ignores unchecked sets and non-reps (cardio/timed) entries', () => {
    const e = entry('bench')
    e.sets = [{ w: 200, r: 5, done: false }]
    expect(prFlags(S, e)).toEqual([[]])
    const c = entry('run')
    c.sets = [{ min: 60, speed: 12, done: true }]
    expect(prFlags(S, c)).toEqual([[]])
    const t = entry('plank')
    t.sets = [{ sec: 90, w: 0, done: true }]
    expect(prFlags(S, t)).toEqual([[]])
  })

  it('survives a null entry', () => {
    expect(prFlags(S, null)).toEqual([])
  })
})
