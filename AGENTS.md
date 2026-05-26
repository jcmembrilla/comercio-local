# Comercio Local — Dev Guide for AI Assistants

## Commands

- `pnpm dev` — Start dev server
- `pnpm build` — Build for production
- `pnpm preview` — Preview production build
- `pnpm lint` — Run ESLint
- `pnpm format` — Format code with Prettier
- `pnpm format:check` — Check formatting
- `pnpm typecheck` — Run Astro type checking (`astro check`)
- `pnpm test` — Run Vitest tests
- `pnpm test:watch` — Run Vitest in watch mode

## Mandatory checks before completing any task

1. `pnpm typecheck` — Must pass
2. `pnpm lint` — Must pass
3. `pnpm format:check` — Must pass

## Project conventions

- TypeScript strict mode enabled
- No semicolons in JS (Prettier config: semi: false)
- Single quotes for strings
- 2-space indentation
- Never use `any` — prefer `unknown` or proper types
- Components go in `src/components/`, utilities in `src/utils/`
- All JS logic is vanilla (no React/Vue/Svelte)
- dark/light mode supported, Tailwind CSS v4
