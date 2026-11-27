# Storytelling and choice design for Wonder Companion

Design basis for the next engine: the animation acts out each choice, consequences carry forward, and there are several kinds of clue. Numbers in square brackets point to the sources in section 7. Where I could not verify something, the text says so.

## 1. Summary

1. **Use a small-scale "problem, attempts, solution" shape, not a big epic.** Picture books, the Story Spine and Harmon's Story Circle all boil down to: someone wants something, tries, meets trouble, changes. Four chapters fit this neatly [8][10][17].
2. **Escalate in threes, then land on the fourth.** The rule of three and the picture-book "three tries, success on the fourth" pattern are craft convention, not tested science, but they are everywhere in stories children already know [16][17].
3. **Branch and bottleneck, with tracked state.** Branches rejoin at fixed story beats, and a few stored variables (not a huge tree) make choices matter [1][3][27].
4. **A choice is real only if the child can see it play out and later feel it.** The "illusion of choice" criticism of Telltale games is about outcomes that quietly converge. Showing a consequence on screen, and paying it off later, is what we can afford [19][20][21].
5. **Every conclusion needs three different clues.** Use the Three Clue Rule, and make the three clues different in kind so they are not just one clue three times [4][5].
6. **Curiosity needs a gap the child can see.** Each chapter should open a specific, small question the child wants closed [22].
7. **Failure must be funny, small and instructive.** Evidence for "productive failure" is mixed for young children, so we should not rely on it; we use kind, recoverable setbacks that give the child new information [23][24][26].

## 2. Story structures

| Structure | Core idea | Why it works / evidence | Fit for us |
|---|---|---|---|
| Three-act | Setup, confrontation, resolution | Very widely taught. I did not open a source for it, so no claim about evidence is made here. | Good as a rough frame: chapter 1 setup, chapters 2-3 confrontation, chapter 4 resolution. |
| Freytag's pyramid | Five parts: introduction, rising movement, climax, falling action, catastrophe/resolution | Derived by Freytag in 1863 from Greek and Shakespearean drama; critics say it fits stage tragedy better than fiction in general [13] | Useful only as a reminder to put the climax late and keep the ending short. |
| Hero's Journey (Campbell, Vogler) | Hero leaves the ordinary world, is tested, returns changed; Vogler cut Campbell's 17 stages to 12 [15] | Popular in film. It tracks the hero's inner change rather than pacing [15]. No evidence found that it improves learning. | Too long for 5 minutes. Borrow the shape (leave, test, return with something). |
| Dan Harmon's Story Circle | Eight steps: You, Need, Go, Search, Find, Take, Return, Change [10] | Built to fit a short TV episode [10]. Practitioner tool, no formal evidence found. | Best fit of the big structures: Pip's need becomes the question; "return" is the reflection. |
| Story Spine (Kenn Adams) | "Once upon a time... Every day... Until one day... Because of that... Because of that... Until finally... Ever since then" [9] | Created for improvisers; Pixar writers were taught it and Emma Coats's 2011 "22 rules" tweet spread it [8][9]. Sources differ on dates and on the number of lines (seven or eight). | Excellent for the story prompt: it forces cause and effect ("because of that") between chapters. |
| Save the Cat (Snyder) | 15 beats tied to page counts in a screenplay [15] | Focus is pacing and timing [15]. I did not retrieve the list of beats. | Borrow one idea only: a "low point" before the win. |
| Kishotenketsu | Four acts: introduction, development, twist, conclusion; tension from a new perspective, not opposition [11] | Classical East Asian form from four-line poems [11]. It does not forbid conflict [11]. | Very good fit: four chapters, the third is the "twist" that reframes the clue. Useful for a gentle story where the villain is cheeky, not scary. |
| Propp's folktale morphology | 31 functions in a fixed order and seven roles (villain, donor, helper, sought-for person, dispatcher, hero, false hero), from 100 Russian tales [12] | Shows that folktales share a small set of moves. I could not verify the full list of 31 functions from what I saw. | Use the roles: Pip (hero), villain, helper who gives a gift (donor), a false lead. |
| Fichtean curve | Open in crisis; a run of escalating crises; short ending [14] | Described by John Gardner (1983) [14]; secondary sources only. | Good for pace: start with something already going wrong. |
| Rule of three | Three siblings, three tries, three tasks; the third succeeds [16] | Plausible memory aid and builds suspense [16]. I found no controlled study showing it helps children's memory or enjoyment. | Use for clues and obstacle escalation. |
| Picture-book structure | Problem, several attempts, solution; each page turn raises tension; three failures and a fourth success is the common model [17][18] | Craft guidance from authors and editors, treated as a guideline that can be broken [17][18] | Direct model for our chapters: one scene, one turn. |

