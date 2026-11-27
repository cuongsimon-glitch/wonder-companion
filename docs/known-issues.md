# Known issues and gotchas

- The published Artifact adds a reset (including `[hidden]{display:none!important}`) that the
  local file doesn't have. Anything the page relies on from that reset must also be in its own
  CSS, or the local test and the live page behave differently. (Found 2026-11-27: answer buttons
  showed before the clue locally.)
- Agents in `.claude/agents/` only load when a session starts. In the session that creates or
  edits one, use a general-purpose worker with the same model, effort and instructions.
- Creating GitHub repositories is blocked in cloud sessions. The user creates the repository,
  then the session attaches it with push access.
- `sample`, `tts` and `dictation` resolve to null outside Claude, and the page falls back to the
  sample story. This is expected, not a bug.
- To keep the same URL, republish with the Artifact tool using the same file path. Leave out
  `capabilities` on a redeploy to keep the ones the page already has.
- Artifact pages block external images, fetches and most CDNs. Keep everything inside the HTML.
- Lessons can take 30–90 seconds to write. The loading screen must stay friendly for that long.
- Live AI stories are only validated against synthetic input. A real model may return JSON that
  `validStory` has to repair or reject; watch the first real runs.
- Editing `DEMO` means updating `EXPECT` in `tests/smoke.js`.
- On a phone (390 px) the stage is small and clue tags on it are cramped, though nothing
  scrolls sideways.
