const { chromium } = require('playwright');
const path = require('path');
const os = require('os');
const fs = require('fs');
const { pathToFileURL } = require('url');

// End-to-end check of the animated storybook (sample book: the fox camera). Prints PASS and exits 0, or FAIL and the reasons.
// The page is loaded with #fast (no motion, quick narration) except where a part says otherwise.

const TIMEOUT = 6000;
const failures = [];
function check(cond, msg) {
  if (!cond) failures.push(msg);
}

const pagePath = process.argv[2]
  ? path.resolve(process.argv[2])
  : path.join(__dirname, '..', 'wonder-companion', 'index.html');
const pageUrl = pathToFileURL(pagePath).href;
const outDir = process.env.SMOKE_OUT || path.join(os.tmpdir(), 'wonder-smoke');
fs.mkdirSync(outDir, { recursive: true });
const shot = async (page, name, fullPage = false) => {
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: path.join(outDir, name), fullPage });
};

// What the sample book should look like (mirrors DEMO in the page): a cover, then 12 pages.
const KINDS = ['cover', 'story', 'story', 'lesson', 'story', 'lesson', 'story', 'story', 'lesson', 'story', 'story', 'answer', 'recap'];
const MOODS = { 4: 'down', 6: 'down', 7: 'low', 9: 'triumph', 3: 'up', 5: 'up', 8: 'rising' };
const LESSON_TITLES = ['The camera feels warmth', 'Night photos are grey', 'Computers learn from labelled photos'];
const ANSWER_START = 'Yes! A sensor can notice when a visitor comes';
const LAST = 12;

function watchErrors(page) {
  const errs = [];
  page.on('pageerror', (e) => errs.push(`page error: ${e.message}`));
  page.on('console', (m) => {
    const loc = m.location() ? m.location().url || '' : '';
    if (m.type() === 'warning' && /^(step|mark) failed/.test(m.text())) errs.push(`animation failed: ${m.text()}`);
    if (m.type() !== 'error') return;
    if (/fonts\.(googleapis|gstatic)\.com/.test(`${m.text()} ${loc}`)) return;
    errs.push(`console error: ${m.text()}${loc ? ` (${loc})` : ''}`);
  });
  return errs;
}

// WCAG contrast of an element's text colour against its effective (composited) background
function contrastOf(page, selector) {
  return page.evaluate((sel) => {
    const parse = (c) => { const m = c.match(/rgba?\(([^)]+)\)/); const p = m[1].split(/[ ,\/]+/).filter(Boolean).map(Number); return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 }; };
    const over = (top, bot) => ({ r: top.r * top.a + bot.r * (1 - top.a), g: top.g * top.a + bot.g * (1 - top.a), b: top.b * top.a + bot.b * (1 - top.a), a: 1 });
    const lum = ({ r, g, b }) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
    const el = document.querySelector(sel);
    if (!el) return null;
    const layers = []; for (let n = el; n; n = n.parentElement) { const c = parse(getComputedStyle(n).backgroundColor); if (c.a > 0) layers.push(c); if (c.a >= 1) break; }
    let bg = { r: 255, g: 255, b: 255, a: 1 }; for (const l of layers.reverse()) bg = over(l, bg);
    const fg = over(parse(getComputedStyle(el).color), bg);
    const [a, b] = [lum(fg), lum(bg)].sort((x, y) => y - x);
    return (a + 0.05) / (b + 0.05);
  }, selector);
}

// No screen may show the words "null", "undefined" or "NaN" (a null joined into text shows up as "null")
async function noJunkText(page, label) {
  const t = await page.evaluate(() => document.body.innerText);
  const m = t.match(/(null|undefined|NaN)/);
  check(!m, `${label}: the screen shows the text "${m && m[1]}"`);
}
const btn = (page, name) => page.getByRole('button', { name, exact: true });
async function newPage(browser, viewport, ctxOpts = {}) {
  const page = await browser.newPage({ viewport, ...ctxOpts });
  page.setDefaultTimeout(TIMEOUT);
  return { page, errs: watchErrors(page) };
}
const pageNo = (page) => page.locator('#page').getAttribute('data-page');
const waitPage = (page, n) => page.waitForFunction((k) => document.querySelector('#page')?.dataset.page === String(k) && !document.querySelector('#leafwrap').dataset.turning, n);
const samePageCardOpen = (page) => page.locator('[data-book-id="sample-fox-camera"] [data-act="open"]');

// Open the sample from the shelf. The first time it goes through the teacher check; later it opens at once.
async function openSample(page, { fresh = false } = {}) {
  await samePageCardOpen(page).click();
  if (await page.locator('#approve').count()) await page.locator('#approve').click();
  await page.waitForSelector('#page');
  if (fresh) await btn(page, 'Start again').count();
}

// a) shelf and teacher check
async function shelfAndCheck(browser) {
  const { page, errs } = await newPage(browser, { width: 1100, height: 900 });
  await page.goto(pageUrl + '#fast');
  check((await page.locator('h1').textContent()).trim() === 'What are you wondering about?', 'ask: h1 wrong');
  check((await page.locator('#shelfh').textContent()).trim() === 'My bookshelf', 'ask: bookshelf heading missing');
  const card = page.locator('[data-book-id="sample-fox-camera"]');
  check((await card.count()) === 1, 'shelf: the sample book is not on the shelf');
  check((await card.locator('svg path').count()) > 30, 'shelf: the sample cover has no painting');
  check(/Pip and the Copycat Camera/.test((await card.textContent()) || ''), 'shelf: sample title missing');
  check(/Could a camera tell when a fox visits\?/.test((await card.textContent()) || ''), 'shelf: sample question missing');
  check((await card.locator('[data-act="delete"]').count()) === 0, 'shelf: the sample book can be deleted');
  await noJunkText(page, 'shelf');
  check(!/null/.test((await card.locator('.row').textContent()) || ''), 'shelf: the sample card shows "null" beside its buttons');
  await shot(page, 'shelf.png', true);

  await samePageCardOpen(page).click();
  check((await page.locator('h2').first().textContent()).trim() === 'Pip and the Copycat Camera', 'teacher check: title wrong');
  check((await page.locator('#lessonList li').count()) === 3, 'teacher check: expected 3 lessons');
  const lessons = (await page.locator('#lessonList').textContent()) || '';
  for (const t of LESSON_TITLES) check(lessons.includes(t), `teacher check: lesson "${t}" missing`);
  check(((await page.locator('#answerBox').textContent()) || '').includes(ANSWER_START), 'teacher check: the answer is missing');
  check((await page.locator('#outline li').count()) === 13, 'teacher check: expected 13 outline rows (cover and 12 pages)');
  check((await page.locator('#outline li svg').count()) === 13, 'teacher check: outline thumbnails missing');
  check((await page.locator('#outline .mood[data-tone="down"]').count()) === 3, 'teacher check: expected 3 down/low pages in the outline');
  check((await page.locator('#flagBox ul').count()) === 0, `teacher check: the sample is flagged: ${(await page.locator('#flagBox').textContent()) || ''}`);
  check((await page.locator('input[type="checkbox"]').count()) >= 8, 'teacher check: fact tick boxes missing');
  await noJunkText(page, 'teacher check');
  await shot(page, 'teacher-check.png', true);
  await page.locator('#approve').click();
  await page.waitForSelector('#page');
  check((await pageNo(page)) === '0', 'approve: the book did not open on the cover');
  failures.push(...errs);
  await page.close();
}