**What we should use.** The backbone is the Story Spine, because it gives cause and effect in a form an AI can follow. Overlay Kishotenketsu on the four chapters so that chapter 3 is a twist that makes the child see the clue differently. Use Propp's roles for characters, the rule of three for escalation, and the picture-book habit of one small problem per page. Skip Freytag, the full Hero's Journey and Save the Cat; they are built for much longer works.

## 3. Choice patterns

Sam Kabo Ashwell's essay names recurring patterns: time cave (every choice branches, nothing rejoins, cost grows exponentially), gauntlet (one story line with optional extras or early failure), branch and bottleneck (branches rejoin at shared events, almost always with state tracking), quest, open map, and others [2][3]. The essay also lists sorting hat, floating modules and loop and grow; I could not open the original text (the host was blocked), so I do not describe those here. The full essay is at [1] and [3].

**Our choice: branch and bottleneck with tracked state.**

- A time cave is unaffordable. The AI would have to write and animate exponentially many scenes [3].
- A pure gauntlet makes choices cosmetic. This is the exact Telltale complaint: branches that converge to a predetermined outcome, so choices change tone more than events [20][21]. Some defenders say this is a budget necessity and that the feeling of consequence matters [20]. These are opinion pieces, not data.
- Branch and bottleneck gives each chapter a fixed job (the bottleneck) while the middle can differ. A tracked state carries what the child did into later chapters [3][27]. One practitioner source suggests using several patterns at different scales [3].

**What makes a choice meaningful.** Sid Meier's idea is that a game is a series of "interesting decisions" [19]; I only saw press summaries of his GDC 2012 talk, and the wording varies. For us that means: (a) the options must each be plausible, (b) each must teach something different about the problem, and (c) neither should be obviously wrong. The reward for choosing well is a clue; the reward for choosing badly is also a clue, delivered by a funny setback.

