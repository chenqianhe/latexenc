import antfu from '@antfu/eslint-config'

export default antfu(
  {
    rules: {
      'node/file-extension-in-import': ['error', 'never'],
    },
  },
  {
    ignores: [
      'dist/**',
      'pylatexenc/**',
      '.idea/**',
      '*.md',
    ],
  },
)