// b) and c) every page, three ways of turning; kinds, moods, labels
async function everyPage(browser) {
  const { page, errs } = await newPage(browser, { width: 1100, height: 760 });
  await page.goto(pageUrl + '#fast');
  await openSample(page);
  const seen = [];
  const SHOTS = { 0: 'title-page.png', 3: 'lesson-labels.png', 4: 'down-page.png', 9: 'triumph-page.png', 11: 'answer-page.png', 12: 'recap.png' };
  const record = async (n) => {
    const p = page.locator('#page');
    const o = {
      n, no: await p.getAttribute('data-page'), kind: await p.getAttribute('data-page-kind'), mood: await p.getAttribute('data-mood'),
      props: await p.getAttribute('data-props'), cast: await p.getAttribute('data-cast'),
      text: ((await p.locator('.read').first().textContent()) || '').trim(), paths: await p.locator('svg.scene path').count(),
      ribbon: (await p.locator('.ribbon').count()) ? ((await p.locator('.ribbon').textContent()) || '').trim() : '', labels: await p.locator('svg.scene .lbl').count(),
      recap: await p.locator('#recapList li').count(), words: await p.locator('.w').count()
    };
    seen[n] = o;
    await noJunkText(page, `page ${n}`);
    check(o.no === String(n), `page ${n}: data-page was ${o.no}`);
    check(o.text.length > 5, `page ${n}: text is empty`);
    check(!!(o.props || o.cast), `page ${n}: data-props and data-cast are both empty`);
    check(o.paths > 40, `page ${n}: the picture has only ${o.paths} painted shapes`);
    const idx = await p.locator('.w').evaluateAll((ws) => ws.every((w, i) => w.dataset.word === String(i)));
    check(idx, `page ${n}: word spans are not numbered in order`);
    await page.waitForTimeout(150);
    await shot(page, `page-${String(n).padStart(2, '0')}.png`);
    if (SHOTS[n]) await shot(page, SHOTS[n]);
  };
  await record(0);
  // pages 1-4 with the Next button
  for (let n = 1; n <= 4; n++) { await page.locator('#nextBtn').click(); await waitPage(page, n); await record(n); }
  // pages 5-7 with the keyboard
  for (let n = 5; n <= 7; n++) { await page.keyboard.press('ArrowRight'); await waitPage(page, n); await record(n); }
  // page 8 by a swipe (a pointer drag from right to left)
  const box = await page.locator('#leafwrap').boundingBox();
  await page.mouse.move(box.x + box.width * 0.75, box.y + box.height * 0.5);
  await page.mouse.down(); await page.mouse.move(box.x + box.width * 0.45, box.y + box.height * 0.52, { steps: 6 }); await page.mouse.up();
  await waitPage(page, 8); await record(8);
  // a swipe the other way and back
  await page.mouse.move(box.x + box.width * 0.3, box.y + box.height * 0.5);
  await page.mouse.down(); await page.mouse.move(box.x + box.width * 0.7, box.y + box.height * 0.5, { steps: 6 }); await page.mouse.up();
  await waitPage(page, 7);
  check((await pageNo(page)) === '7', 'swipe right did not go back one page');
  await page.keyboard.press('ArrowLeft'); await waitPage(page, 6);
  check((await pageNo(page)) === '6', 'ArrowLeft did not go back one page');
  // pages 7-12 with the page dots, then the keyboard
  await page.locator('.dot[data-i="8"]').click(); await waitPage(page, 8);
  await page.locator('#nextBtn').click(); await waitPage(page, 9); await record(9);
  for (let n = 10; n <= LAST; n++) { await page.keyboard.press('ArrowRight'); await waitPage(page, n); await record(n); }
  check(await page.locator('#nextBtn').isDisabled(), 'the Next button is not disabled on the last page');
  await page.keyboard.press('ArrowRight');
  check((await pageNo(page)) === String(LAST), 'ArrowRight went past the last page');

  // c) kinds, moods, lessons, answer, recap
  for (let n = 0; n <= LAST; n++) {
    if (!seen[n]) continue;
    check(seen[n].kind === KINDS[n], `page ${n}: kind ${seen[n].kind}, expected ${KINDS[n]}`);
    if (MOODS[n]) check(seen[n].mood === MOODS[n], `page ${n}: mood ${seen[n].mood}, expected ${MOODS[n]}`);
  }
  for (const [k, n] of [[1, 3], [2, 5], [3, 8]]) {
    check(seen[n]?.ribbon === `Lesson ${k}: ${LESSON_TITLES[k - 1]}`, `page ${n}: lesson ribbon was "${seen[n]?.ribbon}"`);
    check(seen[n]?.labels >= 2, `page ${n}: expected diagram labels, got ${seen[n]?.labels}`);
  }
  check(!(seen[11].cast || '').split(',').includes('pip') && !(seen[11].cast || '').split(',').includes('villain'), `page 11 (answer): cast has fantasy characters: ${seen[11].cast}`);
  check(seen[11].labels >= 3, 'page 11: the diagram labels are missing');
  check(seen[12].recap === 3, `page 12: recap shows ${seen[12].recap} lessons`);
  check(await page.locator('#page #recapList li svg').count() === 3, 'page 12: lesson thumbnails missing');
  check(((await page.locator('#page').textContent()) || '').includes('Walk around the school garden'), 'page 12: the at-home activity is missing');
  await page.locator('.dot[data-i="11"]').click(); await waitPage(page, 11);
  check(((await page.locator('#answerLine').textContent()) || '').includes(ANSWER_START), 'page 11: the plain answer is not shown');
  check(((await page.locator('#page').textContent()) || '').includes('Pip is pretend. Foxes are real.'), 'page 11: the "Pip is pretend. Foxes are real." line is missing');
  for (const n of [3, 5, 8]) { await page.locator(`.dot[data-i="${n}"]`).click(); await waitPage(page, n); check((await page.locator('#page .fact').count()) === 1, `page ${n}: the fact line is missing`); }
  // the dots show the mood of each page
  const tones = await page.locator('.dot').evaluateAll((ds) => ds.map((d) => d.dataset.tone));
  check(tones[4] === 'down' && tones[6] === 'down' && tones[7] === 'down' && tones[3] === 'up' && tones[9] === 'up', `page dots do not show ups and downs: ${tones}`);
  failures.push(...errs);
  await page.close();
}

