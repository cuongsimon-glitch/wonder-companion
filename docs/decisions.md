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
