import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Custom rules to reduce noise while maintaining code quality
  {
    rules: {
      // Allow 'any' in specific cases - but recommend using proper types
      "@typescript-eslint/no-explicit-any": "warn",
      // Unused vars as warnings instead of errors
      "@typescript-eslint/no-unused-vars": ["warn", {
        argsIgnorePattern: "^_",
        varsIgnorePattern: "^_",
        caughtErrorsIgnorePattern: "^_"
      }],
      // Allow empty functions (useful for stubs/defaults)
      "@typescript-eslint/no-empty-function": "off",
      // Prefer @ts-expect-error over @ts-ignore
      "@typescript-eslint/ban-ts-comment": ["error", {
        "ts-expect-error": "allow-with-description",
        "ts-ignore": true,
        "ts-nocheck": true,
        "ts-check": false,
      }],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Ignore backend folder (has its own config)
    "backend/**",
    // Ignore API License folder (Node.js scripts)
    "API License/**",
    // Ignore node_modules
    "node_modules/**",
    // Ignore generated files
    "*.tsbuildinfo",
  ]),
]);

export default eslintConfig;