// d0) defaults, modes and the "Talk about it" prompts on a first read
async function defaultsAndModes(browser) {
  const { page, errs } = await newPage(browser, { width: 1100, height: 760 });
  await page.goto(pageUrl + '#fast');
  await openSample(page);
  check((await page.locator('#modeSeg').getAttribute('data-mode')) === 'self', 'the sample (ages 7-9) did not open in "I’ll read"');
  check((await page.locator('#modeSeg button[aria-pressed="true"]').textContent()) === 'I’ll read', 'the pressed mode button is not "I’ll read"');
  await page.locator('#nextBtn').click(); await waitPage(page, 1);
  check(((await page.locator('#page .w.reading').count()) === 0), 'words are highlighted in "I’ll read" mode');
  check(await page.locator('#page .talk').isVisible(), 'first read: the "Talk about it" line is hidden');
  check(((await page.locator('#page .talk').textContent()) || '').startsWith('Talk about it'), 'prompt line does not start with "Talk about it"');
  await page.locator('#talkBtn').click();
  check(!(await page.locator('#page .talk').isVisible()), 'the Talk about it toggle did not hide the prompts');
  await page.locator('#nextBtn').click(); await waitPage(page, 2);
  check(!(await page.locator('#page .talk').isVisible()), 'prompts came back on the next page');
  await page.locator('#talkBtn').click();
  check(await page.locator('#page .talk').isVisible(), 'the toggle did not show the prompts again');
  for (const [name, m] of [['Read with me', 'with'], ['Read to me', 'to'], ['I’ll read', 'self']]) {
    await btn(page, name).click();
    check((await page.locator('#modeSeg').getAttribute('data-mode')) === m, `switching to "${name}": data-mode is not ${m}`);
  }
  // "Read to me" turns the page by itself after the narration
  await btn(page, 'Read to me').click();
  await page.waitForFunction(() => Number(document.querySelector('#page').dataset.page) >= 3, null, { timeout: 12000 });
  check(true, '');
  await btn(page, 'I’ll read').click();
  const n0 = await pageNo(page); await page.waitForTimeout(500);
  check((await pageNo(page)) === n0, 'the page kept turning by itself in "I’ll read" mode');
  failures.push(...errs);
  await page.close();
}

// d) "Read with me" without tts and without #fast: highlight moves at a steady pace; tapping a word; a real page turn and action
async function readWithMe(browser) {
  const { page, errs } = await newPage(browser, { width: 1100, height: 760 });
  await page.goto(pageUrl);
  await openSample(page);
  await page.locator('#nextBtn').click();
  await waitPage(page, 1);
  await btn(page, 'Read with me').click();
  await page.waitForSelector('#page .w.reading');
  const idxNow = () => page.locator('#page .w.reading').first().getAttribute('data-word').then(Number);
  const a = await idxNow();
  await page.waitForTimeout(700);
  await shot(page, 'read-with-me.png');
  await page.waitForTimeout(1300);
  const b = await idxNow();
  check(b > a + 2, `"Read with me": the highlighted word went from ${a} to ${b} in 2 seconds`);
  check((await page.locator('#page .w.reading').count()) === 1, '"Read with me": more than one word highlighted');
  check((await page.locator('#page .w.reading').evaluate((w) => w.closest('.read') !== null)), 'highlight is not on a text word');
  // tapping a word
  await page.locator('#page .w[data-word="3"]').click();
  check((await page.locator('#page .w[data-word="3"].reading').count()) === 1, 'tapping a word did not highlight it');
  check((await page.locator('#page .w.bounce').count()) === 1, 'tapping a word did not bounce it');
  await page.waitForTimeout(500);
  check((await page.locator('#page .w[data-word="3"].reading').count()) === 1, 'the tapped word stopped being highlighted too soon');
  // the real page turn (a slide) and the action
  const t0 = Date.now();
  await page.locator('#nextBtn').click();
  await page.waitForFunction(() => document.querySelector('#leafwrap').dataset.turning === '1', null, { timeout: 1500 }).catch(() => failures.push('page turn: no animated turn was seen'));
  await page.waitForFunction(() => !document.querySelector('#leafwrap').dataset.turning, null, { timeout: 2000 });
  check(Date.now() - t0 < 1800, 'the animated page turn took too long');
  check((await page.locator('.leaf').count()) === 1, 'the old page was left behind after the turn');
  // run each page's action for real (they play without errors) through to the lesson page and a down page
  for (const n of [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]) {
    await page.locator(`.dot[data-i="${n}"]`).click(); await waitPage(page, n);
    await page.waitForTimeout(n === 9 ? 1500 : 650);
    if (n === 4) await shot(page, 'down-page-action.png');
  }
  await page.locator('.dot[data-i="4"]').click(); await waitPage(page, 4); await page.waitForTimeout(2200);
  check(await page.locator('#page .replay').isVisible(), 'the Play again button is hidden on a page with an action');
  await page.locator('#page .replay').click(); await page.waitForTimeout(400);
  check((await page.locator('.leaf').count()) === 1, 'Play again changed the pages');
  failures.push(...errs);
  await page.close();
}

