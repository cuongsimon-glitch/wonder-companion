# Known issues and gotchas

- There are no tests. Checks are Playwright scripts run against the local file.
- `sample`, `tts` and `dictation` resolve to null outside Claude, and the page falls back to the
  sample story. This is expected, not a bug.
- To keep the same URL, republish with the Artifact tool using the same file path. Leave out
  `capabilities` on a redeploy to keep the ones the page already has.
- Artifact pages block external images, fetches and most CDNs. Keep everything inside the HTML.
- Lessons can take 30–90 seconds to write. The loading screen must stay friendly for that long.
- Not tested: whether a child reaches the end when an AI story has no good choice in a chapter.
  `validStory` drops such chapters, so a story could end up with only 2 chapters.
