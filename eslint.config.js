const { defineConfig, globalIgnores } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  globalIgnores(['dist/*']),
  expoConfig,
  {
    rules: {
      // This app has no React Compiler build step. The rule's static analysis
      // doesn't model async/await boundaries, so it flags the standard
      // "load from storage/filesystem on mount" effect pattern used throughout
      // this offline file-viewer app as an error, even though loading from an
      // external system (SAF, AsyncStorage) on mount is exactly the case
      // useEffect is meant for.
      'react-hooks/set-state-in-effect': 'off',
    },
  },
]);
