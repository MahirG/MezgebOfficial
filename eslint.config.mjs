import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    files: ['components/mezgeb-application.tsx'],
    rules: {
      // The prototype restores browser-local transactions once after hydration.
      'react-hooks/set-state-in-effect': 'off'
    }
  },
  {
    files: ['components/pricing-plans.tsx'],
    rules: {
      // Pricing loads the authenticated subscription and may apply a plan intentionally chosen before auth.
      'react-hooks/set-state-in-effect': 'off'
    }
  },
  globalIgnores(['.next/**', 'out/**', 'coverage/**', 'playwright-report/**'])
]);
