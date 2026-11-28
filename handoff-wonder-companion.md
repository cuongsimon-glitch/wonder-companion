# active-memory handoff: Wonder Companion

**Handoff #1** · 2026-11-28 · Lineage: #1 (2026-11-28): this chat only asked for a handoff; the project state below comes from the repo (CLAUDE.md, docs/, git) and a smoke-test run in this chat

## 0. Instructions for Claude (read first)

You are continuing work from a previous chat. That chat is gone; this file is the complete context and the source of truth.

1. Read this whole file before replying.
2. Follow sections 3 (Style), 4 (Hard rules) and 5 (Corrections) in every reply, for the rest of this chat. They override your defaults.
3. Use the values in section 8 exactly. Never round, re-estimate, or "correct" them.
4. Do not suggest anything listed in section 7 (Changed / rejected) again unless the user brings it up.
5. Code word: None active. If the user types /amcodeword, start every reply with the phrase they choose (default "Yes Boss!").
6. Your first reply: at most 5 lines covering the goal, the current state, and the next step (section 11). Mention any files from section 13 that were not attached. Ask the questions in section 12 if there are any. End with "Ready to continue with <next step>?" Then wait for the user's go.

## 1. Mission
- **Goal:** a prototype AI learning companion for Wonder School (early-years and primary school with a daily Wonder block where children follow their own questions). A child asks any question; the AI writes an animated picture book that answers it (cover + 12 pages starring Pip).
- **Done looks like:** not defined as a finish line. Each piece of work is done when its brief's "Done when:" check passes, `node tests/smoke.js` prints `PASS`, and the page is republished to the same Artifact URL.
- **Why it matters / context:** children follow their own curiosity; safety and teacher oversight are central (every question a child asks is read by a teacher).

## 2. About the user (as relevant to this work)
- Owns the GitHub repo `cuongsimon-glitch/wonder-companion` and the published Artifact.
- Makes the product and safety decisions (direction changes and safety tiers are logged as "user request" / "user decision").
- Works in Claude Code cloud sessions; the app is a claude.ai Artifact used inside Claude.
- Role at the school, technical level and audience beyond Wonder School: not stated.

## 3. Style & communication
- **Language:** English. British spelling in docs and page text (colour, watercolour, judgement).
- **Tone:** plain English, short sentences, no jargon (as in CLAUDE.md and docs/).
- **Reply length:** not stated in the chat.
- **Formatting:** docs use dated bullets (`- 2026-11-28: <decision>. Reason: <reason>.`), bold for big direction changes. Commit subjects are plain-English sentences; partial commits end in "(in progress)" or "(in review)". Emojis: not stated; the project files use none.
- **Working style:** orchestrator model (section 4). Items under "Next (suggested, not agreed)" are not agreed: ask the user before starting one. The reflect skill's proposed edits need the user's OK before applying.
- **Avoid:** claiming live AI, read-aloud or dictation work; passing on a worker's report unchecked; doing bulk work yourself when a worker can.

## 4. Hard rules (word for word)
From `CLAUDE.md`:
1. "You (the main session) are the orchestrator. You plan, write briefs and check results. You don't do bulk work yourself when a worker can do it."
2. "Pick the worker by how hard the job is: **Haiku workers** take quick, clearly defined work. `scout` finds files and answers questions about the code. `builder` does renames, formatting, running tests and small changes to an exact brief. **Sonnet workers** take work that needs judgment. `engineer` builds features across several files and fixes bugs with no obvious cause. `reviewer` reviews diffs."
3. "Every brief states: 1. **Goal**: what should be true afterwards. 2. **Files to read**: exact paths. 3. **Done when:** a check that can be run or seen, such as a command or what a screenshot must show."
4. "Before accepting any worker's output, run its check yourself."
5. "If it fails, send it back with the failure output."
6. "If a Haiku worker fails the same check twice, give the job to `engineer` instead."
7. "Never pass on a worker's report unchecked."
8. "**Start of every session:** read this file and the three files in `docs/`." (CLAUDE.md, docs/progress.md, docs/decisions.md, docs/known-issues.md)
9. "**End of every session:** update `docs/progress.md`, add new decisions to `docs/decisions.md` and new gotchas to `docs/known-issues.md`. Then run the `reflect` skill to propose skill or CLAUDE.md edits, with evidence from this session. The user approves them before you apply them."
10. "Run `node tests/smoke.js` from the repo root. It must print `PASS` and exit 0 (about 85 s)."
11. "Screenshots go to `$SMOKE_OUT` or `/tmp/wonder-smoke` (pass a fresh folder; old files stay); look at them, since PASS doesn't judge whether a picture matches its text."
12. "A "Done when:" check names this command or the exact clicks and what must appear."
13. "Live AI, read-aloud and dictation can't be tested outside Claude. Say so rather than claim they work."

