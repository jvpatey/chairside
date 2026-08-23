// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*'],
    settings: {
      'import/resolver': {
        node: {
          extensions: ['.js', '.jsx', '.ts', '.tsx', '.native.ts', '.web.ts'],
        },
      },
    },
    rules: {
      'import/no-unresolved': [
        'error',
        {
          ignore: ['^@/lib/cropProfilePhoto$', '^@/lib/applicationPdfPacket$'],
        },
      ],
    },
  },
]);
