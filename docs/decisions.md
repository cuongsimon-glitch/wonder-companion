# Decisions

Each entry gives the date, the decision and the reason.

- 2026-11-27: The AI never states the answer. Each chapter hides one true clue, and the child
  explains the answer at the end. Reason: the vision is about curiosity, not answers.
- 2026-11-27: The whole story is written in one AI call, then played in the page. Reason: a call
  takes up to a minute, too long for a young child to wait at every choice.
- 2026-11-27: The teacher check comes before the adventure and lists the facts behind each clue.
  Reason: the vision says the teacher checks facts, materials and the aim first.
- 2026-11-27: "Watermark" was read as watercolour, drawn as SVG with displacement filters and a
  paper texture. Reason: this keeps the page self-contained, with no image files.
- 2026-11-27: A sample story ships inside the page. Reason: the page must work, and be testable,
  where live AI isn't available.
- 2026-11-27: AI text is set only with textContent, and villain colours must match a hex pattern.
  Reason: AI output is untrusted.
- 2026-11-27: Story schema v2 replaces "one clue, retry until right". Each chapter has two clues
  of different kinds to find, plus a third revealed by the consequence of the child's choice
  (the Three Clue Rule). Every choice is acted out and the story always moves on (branch and
  bottleneck). Reason: docs/storytelling.md; choices must visibly matter and setbacks must teach.
- 2026-11-27: Chapters follow Kishotenketsu beats (ki, sho, ten, ketsu) with Story Spine
  "because of that" bridges between them; chapter 3 is the twist or low point. Reason: research.
- 2026-11-27: State: villain power starts at 3 (range 0-5; wise -1, risky 0, silly +1), hearts
  start at 3 and never go below 1. Ending after chapter 4: triumph if power <= 1, second_try if
  >= 4, else muddle. Endings depend on choices only, not on how many clues were found; the
  research suggested clues should count too. Revisit after real use.
- 2026-11-27: Delayed consequences: an item gained by a wise choice can unlock a later choice,
  and the villain can steal it. Every ending offers "Try a different path" on the same story.
- 2026-11-27: **Change of direction: animated storybook, not interactive adventure.** The child
  reads a 12-page picture book; Pip makes the choices inside the story. Reason: user request.
  The earlier research is kept and reused (docs/storybook.md section 6).
- 2026-11-27: **The book now answers the question**, through three lessons and a plain answer
  page. This supersedes "the AI never states the answer". Reason: user request.
- 2026-11-27: **One ending, triumph**, after a try-fail-try-fail-succeed arc (page 7 low, page 9
  triumph). Supersedes the three endings. Reason: user request; docs/storybook.md 7a.
- 2026-11-27: **No hotspots, games or tapping on pictures**; tapping a word in the text to hear it
  is the only tap. Reason: Takacs, Swart & Bus 2015 (docs/storybook.md section 2).
- 2026-11-27: **Real animals and objects are drawn realistically and never talk**; only Pip, the
  villain and the robot helper are fantastical. Page 11 is a realistic diagram with no Pip.
  Reason: Ganea et al. 2014 on anthropomorphism and fact learning (docs/storybook.md section 4).
- 2026-11-27: **Books are saved per child**: to the viewer's private `db` space
  (`data/users/<id>`) when signed in at Contributor level or above, otherwise to the tablet's
  localStorage with a visible note. Reason: "the child is free to revisit the book on their own
  tablet". Open question: how children will sign in on school tablets.
- 2026-11-28: **Sensitive questions are screened in two tiers** (user decision). Risk of harm:
  no book, a kind message to the child, an urgent alert to staff. Sensitive topic: the book is
  held until a teacher has talked with the child and chooses to release a gentle version or not.
  The screening is a local check plus an AI classifier; the AI can raise a tier but never lower
  the local result. It supports, and never replaces, the school's safeguarding procedure and DSL.
- 2026-11-28: **Alerts go to a teacher inbox inside the page** (user decision). Editors and the
  owner are teachers; children are Contributors. Children write only their own flags
  (`flags/<uid>`), teachers read and handle all of them.
- 2026-11-28: **Personal details are scrubbed** from anything a child types or says before it is
  sent to the AI, shown or saved. The child's name is never asked for or stored.
- 2026-11-28: **A signed-in teacher approves every AI-written book from the teacher inbox**
  before a child can read it (user decision). Children's new books wait on their shelf as
  "Waiting for your teacher to check". Reason: on a shared tablet a child could approve their
  own book and skip the fact check. Safety alerts always sort above books to check.
- 2026-11-28: **No book unless both safety checks pass**: the local check says safe and the AI
  classifier returned safe. If the AI check fails, the child is asked to try again (fail
  closed). A locally flagged question sends its alert straight away, without waiting for the AI.
