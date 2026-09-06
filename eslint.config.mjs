import { generateEslintConfig } from '@companion-module/tools/eslint/config.mjs'

const config = await generateEslintConfig({
  enableTypescript: true
})

export default [
  ...config,
  {
    // In a TypeScript file, eslint-plugin-n resolves a './x.js' specifier by
    // mapping the extension backwards — .js -> .ts — because that is what the
    // specifier usually means: TypeScript makes you spell an import of x.ts as
    // './x.js'. enhanced-resolve's extensionAlias is exclusive, though, and
    // gives up rather than retrying the request it was handed ("Don't allow
    // other aliasing or raw request"), so a './x.js' that really is a .js on
    // disk becomes unresolvable. src/about-field.js is exactly that: a
    // hand-written plain-JS module typed by its sibling about-field.d.ts, both
    // copied into dist/ by `build`. There is no about-field.ts to find, so the
    // import read as missing.
    //
    // Put the literal extension back on the end of each candidate list. The
    // .ts guess is still tried first, so nothing about the normal case changes,
    // and an import of something that exists in neither form still fails —
    // this widens what the resolver may find, it does not silence the rule.
    files: ['**/*.ts'],
    settings: {
      n: {
        resolverConfig: {
          extensionAlias: {
            '.js': ['.ts', '.js'],
            '.cjs': ['.cts', '.cjs'],
            '.mjs': ['.mts', '.mjs'],
            '.jsx': ['.tsx', '.jsx']
          }
        }
      }
    }
  },
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
