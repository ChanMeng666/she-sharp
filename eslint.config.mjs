import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "report/**",
      "public/**",
      "tmp/**",
      "lib/db/migrations/**",
      ".vercel/**",
      "next-env.d.ts",
      // A git worktree is a second full checkout of this repo living inside it.
      // `.gitignore` covers `.claude/*`, so git never mentions one — but ESLint
      // walks the filesystem, not the index, and happily lints the copy. With
      // one worktree open `pnpm lint` reported 836 warnings instead of 421, and
      // a genuine error inside the worktree would be reported against a path
      // that does not exist in git, which is a bad afternoon.
      //
      // Same shape as the trap CLAUDE.md records under "Working directories are
      // gitignored, not invisible": Grep, Glob and find read those paths exactly
      // like source. So does this.
      ".claude/worktrees/**",
    ],
  },
  ...compat.extends("next/core-web-vitals", "next/typescript"),

  // ---------------------------------------------------------------------------
  // Phase-4 debt: rules demoted from error to warning.
  //
  // This config is being introduced over a codebase that has never been linted,
  // so every one of these has a large pre-existing violation count. Leaving them
  // at `error` would mean the CI gate could only be landed together with a
  // sweeping refactor, which is exactly the change nobody can review. They stay
  // visible as warnings and are paid down in later PRs of the refactor roadmap.
  //
  // Counts at the time this config landed (`eslint .`, whole repo):
  //
  //   @typescript-eslint/no-explicit-any     202  needs real types, one module
  //                                               at a time — not mechanical.
  //   react/no-unescaped-entities             39  purely presentational; the
  //                                               fix rewrites user-facing copy
  //                                               in 16 files for no behaviour
  //                                               change.
  //   react-hooks/set-state-in-effect         34  React Compiler-era rules that
  //   react-hooks/immutability                14  arrived with
  //   react-hooks/static-components            7  eslint-plugin-react-hooks v6.
  //   react-hooks/purity                       4  Each fix is a behaviour-
  //                                               affecting component refactor.
  //
  // Already `warn` in the Next.js presets and likewise left alone for now:
  //   @typescript-eslint/no-unused-vars      185
  //   @next/next/no-img-element               18  (raw <img> conversion is its
  //                                               own PR later in the roadmap)
  //   react-hooks/exhaustive-deps              8
  // ---------------------------------------------------------------------------
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
      "react/no-unescaped-entities": "warn",
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/immutability": "warn",
      "react-hooks/static-components": "warn",
      "react-hooks/purity": "warn",
    },
  },
];

export default eslintConfig;
