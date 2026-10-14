// WebAudio beeps + haptics (ported from the vanilla app). `enabled` gates sound.
let audioCtx = null
export function beep(enabled, freq, dur, when, type) {
  if (!enabled) return
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)()
    const o = audioCtx.createOscillator(), g = audioCtx.createGain()
    o.connect(g); g.connect(audioCtx.destination)
    o.frequency.value = freq || 880; o.type = type || 'sine'
    const t0 = audioCtx.currentTime + (when || 0)
    g.gain.setValueAtTime(0.001, t0)
    g.gain.exponentialRampToValueAtTime(0.35, t0 + 0.02)
    g.gain.exponentialRampToValueAtTime(0.001, t0 + (dur || 0.18))
    o.start(t0); o.stop(t0 + (dur || 0.18) + 0.05)
  } catch (e) { /* */ }
}
// A short rising fanfare for a personal record — a brighter triangle arpeggio (C5 E5 G5 C6)
// that reads as an achievement, not the flat tick of an action beep.
export function fanfare(enabled) {
  if (!enabled) return
  const notes = [[523.25, 0.14], [659.25, 0.14], [783.99, 0.14], [1046.5, 0.5]]
  notes.forEach(([f, d], i) => beep(true, f, d, i * 0.1, 'triangle'))
}
export function vibrate(p) { try { navigator.vibrate && navigator.vibrate(p) } catch (e) { /* */ } }
