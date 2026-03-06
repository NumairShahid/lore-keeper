# Governance — lore-keeper

This repo is a reference “pond agent” for Toadgang.

## Roles

- **Canon keepers**: maintain the canonical scroll corpus (recommended: separate private repo)
- **Index maintainers**: maintain derived indexes in `data/`
- **Agent maintainers**: maintain automation/scripts/workflows

## Canon rules (anti-distortion)

- Canon scroll content should not be edited directly in this repo once the private canon repo exists.
- Canon changes must be:
  - proposed via PR
  - reviewed by a canon keeper
  - merged with a clear commit message describing what changed and why

## Index rules

- Index files may be regenerated automatically.
- Regeneration should be deterministic and reproducible from canon.

## Workflow rules

- Workflows may post replies to Issues and update `data/stats.json`.
- Workflows should not:
  - delete issues/comments
  - mutate canon
  - write to external systems without explicit approval

## Community contributions

- Toadgang members are encouraged to propose:
  - new scroll interpretations
  - better retrieval heuristics
  - improved templates/docs

…but all merges should maintain:
- auditability
- least privilege
- canon integrity