// e) resuming where the child stopped
async function resuming(browser) {
  const { page, errs } = await newPage(browser, { width: 1100, height: 760 });
  await page.goto(pageUrl + '#fast');
  await openSample(page);
  for (let n = 1; n <= 4; n++) { await page.locator('#nextBtn').click(); await waitPage(page, n); }
  await page.waitForTimeout(2500); // on this tablet the place is written within 2 seconds, with no reload and no pagehide
  const ls = await page.evaluate(() => JSON.parse(localStorage.getItem('wonder-books') || '{}')['sample-fox-camera']);
  check(ls && ls.lastPage === 4, `tablet mode: after 2.5 s localStorage holds lastPage ${ls && ls.lastPage}, expected 4`);
  await page.locator('#nextBtn').click(); await waitPage(page, 5);
  await page.waitForTimeout(2300);
  await page.reload();
  check((await page.locator('[data-book-id="sample-fox-camera"]').textContent()).includes('Page 5 of 12'), 'shelf: the saved place is not shown after a reload');
  await openSample(page);
  check((await pageNo(page)) === '5', `after a reload the sample opened on page ${await pageNo(page)}, not 5`);
  // leaving at once (inside the 2 second window) still keeps the place
  await page.locator('#nextBtn').click(); await waitPage(page, 6);
  await page.reload();
  await openSample(page);
  check((await pageNo(page)) === '6', `a quick reload lost the place: page ${await pageNo(page)}, not 6`);
  // Start again
  await btn(page, '← My bookshelf').click();
  await page.locator('[data-book-id="sample-fox-camera"] [data-act="restart"]').click();
  await page.waitForSelector('#page');
  check((await pageNo(page)) === '0', `"Start again" went to page ${await pageNo(page)}, not the first page`);
  failures.push(...errs);
  await page.close();
}

// f) reflect and the family note (also: a book read right through is counted, and prompts start off the next time)
async function reflectAndNote(browser) {
  const { page, errs } = await newPage(browser, { width: 1100, height: 900 });
  await page.goto(pageUrl + '#fast');
  await openSample(page);
  // jumping to the last page does not count as a read
  await page.locator('.dot[data-i="12"]').click(); await waitPage(page, 12);
  await btn(page, 'Tell Pip what you found out').click();
  await btn(page, 'Make the family note').click();
  check(((await page.locator('#noteHow').textContent()) || '').includes('Not read all the way through yet'), 'a jump to the last page counted as a full read');
  await btn(page, 'Change my answer').click();
  await btn(page, 'Back to the book').click();
  await page.waitForSelector('#page');
  // paging through every page does
  await page.locator('.dot[data-i="0"]').click(); await waitPage(page, 0);
  for (let n = 1; n <= LAST; n++) { await page.locator('#nextBtn').click(); await waitPage(page, n); }
  await btn(page, 'Tell Pip what you found out').click();
  check((await page.locator('h2').first().textContent()).trim() === 'What did you find out?', 'reflect: heading wrong');
  await noJunkText(page, 'reflect');
  const chips = (await page.locator('#likePick button').allTextContents()).join(' | ');
  for (const t of LESSON_TITLES) check(chips.includes(t), `reflect: lesson chip "${t}" missing`);
  check((await btn(page, 'Actually, that’s not what I was curious about').count()) === 1, 'reflect: "not what I was curious about" button missing');
  await page.locator('#think').fill('The camera feels warmth, then a computer guesses what it saw.');
  await page.locator('#likePick button').nth(1).click();
  await shot(page, 'reflect.png');
  await btn(page, 'Make the family note').click();
  check((await page.locator('h2').first().textContent()).trim() === 'Note for the family', 'note: heading wrong');
  const note = (await page.locator('#noteCard').textContent()) || '';
  for (const s of ['Could a camera tell when a fox visits?', ANSWER_START, ...LESSON_TITLES, 'The camera feels warmth, then a computer guesses what it saw.', 'Night photos are grey', 'I’ll read', 'Read all the way through 1 time', 'Walk around the school garden']) check(note.includes(s), `note: missing "${s}"`);
  check(!/clever/i.test(note), 'note: uses "clever"');
  check((await page.locator('#noteLessons li').count()) === 3, 'note: expected 3 lessons');
  await noJunkText(page, 'family note');
  await shot(page, 'note.png');
  // the book now counts as read: the next time the prompts start off
  await btn(page, 'Ask a new question').click();
  await samePageCardOpen(page).click();
  await page.waitForSelector('#page');
  await page.locator('.dot[data-i="1"]').click(); await waitPage(page, 1);
  check(!(await page.locator('#page .talk').isVisible()), 'after a full read the "Talk about it" prompts did not start off');
  failures.push(...errs);
  await page.close();
}

// g) phone width: nothing scrolls sideways
async function phone(browser) {
  const { page, errs } = await newPage(browser, { width: 390, height: 844 });
  const sw = () => page.evaluate(() => document.documentElement.scrollWidth);
  await page.goto(pageUrl + '#fast');
  check((await sw()) <= 390, `phone shelf: scrollWidth ${await sw()} > 390`);
  await shot(page, 'phone-shelf.png');
  await openSample(page);
  await page.locator('#nextBtn').click(); await waitPage(page, 1);
  check((await sw()) <= 390, `phone reader: scrollWidth ${await sw()} > 390`);
  await shot(page, 'phone-reader.png');
  await page.locator('.dot[data-i="3"]').click(); await waitPage(page, 3);
  check((await sw()) <= 390, `phone lesson page: scrollWidth ${await sw()} > 390`);
  await shot(page, 'phone-lesson.png');
  await page.locator('.dot[data-i="12"]').click(); await waitPage(page, 12);
  check((await sw()) <= 390, `phone recap: scrollWidth ${await sw()} > 390`);
  await shot(page, 'phone-recap.png');
  failures.push(...errs);
  await page.close();
}

// h) dark mode: reading text, buttons and the lesson ribbon keep contrast of at least 4.5
async function darkMode(browser) {
  const { page, errs } = await newPage(browser, { width: 1100, height: 760 }, { colorScheme: 'dark' });
  await page.goto(pageUrl + '#fast');
  await openSample(page);
  await page.locator('.dot[data-i="3"]').click(); await waitPage(page, 3);
  const probes = { 'reading text': '#page .read .w', 'fact line': '#page .fact .w', 'ribbon': '#page .ribbon', 'Next button': '#nextBtn', 'toolbar button': '#talkBtn', 'bookshelf button': '#toShelf', 'prompt': '#page .talk span', 'selected mode': '#modeSeg button[aria-pressed="true"]' };
  for (const [name, sel] of Object.entries(probes)) {
    const c = await contrastOf(page, sel);
    check(c !== null && c >= 4.5, `dark mode: ${name} contrast ${c && c.toFixed(2)} < 4.5`);
  }
  await page.locator('#page .w').nth(2).click();
  const hl = await contrastOf(page, '#page .w.reading');
  check(hl >= 4.5, `dark mode: highlighted word contrast ${hl && hl.toFixed(2)} < 4.5`);
  await shot(page, 'dark-reader.png');
  await page.locator('#toShelf').click();
  const c2 = await contrastOf(page, '.btn.small');
  check(c2 >= 4.5, `dark mode: shelf button contrast ${c2 && c2.toFixed(2)} < 4.5`);
  failures.push(...errs);
  await page.close();
  // and light mode
  const l = await newPage(browser, { width: 1100, height: 760 });
  await l.page.goto(pageUrl + '#fast');
  await openSample(l.page);
  await l.page.locator('.dot[data-i="3"]').click(); await waitPage(l.page, 3);
  for (const [name, sel] of Object.entries(probes)) {
    const c = await contrastOf(l.page, sel);
    check(c !== null && c >= 4.5, `light mode: ${name} contrast ${c && c.toFixed(2)} < 4.5`);
  }
  failures.push(...l.errs);
  await l.page.close();
}

