import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Clones locais antigos do repositorio (tambem ignorados no .gitignore):
    "neblina.records/**",
    "neblina.records-1/**",
  ]),
  {
    rules: {
      // Regras novas do React Compiler (react-hooks v6): mantidas visiveis como
      // aviso enquanto os padroes de animacao (intro/vinil) nao forem migrados —
      // corrigi-las exige reestruturar efeitos sensiveis a timing.
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/purity": "warn",
      "react-hooks/preserve-manual-memoization": "warn",
    },
  },
]);

export default eslintConfig;
