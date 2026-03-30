// ═══════════════════════════════════════
// SOUNDS — Web Audio synthesis (clean & crisp)
// ═══════════════════════════════════════
// No external WAV files needed. All sounds generated via Web Audio API.

let audioCtx = null

function getCtx() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)()
  if (audioCtx.state === 'suspended') audioCtx.resume().catch(() => {})
  return audioCtx
}

// ── Core synth: short tone ──
function playTone(freq, duration = 0.05, volume = 0.15, type = 'sine') {
  try {
    const ctx = getCtx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = type
    osc.frequency.value = freq
    const now = ctx.currentTime
    gain.gain.setValueAtTime(Math.min(0.5, volume), now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(now)
    osc.stop(now + duration + 0.01)
  } catch { /* audio unavailable */ }
}

// ── Chord: two tones at once ──
function playChord(freqs, duration = 0.08, volume = 0.12, type = 'sine') {
  for (const f of freqs) playTone(f, duration, volume / freqs.length, type)
}

// ── Noise burst (for pop/impact) ──
function playNoise(duration = 0.04, volume = 0.12) {
  try {
    const ctx = getCtx()
    const bufferSize = Math.floor(ctx.sampleRate * duration)
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize) // decaying noise
    }
    const source = ctx.createBufferSource()
    source.buffer = buffer
    const gain = ctx.createGain()
    gain.gain.value = volume
    // Bandpass to soften
    const filter = ctx.createBiquadFilter()
    filter.type = 'bandpass'
    filter.frequency.value = 2000
    filter.Q.value = 1
    source.connect(filter)
    filter.connect(gain)
    gain.connect(ctx.destination)
    source.start()
  } catch { /* audio unavailable */ }
}

// ── No-op preloads (synthesis needs no preloading) ──
export function preloadAll() {}
export function preloadBuffers() {}
export function playPinHit(hitCount) { sfx.pinHit(hitCount) }
export function playSound() {} // legacy compat

// ── Streak tier config ──
const STREAK_TIERS = ['NICE', 'GREAT', 'EXCELLENT', 'INCREDIBLE', 'GODLIKE']

export const sfx = {
  // UI sounds
  button:      () => playTone(600, 0.04, 0.1, 'square'),
  cardSelect:  () => playTone(800, 0.05, 0.12, 'sine'),
  cardDeselect:() => playTone(400, 0.04, 0.08, 'sine'),
  cardFocus:   () => playTone(700, 0.03, 0.06, 'sine'),
  cardDraw:    () => { playTone(500, 0.04, 0.1); setTimeout(() => playTone(700, 0.04, 0.1), 40) },

  // Scoring sounds
  chips:       () => playTone(550, 0.05, 0.1, 'triangle'),
  chipsAccum:  () => playTone(660, 0.04, 0.08, 'triangle'),
  chipsCard:   () => playChord([523, 659], 0.08, 0.15, 'triangle'), // C + E
  mult:        () => playChord([440, 554], 0.1, 0.18, 'sine'),      // A + C#
  xmult:       () => playChord([523, 659, 784], 0.12, 0.2, 'sine'), // C + E + G
  pop:         () => { playNoise(0.04, 0.15); playTone(880, 0.06, 0.12) },
  bounce:      () => playTone(440, 0.03, 0.06, 'sine'),

  // Pin hit — sine ping, frequency rises with combo count (440Hz → 1200Hz+)
  pinHit: (comboCount = 0) => {
    const freq = 440 + Math.min(comboCount, 60) * 13
    const vol = Math.min(0.2, 0.08 + comboCount * 0.002)
    playTone(freq, 0.05, vol, 'sine')
  },

  // Streak sound — progressively richer chords per tier
  streakSound: (tier = 0) => {
    const t = Math.min(tier, STREAK_TIERS.length - 1)
    const baseFreq = 440 + t * 110
    const chords = [
      [baseFreq],                                    // tier 0: single
      [baseFreq, baseFreq * 1.25],                   // tier 1: major third
      [baseFreq, baseFreq * 1.25, baseFreq * 1.5],   // tier 2: major chord
      [baseFreq, baseFreq * 1.25, baseFreq * 1.5, baseFreq * 2], // tier 3: octave chord
      [baseFreq * 0.5, baseFreq, baseFreq * 1.25, baseFreq * 1.5, baseFreq * 2], // tier 4: full
    ]
    const vol = 0.1 + t * 0.04
    const dur = 0.1 + t * 0.03
    playChord(chords[t], dur, vol, 'sine')
  },
}
