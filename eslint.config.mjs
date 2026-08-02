import { generateEslintConfig } from '@companion-module/tools/eslint/config.mjs'

const config = await generateEslintConfig({
  enableTypescript: true
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