From `.claude/agents/reviewer.md` and `.claude/skills/reflect/SKILL.md`:
14. Reviewer: "Use before accepting any change from the engineer, and from the builder when the change is more than a few lines." The orchestrator gives it the brief and a saved diff path (for example `.review/diff.patch`).
15. Reflect: "Don't edit any file until the user says OK, and apply only the ones they approve." "If nothing went wrong, say that in one line and propose nothing."

From `docs/known-issues.md` and `docs/decisions.md`:
16. "To keep the same URL, republish with the Artifact tool using the same file path. Leave out `capabilities` on a redeploy to keep the ones the page already has."
17. "Anything the page relies on from that reset must also be in its own CSS, or the local test and the live page behave differently." (the published Artifact adds `[hidden]{display:none!important}`; the local file doesn't)
18. "Artifact pages block external images, fetches and most CDNs. Keep everything inside the HTML."
19. "AI text is set only with textContent, and villain colours must match a hex pattern. Reason: AI output is untrusted."
20. "Agents in `.claude/agents/` only load when a session starts. In the session that creates or edits one, use a general-purpose worker with the same model, effort and instructions."

## 5. Corrections log
None. This chat had no corrections (its only request was this handoff). Earlier direction changes are in section 7.

## 6. Decisions
Current decisions from `docs/decisions.md` (superseded ones are in section 7).

| Decision | Why |
|---|---|
| Animated 12-page picture book; Pip makes the choices, the child reads | User request (2026-11-27) |
| The book answers the question through three lessons and a plain answer page | User request |
| One ending, triumph, after try-fail-try-fail-succeed (page 7 low, page 9 triumph) | User request; docs/storybook.md 7a |
| No hotspots, games or tapping on pictures; tapping a word to hear it is the only tap | Takacs, Swart & Bus 2015 (docs/storybook.md section 2) |
| Real animals and objects drawn realistically, never talk; only Pip, the villain and the robot helper are fantastical; page 11 is a realistic diagram with no Pip | Ganea et al. 2014 (docs/storybook.md section 4) |
| Whole book written in one AI call, then played in the page | A call takes up to a minute; too long to wait repeatedly |
| Teacher check (facts) comes before the child reads | The vision says the teacher checks facts first |
| "Watermark" read as watercolour: SVG with displacement filters and a paper texture | Keeps the page self-contained, no image files |
| Sample book ships inside the page (`DEMO`, the fox camera) | Page must work and be testable without live AI |
| AI text only via textContent; villain colours must match a hex pattern | AI output is untrusted |
| Books saved per child to `data/users/<id>` when signed in at Contributor or above, else tablet localStorage with a visible note | "the child is free to revisit the book on their own tablet" |
| Two safety tiers: risk (no book, kind message, urgent staff alert); sensitive (book held until a teacher talks with the child and chooses to release a gentle version or not) | User decision (2026-11-28) |
| Screening = local check + AI classifier; AI can raise a tier, never lower the local result; supports, never replaces, the school's procedure and DSL | User decision |
| Alerts go to a teacher inbox in the page; Editors and owner are teachers, children are Contributors; children write only `flags/<uid>` | User decision |
| Personal details scrubbed before anything is sent to the AI, shown or saved; the child's name is never asked for or stored | Safety design |
| A signed-in teacher approves every AI-written book before a child can read it; shelf shows "Waiting for your teacher to check"; safety alerts sort above books to check | User decision; on a shared tablet a child could approve their own book |
| No book unless local check says safe AND the AI classifier returned safe; if the AI check fails, the child is asked to try again (fail closed); a locally flagged question alerts at once | Safety design |
| Local check is a wide net with simple rules and no exemptions; urgent only from a short list of explicit phrases; person word + worry word (incl. close misspellings) = held for a teacher chat; nothing lowers a tier | User decision; every exemption opened a way to hide a disclosure |
| Every question a child asks is read by a teacher (safety alert, book to check, or "question to read"); local check decides urgency only; urgent kept narrow | Held-out tests: word list misses many disclosures in ordinary words |
| If the book call fails, times out or is cancelled, or can't be sent for review, the question is saved as a question to read; saved questions have their own in-flight marker so a slow book can't be sent twice | Commit 5aa3d7d (2026-11-28) |

## 7. Changed / rejected
- Interactive adventure (four chapters, obstacle, hidden clue, three choices, villain meter, finale) → animated 12-page storybook (user request, 2026-11-27). Earlier research is kept and reused (docs/storybook.md section 6).
- "The AI never states the answer" (child explains it at the end) → the book answers the question (user request).
- Three endings (triumph if villain power <= 1, second_try if >= 4, else muddle) → one triumph ending (user request).
- Engine v2 mechanics (villain power 0-5 starting at 3, hearts, backpack items, Three Clue Rule, Kishotenketsu chapters, "Try a different path") → superseded by the storybook.
- Book approval by whoever holds the tablet → a signed-in teacher approves every AI book (user decision).
- Local check with exemptions to cut false alarms → wide net with no exemptions (user decision).
- Only flagged questions reach a teacher → every question is read by a teacher.
- ❌ Hotspots, games, tapping on pictures (research: distracts from the story).
- ❌ Talking real animals or objects (research: hurts fact learning).
- ❌ Asking for or storing the child's name.

## 8. Data & facts (exact)
| Item | Value |
|---|---|
| Published Artifact | https://claude.ai/artifact/TkopEveNKNjwu94PrGGsr8 |
| Current published version | 6 (child safety, 2026-11-28), per docs/progress.md |
| Version history | v3 smoke test + fixes; v4 engine v2; v5 storybook (14 review fixes); v6 child safety |
| GitHub repo | https://github.com/cuongsimon-glitch/wonder-companion (public since 2026-11-27) |
| Git state at handoff | HEAD `5e0e4b1` "Record the child-safety release in progress" = `origin/main` = `origin/claude/inspiring-goldberg-6h7pm0`; working tree clean except this handoff file |
| Branch used in this chat | `claude/inspiring-goldberg-6h7pm0` (a new session uses whatever branch its system names) |
| Smoke test | `node tests/smoke.js`, prints `PASS`, exit 0, about 85 s; loads the page with `#fast` |
| Smoke run in this chat | `PASS`, exit 0, on HEAD `5e0e4b1` (2026-11-28); screenshots not reviewed |
| File sizes | `wonder-companion/index.html` 335,599 bytes; `tests/smoke.js` 240,466 bytes |
| Node | v22.23.5 (Chromium + Playwright pre-installed in the container) |
| Book shape | cover + 12 pages; page 7 low point; page 9 triumph; page 11 realistic diagram, no Pip; a recap |
| Pip | leaf-sprout head, saffron raincoat, lantern |
| Reading modes | "I'll read", "Read with me", "Read to me" |
| Capabilities | `sample` (story writing), `tts` (read-aloud), `dictation` (voice), `db` + `user` (bookshelf; fallback localStorage) |
| db paths | `data/users/<id>` (books, private, even the owner can't read with ArtifactData), `flags/<uid>`, `reviews/<uid>`; teacher notes in an admin-only path |
| Roles | Editors + owner = teachers; children = Contributors; Viewers save on the tablet only |
| tts word timing | estimated at about 380 ms a word (not yet seen live) |
| Book writing time | 30–90 seconds |
| Local word check (held-out) | holds roughly 60-80% of unseen risk questions over six fresh sets; final version: 12 of 20 held, 5 of them urgent, 8 marked safe; no unseen everyday question set off an urgent alert |
| Wide-net hold rate | about 8% of everyday and 21% of family questions (known-issues.md); decisions.md says "about 1 in 6 family questions" (see section 12) |
| Safety build effort | six engineer rounds and five review rounds |
| Research | docs/storytelling.md: 27 sources; docs/storybook.md; docs/safety.md (marks unverified sources [S]) |
| Font | Andika (whether it loads on the published page: not yet seen) |

## 9. People, terms & names
- **People:** DSL = the school's Designated Safeguarding Lead; DPO = Data Protection Officer; headteacher. No individual names in use.
- **Terms & nicknames:** Wonder block = daily time when children follow their own questions; Pip = the hero; DPIA = data protection impact assessment; "risk" and "sensitive" = the two safety tiers; "wide net" = the local check design.
- **Names in use:** `DEMO` (sample book), `validBook` (book validator; older `validStory`), "Try the safety check" (teacher-only panel), "Tell a grown-up" (button on every screen), "Remove my books and questions", "Raise as a safety alert", "questions to read", "Waiting for your teacher to check", "On this tablet", "Wonder next" (idea), `safety-features` (merged branch for v6).
- **Workers:** `scout` (haiku, effort low, read-only), `builder` (haiku, medium), `engineer` (sonnet, high), `reviewer` (sonnet, high, read-only). Skill: `reflect`.

## 10. Work state
| Item | Status | Version / location | Notes |
|---|---|---|---|
| The app | final for v6 | `wonder-companion/index.html`; Artifact v6 | Not checked this chat that the live page matches HEAD |
| Smoke test | final | `tests/smoke.js` | Covers paging, captions, resume, full read, family note, phone width, dark mode, reduced motion, stand-in capabilities |
| Docs | current | `docs/progress.md`, `decisions.md`, `known-issues.md`, `safety.md`, `storybook.md`, `storytelling.md` | safety.md is a draft for the school to review |
| Live AI book, real tts timing, dictation, account bookshelf inside Claude | not tested | — | Only testable inside Claude |
| Next features | not started | docs/progress.md "Next (suggested, not agreed)" | Not agreed; see section 11 |
| This handoff | new, not committed | `handoff-wonder-companion.md` in the repo root | Commit only if the user asks |

## 11. Next steps
1. **Next action:** ask the user which item from "Next (suggested, not agreed)" in docs/progress.md to start; none is agreed yet.
2. Write a brief for it (Goal, Files to read, Done when:), give it to the right worker, run the check yourself, have `reviewer` check the diff, then run `node tests/smoke.js` and look at the screenshots.
3. Republish with the Artifact tool using the same file path (leave out `capabilities`), commit and push when the user asks.
4. End of session: update the three docs, then run `reflect` and wait for the user's OK.

Suggested items (from docs/progress.md, word for word):
- Save questions so a child can come back to one tomorrow.
- A teacher dashboard for reviewing a whole class's stories.
- "Wonder next": suggest follow-up questions from the book and the child's shelf.
- Try a live AI book inside Claude and tune `validBook` and the prompt on real output.
- Decide how children sign in on school tablets.
- DSL to test the AI check with real examples using Try the safety check, inside Claude.
- School to complete a DPIA (privacy-legal plugin can draft one) and confirm retention periods.

## 12. Open questions ⚠️
- Which suggested item comes next? (list in section 11)
- How will children sign in on school tablets? Open since 2026-11-27; without accounts, a signed-out tablet stores nothing.
- Family-question hold rate: 21% (known-issues.md) or "about 1 in 6" (decisions.md)? Likely the 21% is the later figure; fix the older doc once confirmed.
- known-issues.md says "The project root is `/home/user`, not the `/home/user/wonder-companion` app folder", but in this chat the git repo and CLAUDE.md are at `/home/user/wonder-companion`. Update that gotcha?

## 13. Re-attach checklist
- [ ] `handoff-wonder-companion.md`: this file, for the new chat.
- [ ] If the new chat is not a Claude Code session on the `cuongsimon-glitch/wonder-companion` repo: also attach `CLAUDE.md`, `docs/progress.md`, `docs/decisions.md`, `docs/known-issues.md`, `wonder-companion/index.html` and `tests/smoke.js`. In a session on the repo, nothing else is needed.

---
<sub>Audit: 13/13 sections · 20 rules · 0 corrections · 24 data points · secrets removed: none found · generated by active-memory</sub>
