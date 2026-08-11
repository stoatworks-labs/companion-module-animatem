import { generateEslintConfig } from '@companion-module/tools/eslint/config.mjs'

const config = await generateEslintConfig({
  enableTypescript: true,
  // The About block is vendored from stoatworks-backend/about/companion by
  // sync-about.py and is byte-identical across all twelve companion modules.
  // It is tab-indented; this repo's prettier config is not, so linting it
  // produced 43 findings whose only fix would be to reformat a file we do not
  // own — diverging it from the master, which the next sync would revert.
  // The master is the place to change it, so it is not ours to format.
  ignores: ['src/about-field.js', 'src/about-field.d.ts']
})

export default [
  ...config,
  {
    // vitest is a devDependency and these two files are dev-only, but
    // n/no-unpublished-import cannot tell — it sees an import of something that
    // will not be in the published module package and flags it. It is right
    // about the fact and wrong about it mattering: neither file ships.
    files: ['vitest.config.ts', 'src/**/*.spec.ts'],
    rules: {
      'n/no-unpublished-import': 'off'
    }
  }
]
