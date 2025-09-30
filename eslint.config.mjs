import antfu from '@antfu/eslint-config'

export default antfu({
  ignores: [
    'dist',
    'pylatexenc-main',
    '.idea',
  ],
  rules: {
    'node/file-extension-in-import': ['error', 'never'],
  },
})
