# Wonder Companion

A prototype of the AI learning companion for Wonder School, an early-years and primary school
with a daily Wonder block where children follow their own questions.

A child asks any question. The AI does not answer it. It writes a four-chapter adventure starring
Pip (a leaf-sprout head, a saffron raincoat and a lantern), who faces a cheeky villain and
obstacles. Each chapter has clues of different kinds to find (spot, listen, compare, ask, test,
pattern). The child chooses what Pip does, the animation acts the choice out, and the
consequences carry forward: the villain's power, Pip's hearts and the backpack change, earlier
choices unlock or lock later ones, and the state picks one of three endings. The child pieces the
answer together. A teacher checks the facts first, and the session ends with the child's
reflection and a note for the family. Scenes are watercolour-style 2D vector art.

It is one self-contained HTML page published as a claude.ai Artifact
(https://claude.ai/artifact/TkopEveNKNjwu94PrGGsr8). Live story writing uses the `sample`
capability, read-aloud uses `tts` and voice input uses `dictation`. These work only when the page
is opened in Claude. The built-in sample story about the fox camera works anywhere.

## Folder map
- `wonder-companion/index.html`: the whole app. It holds the styles, the painted SVG scenes, the
  story prompt, the flow (Ask → Teacher check → Adventure → Reflect → Family note) and the sample
  story `DEMO`.
- `tests/smoke.js`: the end-to-end check (see below).
- `docs/progress.md`: what's done and what's next.
- `docs/decisions.md`: decisions and the reasons for them.
- `docs/known-issues.md`: gotchas and open problems.
- `.claude/agents/`: the four workers (scout, builder, engineer and reviewer).
- `.claude/skills/reflect/`: the end-of-session review.

## How to check the app
Run `node tests/smoke.js` from the repo root. It must print `PASS` and exit 0. It loads the page
with `#fast` and plays the sample story along a wise, a risky and a silly path to all three
endings, uses all six clue kinds, checks the HUD state after each chapter, then checks a phone
width and one run with real animation. Any page error fails it. The expected state values are in
`EXPECT` in the test, so editing `DEMO` means updating `EXPECT`. Screenshots go to `$SMOKE_OUT`
or `/tmp/wonder-smoke`; look at them, since PASS doesn't catch overlaps. A "Done when:" check names
this command or the exact clicks and what must appear. Live AI, read-aloud and dictation can't be
tested outside Claude. Say so rather than claim they work.

## Rules

### Roles
- You (the main session) are the orchestrator. You plan, write briefs and check results.
  You don't do bulk work yourself when a worker can do it.
- Pick the worker by how hard the job is:
  - **Haiku workers** take quick, clearly defined work. `scout` finds files and answers
    questions about the code. `builder` does renames, formatting, running tests and small
    changes to an exact brief.
  - **Sonnet workers** take work that needs judgment. `engineer` builds features across
    several files and fixes bugs with no obvious cause. `reviewer` reviews diffs.

### Briefs
Every brief states:
1. **Goal**: what should be true afterwards.
2. **Files to read**: exact paths.
3. **Done when:** a check that can be run or seen, such as a command or what a screenshot must show.

### Checking work
- Before accepting any worker's output, run its check yourself.
- If it fails, send it back with the failure output.
- If a Haiku worker fails the same check twice, give the job to `engineer` instead.
- Never pass on a worker's report unchecked.

### Sessions
- **Start of every session:** read this file and the three files in `docs/`.
- **End of every session:** update `docs/progress.md`, add new decisions to `docs/decisions.md`
  and new gotchas to `docs/known-issues.md`. Then run the `reflect` skill to propose skill or
  CLAUDE.md edits, with evidence from this session. The user approves them before you apply them.
