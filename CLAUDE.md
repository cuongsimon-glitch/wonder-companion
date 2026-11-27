# Wonder Companion

A prototype of the AI learning companion for Wonder School, an early-years and primary school
with a daily Wonder block where children follow their own questions.

A child asks any question. The AI writes an animated picture book that answers it: a cover and
12 pages starring Pip (a leaf-sprout head, a saffron raincoat and a lantern), with three lessons,
a try-fail-try-fail-succeed arc that ends in triumph, a realistic answer page and a recap. Pip
makes the choices inside the story; the child reads. Every page has a pen-and-wash watercolour
illustration built from what its text says, with gentle animation. The child reads alone or with
captions ("I'll read", "Read with me", "Read to me") and can tap a word to hear it. A teacher
checks the facts first. Books go on a bookshelf the child can come back to, and each reading
ends with the child's reflection and a note for the family. The design basis is
`docs/storybook.md`, which builds on `docs/storytelling.md`.

It is one self-contained HTML page published as a claude.ai Artifact
(https://claude.ai/artifact/TkopEveNKNjwu94PrGGsr8). Live story writing uses the `sample`
capability, read-aloud uses `tts`, voice input uses `dictation`, and the bookshelf uses `db` and
`user` (falling back to the tablet's localStorage). These work only when the page is opened in
Claude. The built-in sample book about the fox camera works anywhere.

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
Run `node tests/smoke.js` from the repo root. It must print `PASS` and exit 0 (about 85 s). It
loads the page with `#fast`, opens the sample from the shelf, approves it, and pages through
every page by button, keyboard and swipe, checking page kinds, moods, props and labels. It also
checks read-along captions, resuming a book, counting a full read, the family note, a phone
width, dark-mode contrast, reduced motion, stand-in `db`/`user`/`tts`/`sample` capabilities
(including refusals and a late answer), and that no screen shows "null", "undefined" or "NaN".
Any page error fails it. Screenshots go to `$SMOKE_OUT` or `/tmp/wonder-smoke` (pass a fresh
folder; old files stay); look at them, since PASS doesn't judge whether a picture matches its
text. A "Done when:" check names
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
