# Progress

## Done
- 2026-11-27: Prototype v1 published. It has an ask screen with age bands and example questions,
  AI story writing in a random story form, a teacher check, and four chapters, each with an
  obstacle, a hidden clue and three choices. It also has a villain meter, a finale, a reflection
  step with "Actually, that's not what I was curious about", and a family note to copy. The
  sample fox-camera story works without AI.
- 2026-11-27: Set up the orchestrator and workers (CLAUDE.md, docs, agents and the reflect skill).
- 2026-11-27: Added `tests/smoke.js` (written by a Haiku builder). It found that answer buttons
  showed before the clue in the local file; fixed by adding `[hidden]` to the page's CSS. Also
  fixed the story title running under the mischief meter on phones. Published as version 3.
  The test passes.
- 2026-11-27: Research on story structures, choice patterns and clue design written to
  `docs/storytelling.md` (Sonnet worker, 27 sources).
- 2026-11-27: Engine v2 published as version 4 (engineer, then reviewer, then one round of fixes).
  The animation acts out every choice with 35 action steps; consequences carry forward (villain
  power, hearts, backpack, locked and unlocked choices); six clue kinds plus a clue revealed by
  each consequence; three endings; "Try a different path". Reviewer findings fixed: kinder
  `validStory`, stricter locks, dark-mode button contrast, empty-backpack theft, animations
  leaking into the next scene, pronouns in captions, reduced-motion pacing. Smoke test passes.

- 2026-11-27: Changed direction to an animated storybook (user request). New research in
  `docs/storybook.md`. The engineer built it; the reviewer failed the first version with 12
  findings (saving the place, the Ask screen inside Claude, "Hear it again", full-read counting,
  shared tablets and more), and I found two more (literal "nullnull" on the shelf, and a villain
  who looked like a fox). All 14 fixed with a test for each. Published as version 5.

- 2026-11-28: Child safety released as version 6 (merged from `safety-features`). Personal
  details are scrubbed; questions are screened by a local word check and an AI check into safe,
  sensitive and risk; flagged questions go to a teacher inbox (Editors and the owner); teachers
  approve every AI-written book; questions the AI couldn't check, or whose book failed, arrive as
  questions to read, so every question a signed-in child asks reaches a teacher. Also: Tell a
  grown-up on every screen, a families' notice, Remove my books and questions, DSL setup with a
  test alert, Raise as a safety alert, and a teacher-only Try the safety check panel. Built over
  six engineer rounds and five review rounds; held-out testing showed the word check alone holds
  about 60-80% of unseen risk questions, which is why teacher reading is the main protection.
  Access rules checked on the live page with a probe record (teachers see flags, children don't).
## Repository
- GitHub: https://github.com/cuongsimon-glitch/wonder-companion (public since 2026-11-27), `main` pushed
  2026-11-27. Push new commits with `git push`.

## Next (suggested, not agreed)
- Save questions so a child can come back to one tomorrow.
- A teacher dashboard for reviewing a whole class's stories.
- "Wonder next": suggest follow-up questions from the book and the child's shelf.
- Try a live AI book inside Claude and tune `validBook` and the prompt on real output.
- Decide how children sign in on school tablets.
- DSL to test the AI check with real examples using Try the safety check, inside Claude.
- School to complete a DPIA (privacy-legal plugin can draft one) and confirm retention periods.

## Not yet tested
- Live story writing, read-aloud and dictation inside Claude.
