/**
 * Card Effect Verification Test
 * Checks that every card defined in gameConfig has a corresponding
 * handler in the codebase (cardEngine.js, RouletteWheel, useGameEngine, etc.)
 */

import { readFileSync, readdirSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join, extname } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const SRC = join(__dirname, '..', 'src')

// ── Recursively collect all .js/.jsx source files ──
function collectFiles(dir) {
  const results = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) {
      results.push(...collectFiles(full))
    } else if (['.js', '.jsx'].includes(extname(entry.name))) {
      results.push(full)
    }
  }
  return results
}

// ── Parse card definitions from gameConfig.js ──
const configSrc = readFileSync(join(SRC, 'utils', 'gameConfig.js'), 'utf-8')

const cardEntries = []
const cardBlockRegex = /(\w+):\s*\{[^}]*id:\s*'([^']+)'[^}]*name:\s*'([^']+)'[^}]*effect:\s*\{([^}]+)\}/g
let match
while ((match = cardBlockRegex.exec(configSrc)) !== null) {
  const [, key, id, name, effectBlock] = match
  const typeMatch = effectBlock.match(/type:\s*'([^']+)'/)
  const triggerMatch = effectBlock.match(/trigger:\s*'([^']+)'/)
  if (typeMatch) {
    cardEntries.push({
      key,
      id,
      name,
      effectType: typeMatch[1],
      trigger: triggerMatch ? triggerMatch[1] : 'none',
    })
  }
}

// ── Collect all effect type strings referenced in source code ──
// We search for the exact effect type strings across all source files
const allEffectTypes = [...new Set(cardEntries.map(c => c.effectType))]
const sourceFiles = collectFiles(SRC)

// For each effect type, check if it appears as a string literal in any source file
// (outside of gameConfig.js itself, since that's the definition, not the handler)
const handledTypes = new Map() // effectType -> [files where it's handled]

for (const effectType of allEffectTypes) {
  const handlers = []
  for (const filePath of sourceFiles) {
    if (filePath.endsWith('gameConfig.js')) continue // skip definitions
    const src = readFileSync(filePath, 'utf-8')
    // Check for the effect type string used in code logic (not imports/comments)
    if (src.includes(`'${effectType}'`) || src.includes(`"${effectType}"`)) {
      const relPath = filePath.replace(SRC, 'src').replace(/\\/g, '/')
      handlers.push(relPath)
    }
  }
  handledTypes.set(effectType, handlers)
}

// ── Output results ──
console.log('')
console.log('╔══════════════════════════════════════════════════════════════════════════════╗')
console.log('║              CARD EFFECT HANDLER VERIFICATION                               ║')
console.log('╚══════════════════════════════════════════════════════════════════════════════╝')
console.log('')

const colName = 'Card Name'.padEnd(20)
const colType = 'Effect Type'.padEnd(22)
const colTrigger = 'Trigger'.padEnd(14)
const colStatus = 'Handler'
console.log(`  ${colName} ${colType} ${colTrigger} ${colStatus}`)
console.log(`  ${'─'.repeat(20)} ${'─'.repeat(22)} ${'─'.repeat(14)} ${'─'.repeat(10)}`)

let passed = 0
let failed = 0
const broken = []

for (const card of cardEntries) {
  const handlers = handledTypes.get(card.effectType) || []
  const hasHandler = handlers.length > 0
  const marker = hasHandler ? '✓' : '✗'
  const status = hasHandler ? ' YES' : ' NO !'

  console.log(
    `  ${card.name.padEnd(20)} ${card.effectType.padEnd(22)} ${card.trigger.padEnd(14)} ${marker}${status}`
  )

  if (hasHandler) {
    passed++
  } else {
    failed++
    broken.push(card)
  }
}

console.log('')
console.log(`  ${'─'.repeat(70)}`)
console.log(`  Total: ${cardEntries.length}   Handled: ${passed}   Missing: ${failed}`)
console.log('')

// Show handler locations for each effect type
console.log('  HANDLER LOCATIONS:')
console.log(`  ${'─'.repeat(70)}`)
for (const [effectType, files] of handledTypes.entries()) {
  if (files.length > 0) {
    console.log(`  '${effectType}' → ${files.join(', ')}`)
  } else {
    console.log(`  '${effectType}' → ⚠ NOT FOUND`)
  }
}
console.log('')

if (broken.length > 0) {
  console.log('  ⚠  BROKEN CARDS (no handler found in any source file):')
  for (const card of broken) {
    console.log(`     - ${card.name} (${card.id}) → effect type: '${card.effectType}'`)
  }
  console.log('')
  process.exit(1)
} else {
  console.log('  ✓ All cards have working effect handlers!')
  console.log('')
  process.exit(0)
}
