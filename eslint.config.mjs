import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    files: ['components/mezgeb-application.tsx'],
    rules: {
      // This client workspace refreshes Supabase data after hydration and evaluates
      // due dates against the current browser clock for operational status labels.
      'react-hooks/set-state-in-effect': 'off',
      'react-hooks/purity': 'off'
    }
  },
  globalIgnores(['.next/**', 'out/**', 'coverage/**', 'playwright-report/**'])
]);
