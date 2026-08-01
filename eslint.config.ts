import eslint from "@eslint/js";
import { defineConfig } from "eslint/config";
import eslintConfigPrettier from "eslint-config-prettier";
import tseslint from "typescript-eslint";

export default defineConfig(
  {
    ignores: [
      "node_modules/**",
      "**/node_modules/**",
      "**/dist/**",
      "**/.wrangler/**",
      "infra/.terraform/**",
    ],
  },
  eslint.configs.recommended,
  tseslint.configs.strictTypeChecked,
  {
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    files: ["test/**/*.ts"],
    rules: {
      "@typescript-eslint/no-floating-promises": "off",
    },
  },
  eslintConfigPrettier,
);