// i) reduced motion: the page turn is instant, nothing moves, every page shows its end state
async function reducedMotion(browser) {
  const { page, errs } = await newPage(browser, { width: 1100, height: 760 }, { reducedMotion: 'reduce' });
  await page.goto(pageUrl); // no #fast
  await openSample(page);
  const r = await page.evaluate(() => {
    const t = performance.now(); document.querySelector('#nextBtn').click();
    return new Promise((res) => requestAnimationFrame(() => res({ dt: performance.now() - t, page: document.querySelector('#page').dataset.page, turning: !!document.querySelector('#leafwrap').dataset.turning, leaves: document.querySelectorAll('.leaf').length })));
  });
  check(r.page === '1' && !r.turning && r.leaves === 1, `reduced motion: the page turn was not instant (${JSON.stringify(r)})`);
  check(r.dt < 100, `reduced motion: the page turn took ${r.dt.toFixed(0)} ms`);
  await page.locator('.dot[data-i="4"]').click(); await waitPage(page, 4);
  await page.waitForTimeout(400);
  const moving = await page.evaluate(() => document.getAnimations().filter((a) => a.playState === 'running').length);
  check(moving === 0, `reduced motion: ${moving} animations are still running`);
  check(!(await page.locator('#page .replay').isVisible()), 'reduced motion: a Play again button is shown');
  check((await page.locator('#page svg.scene .fxl > *').count()) > 0, 'reduced motion: the down page shows no still mark of its setback');
  await shot(page, 'reduced-motion-down.png');
  failures.push(...errs);
  await page.close();
}

// Stand-ins for the capabilities, following the db, user, tts and sample types. Used by (k) and (l).
function installStubs() {
  const opts = window.__opts || {};
  const store = {}, log = { sets: [], gets: [], deletes: [], concurrent: 0, maxConcurrent: 0, spoken: [], rates: [], prompts: [] };
  window.__stub = { store, log };
  const col = (p) => ({ get: async () => { log.gets.push(p); await new Promise((r) => setTimeout(r, opts.getDelay || 30)); return { docs: Object.entries(store).filter(([k]) => k.startsWith(p + '/')).map(([k, v]) => ({ id: k.slice(p.length + 1), exists: true, data: () => v })), size: 0, empty: false }; },
    doc: (id) => ({ id, path: p + '/' + id,
      set: async (d) => { if (typeof d !== 'object' || Array.isArray(d)) throw { code: 'invalid_argument' }; if (opts.failFirstSet && !log.failed) { log.failed = Date.now(); log.sets.push({ path: p + '/' + id, at: Date.now(), failed: true }); throw { code: 'unavailable', message: 'try again' }; } log.concurrent++; log.maxConcurrent = Math.max(log.maxConcurrent, log.concurrent); log.sets.push({ path: p + '/' + id, at: Date.now(), data: JSON.parse(JSON.stringify(d)) }); await new Promise((r) => setTimeout(r, 80)); store[p + '/' + id] = JSON.parse(JSON.stringify(d)); log.concurrent--; },
      delete: async () => { log.deletes.push(p + '/' + id); delete store[p + '/' + id]; } }) });
  const handlers = { line: [], pos: [], state: [] };
  const tts = {
    speak: async (what) => {
      if (opts.ttsDeny) { log.spoken.push(['denied']); throw { code: 'not_granted', message: 'off' }; }
      const lines = typeof what === 'string' ? [{ text: what }] : what; log.spoken.push(lines.map((l) => l.text));
      handlers.state.forEach((h) => h({ state: 'starting' }));
      for (let i = 0; i < lines.length; i++) {
        handlers.line.forEach((h) => h({ line: i, id: lines[i].id }));
        for (let ms = 0; ms <= 600; ms += 100) { handlers.pos.forEach((h) => h({ ms, line: i })); await new Promise((r) => setTimeout(r, 60)); }
      }
      handlers.state.forEach((h) => h({ state: 'idle', reason: 'completed' }));
      return { playedMs: 1 };
    },
    stop: async () => {}, pause: async () => {}, resume: async () => {}, setRate: async (r) => { log.rates.push(r); }, active: () => false,
    onLine: (h) => { handlers.line.push(h); return () => {}; }, onPosition: (h) => { handlers.pos.push(h); return () => {}; }, onState: (h) => { handlers.state.push(h); return () => {}; }
  };
  /* a small book the way a model might write it (with some mistakes the page has to repair) */
  const mk = (age, q) => {
    const kinds = ['cover', 'story', 'story', 'lesson', 'story', 'lesson', 'story', 'story', 'lesson', 'story', 'story', 'answer', 'recap'];
    const moods = ['neutral', 'neutral', 'neutral', 'up', 'down', 'up', 'down', 'low', 'rising', 'triumph', 'warm', 'calm', 'calm'];
    return {
      title: 'Pip and the Blue Sky', age_band: age, learning_aim: 'Why the sky looks blue.', answer: 'Sunlight is all colours, and the air scatters blue light the most, so the sky looks blue.',
      lessons: [{ id: 'l1', title: 'Sunlight has many colours', fact: 'Sunlight looks white but is made of many colours.' }, { id: 'l2', title: 'Air scatters blue light', fact: 'Air scatters blue light more than red light.' }, { id: 'l3', title: 'We see the scattered light', fact: 'The scattered blue light reaches our eyes from all over the sky.' }],
      villain: { name: 'Grumbly Fog', type: 'fog', color: '#8a5cc2' },
      facts_to_check: ['Sunlight is a mix of colours.'], materials: [], needs_teacher: false, teacher_note: '',
      pages: kinds.map((k, i) => ({ kind: k, beat: 'b' + i, mood: moods[i], lesson: k === 'lesson' ? 'l' + (kinds.slice(0, i + 1).filter((x) => x === 'lesson').length) : null,
        text: i === 2 ? 'Pip saw a fox on page 2.' : i === 0 ? 'Why is the sky blue? Pip is about to find out!' : k === 'answer' ? 'Pip is pretend. The sky is real.' : 'Pip looked up at the sky on page ' + i + '.',
        prompt: i === 1 ? 'What colour is the sky?' : '', glow: null,
        scene: { setting: i === 3 ? 'constructor' : k === 'answer' ? 'plain' : ['sky', 'garden', 'riverbank'][i % 3], time: 'day', weather: i === 4 ? 'wind' : 'clear', cast: k === 'answer' ? [{ who: 'bird', at: 'right', pose: 'fly' }] : [{ who: 'pip', at: 'left', pose: ['stand', 'cheer', 'point', 'laugh'][i % 4] }, { who: 'unicorn', at: 'right' }], props: [{ what: ['sun', 'cloud', 'kite', 'rainbow', 'globe', 'umbrella'][i % 6], at: 'centre' }, { what: 'nonsense', at: 'left' }, { what: 'constructor', at: 'right' }], labels: k === 'lesson' ? [{ on: 'sun', text: 'the sun' }] : [], action: i === 4 ? 'slip' : i === 5 ? 'cartwheel' : null } })),
      at_home: 'Look at the sky at noon and at sunset and draw both.', wonder_prompt: 'Why is the sunset red?'
    };
  };
  window.__mk = mk;
  const older = (b) => { b.pages = b.pages.slice(1, 11); b.pages[0].text = 'This is a long page for older readers. '.repeat(18).trim(); return b; }; /* 10 pages, no cover entry, 700 characters */
  window.claude = { use: async (name) => { if (name === 'sample' && opts.sampleDelay) await new Promise((r) => setTimeout(r, opts.sampleDelay)); return ({
    db: { collection: (p) => col(p), doc: (p) => col(p.split('/').slice(0, -1).join('/')).doc(p.split('/').pop()) },
    user: { id: async () => 'u_test', can: async () => true, isOwner: async () => false, canEdit: async () => false, me: async () => ({ id: 'u_test' }) },
    tts,
    sample: { json: async (prompt) => { log.prompts.push(prompt); await new Promise((r) => setTimeout(r, 120)); return /older/.test(prompt) ? older(mk('10–11')) : mk(/aged 4/.test(prompt) ? '4–6' : '7–9'); } }
  }[name] || null); } };
  if (opts.localSeed) localStorage.setItem('wonder-books', JSON.stringify({ 'book-local1': { book: mk('7–9'), question: 'Why is the sky blue?', createdAt: 1, lastPage: 3, reads: 0, mode: 'self', approved: true } }));
}

