# Known issues and gotchas

- The published Artifact adds a reset (including `[hidden]{display:none!important}`) that the
  local file doesn't have. Anything the page relies on from that reset must also be in its own
  CSS, or the local test and the live page behave differently. (Found 2026-11-27: answer buttons
  showed before the clue locally.)
- Agents in `.claude/agents/` only load when a session starts. In the session that creates or
  edits one, use a general-purpose worker with the same model, effort and instructions.
- Creating GitHub repositories is blocked in cloud sessions. The user creates the repository,
  then the session attaches it with push access. The project root is `/home/user`, not the
  `/home/user/wonder-companion` app folder the session suggests as the clone path.
- `sample`, `tts` and `dictation` resolve to null outside Claude, and the page falls back to the
  sample story. This is expected, not a bug.
- To keep the same URL, republish with the Artifact tool using the same file path. Leave out
  `capabilities` on a redeploy to keep the ones the page already has.
- Artifact pages block external images, fetches and most CDNs. Keep everything inside the HTML.
- Lessons can take 30–90 seconds to write. The loading screen must stay friendly for that long.
- Live AI stories are only validated against synthetic input. A real model may return JSON that
  `validStory` has to repair or reject; watch the first real runs.
- Not yet seen: a live AI book, real `tts` word timing (estimated at about 380 ms a word), the
  account bookshelf inside Claude, and whether Andika loads on the published page.
- The bookshelf saves to the child's account only if they are signed in and the book is shared
  with them at Contributor level or above. Viewers save on the tablet only, which is lost if
  browser data is cleared. Books saved on a tablet stay there, tagged "On this tablet".
- Saved books live in each child's private `data/users/<id>` space, which even the owner can't
  read with ArtifactData, so Claude can't inspect saved books.
- Pages that use the database get no automatic gallery thumbnail; set one from the Share menu.
- Animals are simplified rather than realistic in detail; "forty photos" and "again and again"
  are shown as single still moments.
- Type sizes and words per page by age band are the research worker's judgement, not study
  results. Test them on a real tablet with children.
- The local safety check is a word list and cannot be complete. On six fresh sets of unseen
  risk questions it held roughly 60-80% (the final version: 12 of 20 held, 5 of them urgent,
  8 marked safe); no unseen everyday question set off an urgent alert. It only decides urgency:
  the AI check must also pass, and every question still reaches a teacher (alert, book to
  check, or question to read). Retest with new phrasings after any change, and have the DSL
  test real examples with the teacher-only "Try the safety check" panel inside Claude.
- The wide net holds about 8% of everyday and 21% of family questions for a teacher chat.
- A signed-out tablet stores nothing: a question flagged there shows "tell your teacher", and
  a question that passes shows "ask your teacher to sign in". Children should use accounts.
- Storage rules can't stop a child's own session editing its own `flags/<uid>` or
  `reviews/<uid>` items (for example with browser tools). Teacher notes are kept in an
  admin-only path for this reason.
