# GitHub Copilot Instructions

**Wisk Yu-Gi-Oh!** — Slovenian Yu-Gi-Oh! Goat Format community site. Jekyll + GitHub Pages.

## Docs-First Rule

When making any architecture change, update **both** `.github/copilot-instructions.md` and `DOCUMENTATION.md` in the same task — never after the fact.

- Rule or workflow change → update this file
- Architecture or codebase fact → update `DOCUMENTATION.md`

## Session Start

Read `DOCUMENTATION.md` for the full architecture reference before starting work.

Session planning and todo tracking via the SQL `todos` table.

## Working Conventions

- **Internal links**: relative paths only (`/clanki/2019/...`) — never full `https://wisk-yugioh.github.io/...` URLs
- **External links**: all `target="_blank"` links must include `rel="noopener"`
- **Nav links**: never hardcode in layouts — always add entries to `_data/navigation.yml`
- **`future: true`** in `_config.yml` — some posts carry future dates; do not remove this setting
- **`not_published/`**: excluded from build; source `.docx` files live here — do not move or rename them