// k) the account path and the voice
async function accountAndVoice(browser) {
  const { page, errs } = await newPage(browser, { width: 1100, height: 760 });
  await page.addInitScript(installStubs);
  await page.goto(pageUrl + '#fast');
  await page.waitForFunction(() => window.__stub.log.gets.length > 0);
  check(((await page.evaluate(() => window.__stub.log.gets[0])) === 'data/users/u_test'), 'account: books were not loaded from data/users/<id>');
  check(((await page.locator('#shelfNote').textContent()) || '').includes('account'), 'account: the shelf does not say books are saved to the account');
  await openSample(page);
  await page.waitForFunction(() => window.__stub.log.sets.length > 0);
  const first = await page.evaluate(() => window.__stub.log.sets[0]);
  check(first.path === 'data/users/u_test/sample-fox-camera', `account: wrote to ${first.path}`);
  for (const k of ['question', 'createdAt', 'lastPage', 'reads', 'mode']) check(k in first.data, `account: the saved document has no "${k}"`);
  // quick page turns do not flood the store: writes to one document are one at a time and at least 2 s apart
  for (let n = 1; n <= 6; n++) { await page.locator('#nextBtn').click(); await waitPage(page, n); }
  await page.waitForTimeout(2600);
  const info = await page.evaluate(() => ({ n: window.__stub.log.sets.length, max: window.__stub.log.maxConcurrent, ats: window.__stub.log.sets.map((s) => s.at), last: window.__stub.log.sets.at(-1).data.lastPage }));
  check(info.max === 1, `account: ${info.max} writes to one document ran at once`);
  check(info.n <= 4, `account: ${info.n} writes for 6 page turns`);
  for (let i = 2; i < info.ats.length; i++) check(info.ats[i] - info.ats[i - 1] >= 1900, `account: position writes only ${info.ats[i] - info.ats[i - 1]} ms apart`);
  check(info.last === 6, `account: last saved page was ${info.last}, not 6`);
  // "Read with me" speaks one line per sentence and the highlight follows the voice
  await btn(page, 'Read with me').click();
  await page.waitForFunction(() => window.__stub.log.spoken.length > 0);
  const spoken = await page.evaluate(() => window.__stub.log.spoken[0]);
  check(spoken.length >= 3 && spoken.every((t) => t.length > 2), `voice: expected one line per sentence, got ${spoken.length}`);
  await page.waitForSelector('#page .w.reading');
  const seenIdx = new Set();
  for (let i = 0; i < 12; i++) { const w = await page.locator('#page .w.reading').first().getAttribute('data-word').catch(() => null); if (w != null) seenIdx.add(Number(w)); await page.waitForTimeout(70); }
  check(seenIdx.size >= 3, `voice: the highlight only visited ${seenIdx.size} words`);
  check(await page.evaluate(() => window.__stub.log.rates.length > 0), 'voice: the speed was never set');
  await page.locator('#speedBtn').click();
  check(((await page.evaluate(() => window.__stub.log.rates.at(-1))) === 0.8), 'voice: the slow toggle did not slow the voice');
  failures.push(...errs);
  await page.close();
}

