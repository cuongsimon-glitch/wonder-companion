---
name: reflect
description: End-of-session review. Lists what went wrong or took too long, and proposes the smallest edit to a skill, agent or CLAUDE.md that would have prevented each one. Waits for the user's OK before changing anything.
---

# Reflect

Run this at the end of every session, after updating the three files in `docs/`.

1. **List what went wrong or took too long.** Look back over this session for:
   - checks that failed, and why
   - work sent back to a worker, and any job moved from a Haiku worker to the engineer
   - briefs that were unclear or missing a "Done when:"
   - steps repeated, or time spent finding things that should have been written down
   For each one, give the evidence: the check that failed, the error, or the number of attempts.
2. **Propose the smallest fix for each.** Name one file (CLAUDE.md, an agent in
   `.claude/agents/`, or a skill in `.claude/skills/`) and show the exact lines to add or change.
   Prefer one sentence over a new section. If nothing would have prevented it, say so.
3. **Stop and wait.** Show the list and the proposed edits, then ask the user which to apply.
   Don't edit any file until the user says OK, and apply only the ones they approve.

If nothing went wrong, say that in one line and propose nothing.
