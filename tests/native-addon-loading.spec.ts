/**
 * The skin CSS pipeline is the only part of this package that loads a native
 * addon. Mapping that addon for the host's lifetime makes Windows refuse a
 * runtime `pnpm add` over lightningcss (ERR_PNPM_EPERM), so the import must
 * stay side-effect free and the addon must load on first use.
 */

import { execFileSync } from 'node:child_process'
import { fileURLToPath, pathToFileURL } from 'node:url'

import { describe, expect, it } from 'vitest'

const entry = pathToFileURL(fileURLToPath(new URL('../lib/index.js', import.meta.url))).href

const probe = `
const nativeAddons = () =>
  process.report.getReport().sharedObjects.filter((file) => file.includes('lightningcss')).length
const before = nativeAddons()
const module = await import(${JSON.stringify(entry)})
const afterImport = nativeAddons()
module.transformSkinCss('.probe { color: red; }', { skinId: 'probe' })
const afterTransform = nativeAddons()
console.log(JSON.stringify({ before, afterImport, afterTransform }))
`

describe('lightningcss loading', () => {
  it('stays unloaded on import and loads on the first transform', () => {
    const output = execFileSync(process.execPath, ['--input-type=module', '-e', probe], { encoding: 'utf8' })
    expect(JSON.parse(output)).toEqual({ before: 0, afterImport: 0, afterTransform: 1 })
  })
})