**What makes consequences feel real to a child.** They see the choice acted out in the animation, they see something visibly change (a bridge is wet, the villain has Pip's lantern), and a later scene refers back to it. Showing is more convincing than a line of text saying "because you chose X".

## 4. Clue design

**Three Clue Rule.** For each conclusion the player must reach, give at least three clues, so that if they miss the first and misread the second, the third catches them [4]. Alexander warns that near-identical clues give only superficial redundancy and should be counted as one [4][5]. For a fair-play puzzle, Knox and Van Dine both insist the reader gets the same clues as the detective [6][7]; sources disagree on the exact wording of their lists, and one of Knox's rules reflects prejudice of its period [6].

Clue kinds we should support, for the question **"Could a camera tell when a fox visits?"**:

| Kind | What the child does | Example |
|---|---|---|
| Observe | Look closely at a scene | Muddy paw prints beside the bin |
| Listen | Tap to hear a sound | A soft rustle every night near the hedge |
| Compare / measure | Put two things side by side | Fox prints are smaller than the dog's but larger than the cat's |
| Ask a character | Question a helper (or the cheeky villain) | The owl says "foxes come out when it is dark" |
| Test / experiment | Try something and see what happens | Pip leaves a light on; the fox stays away |
| Spot a pattern | Notice a repeat | Prints appear on three nights, always after the moon rises |

The six kinds are my own synthesis from the clue sources above, not a published taxonomy. Alexander's lists give many example clue sources (tracks, recordings, witnesses and so on) [5], but I could not confirm his own six-type scheme.

**Redundancy rule.** Each chapter's key fact is reachable in at least three ways, and at least two should be different kinds. If the child makes a bad choice, a clue still reaches them (for example the setback itself reveals it). No fact should depend on one tap.

**Curiosity.** Loewenstein's theory is that curiosity comes from noticing a gap in what you know, and that you need some prior knowledge to feel it [22]. So each chapter should open with a concrete, answerable question ("Whose paw prints?") rather than a vague mystery.

## 5. Good and bad consequences for children

- **Setbacks look funny and recoverable.** Pip gets splashed, the lantern flickers, the villain gloats and trips. Nobody is hurt, scolded or "dead". There is no "game over".
- **Every setback tells the child something.** The child learns what did not work, which is information toward the answer.
- **Language praises the try, not the child.** Mueller and Dweck found fifth graders praised for ability coped worse with failure than those praised for effort [26]. The study is with older children, from one lab family, and I found none with 4-6 year olds, so treat it as a sensible default only.
- **Do not lean on productive failure.** Kapur's work shows that attempting problems before instruction can help [23]; a 2021 meta-analysis found a moderate overall effect (g = 0.36), but reported that younger learners (grades 2 to 5) did better with instruction first [24]. I did not read the paper's tables. So for us: failure is safe and informative, but the child is never left stuck.
- **Narrative learning needs care.** In Crystal Island studies, engagement and learning were positively related [25], while another study found gains lower than traditional teaching, with motivation benefits [25 search summary]. So the story must not swamp the facts. I did not find one headline effect size.
- **Consequences carry forward.** A bad choice in chapter 1 (the wet lantern) still matters in chapter 3 (it is dim in the cave), and a good choice (a borrowed lens) pays off later.
- **Endings vary** by how much the child discovered and how well Pip fared. All endings are warm; they differ in what Pip has, who helps, and how complete the child's explanation is.

## 6. Recommended structure for Wonder Companion

### Beat template for 4 chapters

| Ch. | Story Spine | Kishotenketsu | Harmon circle | Job in the story |
|---|---|---|---|---|
| 1 | Once upon a time / every day / until one day | Ki (introduce) | You, Need | Meet Pip and the question as a small, visible gap. Villain appears cheeky. First obstacle. Clue kind: observe. |
| 2 | Because of that | Sho (develop) | Go, Search | Pip travels; the first choice has an obvious consequence. Clues of two different kinds. |
| 3 | Because of that | Ten (twist) | Find, Take | Reversal: the villain's trick reframes a clue, or an earlier mistake bites. This is the low point. Test / pattern clue. |
| 4 | Until finally / ever since | Ketsu (conclude) | Return, Change | Pip uses what was found; the child states the answer; the ending depends on state. |

### What happens in one chapter

1. **Scene opens** with one small problem and a visible question.
2. **Find clues**: the child taps to gather clues of at least two kinds (three clues exist, two or three are needed).
3. **Choose**: two or three options for what Pip does, each plausible.
4. **Consequence plays out**: the animation acts out the choice. Good: it works and shows a new clue. Bad: a funny setback that also shows a clue.
5. **State changes**: update a few variables, then a short recap line links to the next chapter ("because of that...").

### State and endings

Track: `clues` (how many distinct facts found, and which kinds), `pipCondition` (lantern, coat, mood), `villainPlan` (how far ahead the villain got), `helpers` (allies earned).

| Ending | Condition | What the child sees |
|---|---|---|
| Triumph | Most clues found and mostly good choices | Pip solves it cleanly; the villain is outsmarted and joins in |
| Muddle-through | Some clues found, some setbacks | Pip wins with a scrape and a laugh; the child's answer is partial and Pip notes what is still unknown |
| Second-try | Few clues, many setbacks | Pip does not solve it yet, but knows the next thing to try; the story ends on "tomorrow we look again" with a clear next question |

None of the endings says "wrong". The reflection and family note follow all three.

### Rules for the AI story prompt

1. Never state the answer. The villain may lie or mislead; the facts in clues are always true (teacher checks first).
2. Each chapter has one small problem and one question the child can see.
3. Give three clues per chapter fact, with at least two different kinds from: observe, listen, compare, ask, test, pattern.
4. Offer two or three choices, each plausible, none labelled right or wrong.
5. For every choice, write the consequence as an animated action in one or two beats, plus the state change it causes.
6. Bad outcomes are funny, nobody is shamed or hurt, and they always reveal something.
7. Refer back to an earlier choice in chapters 3 and 4.
8. Chapter 3 contains a twist or low point; chapter 4 uses the state to pick one of three endings.
9. Praise effort and noticing, not "being clever".
10. Keep language to the child's age band; use repetition and the number three for escalation.

## 7. Sources

1. Standard Patterns in Choice-Based Games (IFWiki entry) - https://www.ifwiki.org/Standard_Patterns_in_Choice-Based_Games
2. Downes.ca summary of Ashwell's essay - https://www.downes.ca/post/69647
3. Ashwell, Standard Patterns in Choice-Based Games (original blog, seen in search results only; host blocked for fetching) - https://heterogenoustasks.wordpress.com/2015/01/26/standard-patterns-in-choice-based-games/
4. The Alexandrian, Three Clue Rule - https://thealexandrian.net/wordpress/1118/roleplaying-games/three-clue-rule
5. The Alexandrian, Random GM Tips: Making Clues - https://thealexandrian.net/wordpress/46338/roleplaying-games/random-gm-tips-making-clues
6. Knox's Detective Story Decalogue - https://www.umsl.edu/~gradyf/film/knoxdecalogue.htm
7. Van Dine, Twenty Rules for Writing Detective Stories - https://www.umsl.edu/~gradyf/film/vandinerules.htm
8. NPR, Meet the creator of the Story Spine - https://www.npr.org/transcripts/nx-s1-5750619
9. Plottr, The Story Spine Template - https://plottr.com/?p=55012
10. StudioBinder, Dan Harmon Story Circle - https://studiobinder.com/blog/dan-harmon-story-circle
11. Wikipedia, Kishotenketsu - https://en.wikipedia.org/wiki/Kish%C5%8Dtenketsu
12. Propp summary (Georgetown course page) - https://faculty.georgetown.edu/lb227/ital489/sem/syllab/propp.htm
13. Wikipedia, Gustav Freytag - https://en.wikipedia.org/wiki/Gustav_Freytag
14. Reedsy, The Fichtean Curve - https://reedsy.com/blog/guide/story-structure/fichtean-curve/
15. Celtx, Save the Cat vs Hero's Journey - https://blog.celtx.com/story-structure-save-the-cat-vs-heros-journey/
16. Wikipedia, Rule of three (writing) - https://www.Wikipedia.org/wiki/Rule_of_three_(writing); SurLaLune thread - https://surlalunefairytales.com/oldsite/boardarchives/2006/mar2006/3ismagicnumber.html
17. Tara Lazar, The Rule of Threes in Picture Books - https://taralazar.com/2014/01/09/the-rule-of-threes-in-picture-books/
18. Kidlit.com, Picture Book Structure - https://kidlit.com/picture-book-structure/
19. Game Developer, GDC 2012 Sid Meier on interesting decisions - https://gamedeveloper.com/design/gdc-2012-sid-meier-on-how-to-see-games-as-sets-of-interesting-decisions
20. PC Gamer, Narrative choice is one of the most misunderstood promises of the decade - https://www.pcgamer.com/narrative-choice-is-one-of-the-most-misunderstood-promises-of-the-decade
21. Game Informer, Why your choices don't matter in Telltale games - https://www.gameinformer.com/b/features/archive/2015/02/03/why-your-choices-dont-matter-in-telltale-games.aspx
22. Golman and Loewenstein, Information Gaps (builds on Loewenstein 1994) - https://www.cmu.edu/dietrich/sds/docs/golman/Information%20Gaps--Golman%20and%20Loewenstein.pdf
23. Kapur, Instructional Science special issue on productive failure - https://link.springer.com/doi/10.1007/s11251-012-9235-4
24. Sinha and Kapur 2021 meta-analysis (listing) - https://ouci.dntb.gov.ua/works/4KnMgZq7
25. Rowe et al. 2011, Crystal Island - https://www.cs.uky.edu/~sgware/reading/papers/rowe2011integrating.pdf (the "gains lower than traditional instruction" finding came from a search summary of McQuiggan et al., not an opened paper)
26. Mueller and Dweck 1998 - https://www.columbia.edu/cu/psychology/courses/3615/Readings/Mueller_Dweck.pdf
27. Branch and Bottleneck scenario structure - https://christytuckerlearning.com/branch-and-bottleneck-scenario-structure/
