// ESLint 9 flat config
// - eslint-config-expo: Expo/React Native 공식 규칙 (react-hooks, import 해석 등 포함)
// - eslint-config-prettier: 서식 관련 규칙을 꺼서 Prettier와 충돌하지 않게 함 (반드시 마지막)
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const prettierConfig = require('eslint-config-prettier');

module.exports = defineConfig([
  expoConfig,
  prettierConfig,
  {
    ignores: ['dist/*', 'node_modules/*', '.expo/*', 'web-build/*', '.claude/*', '.tmp/*'],
  },
  {
    // tools/ 의 스크립트는 앱 번들에 들어가지 않는다. 브라우저나 RN 이 아니라
    // Node 에서 직접 돌리는 CommonJS 라서 __dirname·require 가 정상이다.
    files: ['tools/**/*.js', '*.config.js'],
    languageOptions: {
      sourceType: 'commonjs',
      globals: {
        __dirname: 'readonly',
        __filename: 'readonly',
        require: 'readonly',
        module: 'writable',
        exports: 'writable',
        process: 'readonly',
        console: 'readonly',
      },
    },
  },
]);
