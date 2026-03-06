# Security Policy — lore-keeper

This repository powers a “pond agent” (Cave Scribe) that answers lore questions via GitHub Issues + Actions.

## Core security goals

1) **Protect the canon** (lore sources must not be silently altered)
2) **Prevent distortion** (no unreviewed edits to scrolls / indices)
3) **Limit credentials** (shortest-lived, least-privilege tokens)
4) **Auditability** (changes are reviewable and attributable)

## Secrets

GitHub Actions may use these secrets (as configured by the repo owner):

- `GEMINI_API_KEY`
- `GROQ_API_KEY`
- `MISTRAL_API_KEY`
- `OPENROUTER_API_KEY`

Optional Telegram bridge:
- `TELEGRAM_TOKEN`
- `TELEGRAM_CHAT_ID`

If using a private canon repo (recommended):
- `LORE_REPO_TOKEN` (read-only access to the private `lore-scrolls` repo)

### Rules

- Never commit secrets to git.
- Never paste secrets into Issues.
- Prefer GitHub’s built-in `${{ github.token }}` when writing back to this repo.
- Any cross-repo access must be **read-only** unless explicitly required.

## Data integrity

- The canonical lore source should live in a protected location (e.g., a private `lore-scrolls` repo).
- This repo should consume canon read-only and generate **derived** artifacts:
  - `data/*` indexes
  - `data/stats.json`

## Reporting

If you believe credentials were exposed or canon was modified improperly:

1) Rotate affected keys immediately.
2) Disable the workflow temporarily.
3) Open a private incident note (do not post secrets in public issues).
