#!/usr/bin/env node
// Link check for the vendored agent skills under .claude/skills.
//
// The skills are third-party text copied at a pinned upstream SHA and then
// edited (sections dropped, files removed, pointers added at this repo). That
// editing is exactly what dangles a relative link, so this asserts that every
// relative Markdown link and image inside .claude/skills resolves to a file
// that actually exists. External links (http/https/mailto) and in-page
// anchors are not fetched -- only on-disk targets are checked.
//
// Run: node scripts/skills/check-links.mjs   (pnpm skills:check)

import { readdirSync, readFileSync, existsSync, statSync } from 'node:fs'
import { join, dirname, resolve, relative, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..')
const skillsRoot = join(repoRoot, '.claude', 'skills')

/** @returns {string[]} every .md file under dir, recursively */
function markdownFiles(dir) {
  const out = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) out.push(...markdownFiles(full))
    else if (entry.isFile() && entry.name.endsWith('.md')) out.push(full)
  }
  return out
}

// Inline links/images: [text](target) and ![alt](target). Reference-style
// definitions ([label]: target) are matched separately.
const INLINE = /!?\[(?:[^\]\\]|\\.)*\]\(\s*<?([^()<>\s]+)>?(?:\s+"[^"]*")?\s*\)/g
const REFDEF = /^[ \t]{0,3}\[[^\]]+\]:[ \t]*<?([^\s<>]+)>?/gm
// Fenced code blocks are stripped first: examples inside them are not links.
const FENCE = /^([ \t]*)(`{3,}|~{3,})[^\n]*\n[\s\S]*?^\1\2[ \t]*$/gm

function targetsIn(text) {
  const body = text.replace(FENCE, (m) => m.replace(/[^\n]/g, ' '))
  const found = []
  for (const re of [INLINE, REFDEF]) {
    re.lastIndex = 0
    let m
    while ((m = re.exec(body)) !== null) {
      const upto = body.slice(0, m.index)
      found.push({ target: m[1], line: upto.split('\n').length })
    }
  }
  return found
}

if (!existsSync(skillsRoot)) {
  console.error(`No skills directory at ${relative(repoRoot, skillsRoot)}`)
  process.exit(1)
}

const files = markdownFiles(skillsRoot)
const broken = []
let checked = 0

for (const file of files) {
  const text = readFileSync(file, 'utf8')
  for (const { target, line } of targetsIn(text)) {
    if (/^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(target)) continue // http:, mailto:, //host
    if (target.startsWith('#')) continue // in-page anchor
    const path = decodeURI(target.split('#')[0].split('?')[0])
    if (path === '') continue
    checked++
    // A leading "/" in vendored docs means a site-root URL, not this repo.
    const abs = path.startsWith('/') ? null : resolve(dirname(file), path)
    if (abs === null) continue
    if (!existsSync(abs)) {
      broken.push({ file, line, target, reason: 'missing' })
      continue
    }
    // Escaping the repo would mean the link breaks for anyone cloning it.
    if (relative(repoRoot, abs).startsWith('..' + sep)) {
      broken.push({ file, line, target, reason: 'outside the repo' })
      continue
    }
    if (statSync(abs).isDirectory() && !path.endsWith('/')) {
      // A bare directory link is fine (GitHub renders it); nothing to assert.
    }
  }
}

if (broken.length > 0) {
  console.error(`\n${broken.length} broken link(s) under .claude/skills:\n`)
  for (const b of broken) {
    console.error(`  ${relative(repoRoot, b.file)}:${b.line}  ${b.target}  (${b.reason})`)
  }
  console.error('')
  process.exit(1)
}

console.log(
  `skills:check OK -- ${checked} relative link(s) resolve across ${files.length} markdown file(s) in .claude/skills`
)
