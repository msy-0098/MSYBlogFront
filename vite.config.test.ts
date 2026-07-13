import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

describe('Vitest workspace isolation', () => {
  it('excludes project-local worktrees from the test discovery set', () => {
    const source = readFileSync('vite.config.ts', 'utf8')
    expect(source).toContain("'**/.worktrees/**'")
    expect(source).toContain('...configDefaults.exclude')
  })
})
