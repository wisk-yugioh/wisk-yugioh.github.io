# GitHub Copilot Instructions

## Overview
This is the **SloGoatsss Yu-Gi-Oh! Goat Format** Slovenian community website, built with **Jekyll** and hosted on **GitHub Pages**.

## Key Files to Read at Session Start
When starting a new work session on this repo, always read these files first:
- **`PLAN.md`** — current stage goals, approach, and open items
- **`CHANGELOG.md`** — full history of completed work, stage by stage
- **`TODOS.md`** — current active todo list (mirrors SQL todos table during a session)

## Project Conventions
- **Jekyll** site: layouts in `_layouts/`, includes in `_includes/`, data in `_data/`
- **SCSS** in `_sass/main.scss`, entry point at `assets/css/main.scss`
- **Assets**: JS in `assets/js/`, images in `assets/images/`, post images in `assets/images/posts/`
- **Navigation** is data-driven via `_data/navigation.yml` — do not hardcode nav links in layouts
- **Google Analytics** ID goes in `_config.yml` as `google_analytics:` — the include is wired conditionally
- **Internal links** must use relative paths (e.g. `/blog/2019/...`), never `https://slogoatsss.github.io/...`
- All `target="_blank"` links must have `rel="noopener"`
- **jQuery 3.3.1** is loaded in `<head>` of `default.html` — required by `lestvica/index.html`
- The `not_published/` directory contains source `.docx` files and is excluded from Jekyll build

## Work Stages
- **Stage 1** ✅ — AS-IS refactor: Jekyll best practices, valid HTML, asset structure, SCSS, config
- **Stage 2** — (planned) Design/UX improvements
- **Stage 3** — (planned) Content and feature improvements

## Workflow
1. Read `PLAN.md` and `TODOS.md` at session start
2. Use the SQL `todos` table for in-session tracking (query ready todos, update status as you go)
3. After completing work, update `CHANGELOG.md` with what was done
4. Update `PLAN.md` with next steps
5. Sync completed items to `TODOS.md`
