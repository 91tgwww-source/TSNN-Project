# Day 0 — First-Time Setup

5 min to ready-to-code state.

## Prerequisites

- Node 22+ (`node -v`)
- npm 10+ (`npm -v`)
- Git
- Claude Code CLI installed

## Steps

```bash
# 1. Create from template or clone
git clone git@github.com:ajenchen/ds-product-template.git
cd ds-product-template

# 2. Install workspace deps
npm install

# 3. Open in Claude Code
claude
```

Then run these in the Claude Code session:

```text
/plugin marketplace add github:ajenchen/design-system
/plugin install design-system@qijenchen-ds
```

After plugin install, restart the Claude Code session so skills and hooks are loaded.

## Verify

- `npm run create-app test-app` creates `apps/test-app/`.
- `cd apps/test-app && npm run dev` opens a styled Vite app.
- Claude `/` shows DS skills such as `/design-system-audit`, `/component-quality-gate`, `/visual-audit`, and `/prototype`.

## Next

Run `npm run setup:netlify`, then continue with `docs/02-create-new-product.md`.
