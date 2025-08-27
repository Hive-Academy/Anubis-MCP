# Git Hooks & Local Quality Gates

We use Husky + lint-staged to enforce formatting and linting locally before commits and pushes.

- Install (run once): `npm run prepare` (creates `.husky/`)
- Commitlint validates commit messages to follow Conventional Commits.
- Pre-commit: runs `lint-staged` which fixes/formats staged TypeScript/JS files and runs `npx prisma format` on `.prisma` files.
- Pre-push: runs `npm run typecheck` and `npm test` to prevent pushing breaking changes.

If you need to bypass hooks temporarily, use `git commit -n` or `git push --no-verify`.

Troubleshooting:

- If `npm install` fails due to Prisma binary being in use on Windows, install with `npm install --ignore-scripts` then run `npx prisma generate` when the environment is free.
- If Husky shows deprecation warnings, update to the v10 recommended layout later; current setup targets v9 compatibility.