// l) writing a book (the model is a stand-in): validation repairs it, the teacher approves it, it joins the shelf, it can be deleted
async function writeABook(browser) {
  const { page, errs } = await newPage(browser, { width: 1100, height: 760 });
  await page.addInitScript(installStubs);
  await page.goto(pageUrl + '#fast');
  await page.waitForFunction(() => window.__stub.log.gets.length > 0);
  await page.locator('#q').fill('Why is the sky blue?');
  await btn(page, '4–6').click();
  await btn(page, 'Write my book').click();
  await page.locator('#approve').waitFor();
  const prompt = await page.evaluate(() => window.__stub.log.prompts[0]);
  check(/EXACTLY 12 pages/.test(prompt) && /Why is the sky blue\?/.test(prompt) && /trail_camera/.test(prompt) && /never more than 30 words/i.test(prompt), 'the book prompt is missing its rules or the question');
  check((await page.locator('#lessonList li').count()) === 3, 'new book: expected 3 lessons in the teacher check');
  check((await page.locator('#outline li').count()) === 13, 'new book: expected 13 outline rows');
  const flags = (await page.locator('#flagBox').textContent()) || '';
  check(/Please look at these/.test(flags), 'new book: the teacher check shows no flags for a book with mistakes');
  check(!(await page.locator('#page').count()), 'new book: the book opened before it was approved');
  await page.locator('#approve').click();
  await page.waitForSelector('#page');
  check((await page.locator('#modeSeg').getAttribute('data-mode')) === 'with', 'a book for ages 4-6 did not open in "Read with me"');
  const fs46 = await page.locator('#page .read').first().evaluate((n) => parseFloat(getComputedStyle(n).fontSize));
  check(fs46 >= 30 && fs46 <= 34, `ages 4-6 text is ${fs46}px at this width; expected 30 to 34`);
  const kinds = await page.evaluate(async () => { const out = []; for (let i = 0; i <= 12; i++) { document.querySelector(`.dot[data-i="${i}"]`).click(); await new Promise((r) => setTimeout(r, 40)); out.push(document.querySelector('#page').dataset.pageKind + ':' + (document.querySelector('#page').dataset.cast || '') + ':' + document.querySelectorAll('#page svg.scene path').length); } return out; });
  check(kinds.every((k) => Number(k.split(':')[2]) > 15), `new book: some pages are not painted: ${kinds}`);
  check(!kinds.some((k) => /unicorn/.test(k)), 'new book: an unknown character was drawn');
  check(kinds[11].startsWith('answer:bird'), `new book: answer page was ${kinds[11]}`);
  await page.waitForTimeout(2200);
  const saved = await page.evaluate(() => Object.keys(window.__stub.store));
  check(saved.length === 1 && /^data\/users\/u_test\/book-/.test(saved[0]), `new book: saved to ${saved}`);
  const doc = await page.evaluate(() => Object.values(window.__stub.store)[0]);
  check(doc.book.pages.length === 13 && doc.question === 'Why is the sky blue?' && typeof doc.createdAt === 'number' && doc.mode === 'with', 'new book: the saved document is incomplete');
  // back to the shelf, then delete with an in-page confirm
  await page.locator('#toShelf').click();
  const card = page.locator('[data-book-id^="book-"]');
  check((await card.count()) === 1 && /Pip and the Blue Sky/.test((await card.textContent()) || ''), 'new book: it is not on the shelf');
  check((await page.locator('.book-card').count()) === 2, 'shelf: expected the sample and the new book');
  await card.locator('[data-act="delete"]').click();
  check(((await card.textContent()) || '').includes('can’t be brought back'), 'delete: no in-page confirmation');
  await btn(page, 'Keep it').click();
  check((await page.locator('.book-card').count()) === 2, 'delete: "Keep it" still deleted the book');
  await card.locator('[data-act="delete"]').click();
  await page.locator('[data-act="confirm-delete"]').click();
  await page.waitForFunction(() => document.querySelectorAll('.book-card').length === 1);
  check((await page.evaluate(() => window.__stub.log.deletes.length)) === 1, 'delete: the document was not deleted from the account');
  check((await page.locator('[data-book-id="sample-fox-camera"]').count()) === 1, 'delete: the sample vanished');
  // a book for ages 10-11 uses smaller type than one for 4-6
  await page.locator('#q').fill('older kids: why is the sky blue?');
  await btn(page, '10–11').click();
  await btn(page, 'Write my book').click();
  await page.locator('#approve').click();
  await page.waitForSelector('#page');
  const fs1011 = await page.locator('#page .read').first().evaluate((n) => parseFloat(getComputedStyle(n).fontSize));
  check((await page.locator('.dot').count()) === 13, 'a book with 10 pages and no cover entry did not get a cover, answer and recap (expected 13 dots)');
  check((await pageNo(page)) === '0' && (await page.locator('#page').getAttribute('data-page-kind')) === 'cover', 'the cover was not made from the title page');
  await page.locator('.dot[data-i="1"]').click(); await waitPage(page, 1);
  check((((await page.locator('#page .read').first().textContent()) || '').length) > 600, 'ages 10-11: a long page was cut short');
  check(fs1011 >= 20 && fs1011 <= 24 && fs1011 < fs46, `ages 10-11 text is ${fs1011}px; expected 20 to 24 and smaller than ages 4-6`);
  check((await page.locator('#modeSeg').getAttribute('data-mode')) === 'self', 'a book for ages 10-11 did not open in "I’ll read"');
  failures.push(...errs);
  await page.close();
}

// m) the Ask screen is drawn again when the capabilities arrive late, keeping what was typed
async function lateCapabilities(browser) {
  const { page, errs } = await newPage(browser, { width: 1100, height: 760 });
  await page.addInitScript(() => { window.__opts = { sampleDelay: 500 }; });
  await page.addInitScript(installStubs);
  await page.goto(pageUrl + '#fast');
  await page.locator('#q').fill('Why do birds sing?');
  await btn(page, '10–11').click();
  check(/needs this page open in Claude/.test((await page.locator('#panel').textContent()) || ''), 'late caps: the "open in Claude" line is not shown before the capabilities arrive');
  await page.waitForFunction(() => !/needs this page open in Claude/.test(document.querySelector('#panel').textContent), null, { timeout: 4000 }).catch(() => failures.push('late caps: the Ask screen still says it needs Claude after the sample capability arrived'));
  check((await page.locator('#q').inputValue()) === 'Why do birds sing?', 'late caps: the typed question was lost');
  check((await page.locator('.seg button[aria-pressed="true"]').first().textContent()) === '10–11', 'late caps: the chosen age was lost');
  await btn(page, 'Write my book').click();
  await page.locator('#approve').waitFor();
  failures.push(...errs);
  await page.close();
}

// n) "Hear it again" after a page turn replays a sentence of the current page
async function hearAgain(browser) {
  const { page, errs } = await newPage(browser, { width: 1100, height: 760 });
  await page.goto(pageUrl + '#fast');
  await openSample(page);
  await page.locator('.dot[data-i="8"]').click(); await waitPage(page, 8);
  await btn(page, 'Read with me').click();
  await page.waitForSelector('#page .w.reading');
  await page.waitForSelector('#page .w.reading', { state: 'detached' }); // narration of the long page is over
  await btn(page, 'I’ll read').click();
  await page.locator('.dot[data-i="0"]').click(); await waitPage(page, 0); // the cover has fewer sentences than page 8
  await page.locator('#againBtn').click();
  await page.waitForSelector('#page .w.reading');
  const inPage = await page.evaluate(() => { const w = document.querySelector('.w.reading'); return !!w && !!w.closest('#page') && document.querySelectorAll('.leaf').length === 1; });
  check(inPage, '"Hear it again": the highlighted word is not on the current page');
  await page.waitForTimeout(600);
  failures.push(...errs);
  await page.close();
}

// o) a shared tablet: books saved on the tablet stay on the tablet; failed writes retry once
async function sharedTablet(browser) {
  const { page, errs } = await newPage(browser, { width: 1100, height: 760 });
  await page.addInitScript(() => { window.__opts = { localSeed: true, failFirstSet: true }; });
  await page.addInitScript(installStubs);
  await page.goto(pageUrl + '#fast');
  await page.waitForFunction(() => window.__stub.log.gets.length > 0);
  const local = page.locator('[data-book-id="book-local1"]');
  await local.waitFor();
  check((await local.locator('[data-where="tablet"]').count()) === 1, 'shared tablet: a tablet book has no "On this tablet" tag');
  check((await page.locator('[data-book-id="sample-fox-camera"] [data-where="tablet"]').count()) === 0, 'shared tablet: the sample is tagged as on the tablet');
  await local.locator('[data-act="open"]').click();
  await page.waitForSelector('#page');
  await page.locator('#nextBtn').click(); await waitPage(page, 4);
  await page.waitForTimeout(2600);
  const where = await page.evaluate(() => ({ account: Object.keys(window.__stub.store), local: JSON.parse(localStorage.getItem('wonder-books') || '{}')['book-local1'] }));
  check(!where.account.some((k) => /book-local1/.test(k)), 'shared tablet: a tablet book was moved into the account');
  check(where.local && where.local.lastPage === 4, `shared tablet: the tablet copy was not updated (lastPage ${where.local && where.local.lastPage})`);
  // a new write fails once, then goes through after a short wait
  await page.locator('#toShelf').click();
  await page.locator('[data-book-id="sample-fox-camera"] [data-act="open"]').click();
  await page.locator('#approve').click();
  await page.waitForSelector('#page');
  await page.waitForFunction(() => window.__stub.store['data/users/u_test/sample-fox-camera'], null, { timeout: 4000 }).catch(() => failures.push('retry: the failed account write was never retried'));
  const tries = await page.evaluate(() => window.__stub.log.sets.filter((x) => x.path.endsWith('sample-fox-camera')).map((x) => [x.at, !!x.failed]));
  check(tries.length >= 2 && tries[0][1] && !tries[1][1] && tries[1][0] - tries[0][0] >= 250, `retry: expected a failed write and one retry after a short wait, got ${JSON.stringify(tries)}`);
  check(!(await page.evaluate(() => JSON.parse(localStorage.getItem('wonder-books') || '{}')['sample-fox-camera'])), 'retry: the sample fell back to the tablet although the retry worked');
  failures.push(...errs);
  await page.close();
}

// p) a late answer from the account still fills the shelf; a refused voice is not asked again
async function lateAndRefused(browser) {
  const { page, errs } = await newPage(browser, { width: 1100, height: 760 });
  await page.addInitScript(() => { window.__opts = { getDelay: 11000, ttsDeny: true }; });
  await page.addInitScript(installStubs);
  await page.addInitScript(() => { window.__lateSeed = true; });
  await page.goto(pageUrl + '#fast');
  await page.waitForFunction(() => window.__stub.log.gets.length > 0);
  await page.evaluate(() => { window.__stub.store['data/users/u_test/book-late'] = { book: window.__mk('7–​9'.replace('​', '')), question: 'Why is the sky blue?', createdAt: 5, lastPage: 0, reads: 0, mode: 'self', approved: true }; });
  // while we wait, the voice: refused once, then captions only
  await openSample(page);
  await btn(page, 'Read with me').click();
  await page.waitForSelector('#page .w.reading');
  await page.waitForTimeout(500);
  await page.locator('#nextBtn').click(); await waitPage(page, 1);
  await page.waitForSelector('#page .w.reading');
  await page.waitForTimeout(500);
  const speaks = await page.evaluate(() => window.__stub.log.spoken.length);
  check(speaks === 1, `a refused voice was asked ${speaks} times; expected once`);
  await page.locator('#toShelf').click();
  await page.waitForFunction(() => /can’t be reached yet/.test(document.querySelector('#shelfNote')?.textContent || ''), null, { timeout: 12000 }).catch(() => failures.push('late account: no "can’t be reached yet" note after the 10 second timeout'));
  await page.waitForSelector('[data-book-id="book-late"]', { timeout: 6000 }).catch(() => failures.push('late account: the late answer did not fill the shelf'));
  check(!/reached yet/.test((await page.locator('#shelfNote').textContent()) || ''), 'late account: the "can’t be reached yet" note stayed after the answer came');
  failures.push(...errs);
  await page.close();
}

(async () => {
  let browser;
  try {
    browser = await chromium.launch();
    await shelfAndCheck(browser);
    await everyPage(browser);
    await defaultsAndModes(browser);
    await readWithMe(browser);
    await resuming(browser);
    await reflectAndNote(browser);
    await phone(browser);
    await darkMode(browser);
    await reducedMotion(browser);
    await accountAndVoice(browser);
    await writeABook(browser);
    await lateCapabilities(browser);
    await hearAgain(browser);
    await sharedTablet(browser);
    await lateAndRefused(browser);
  } catch (e) {
    failures.push(`error: ${e && e.message ? e.message : e}`);
  } finally {
    if (browser) await browser.close();
  }
  console.log(`Screenshots: ${outDir}`);
  if (failures.length === 0) {
    console.log('PASS');
    process.exitCode = 0;
  } else {
    console.log('FAIL');
    for (const f of failures) console.log(f);
    process.exitCode = 1;
  }
})();
