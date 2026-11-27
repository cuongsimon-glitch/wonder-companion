const { chromium } = require('playwright');
const path = require('path');
const os = require('os');
const fs = require('fs');
const { pathToFileURL } = require('url');

const TIMEOUT = 5000;
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
const shot = async (page, name) => {
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: path.join(outDir, name) });
};

const ALL_KINDS = ['spot', 'listen', 'compare', 'ask', 'test', 'pattern'];
const seenKinds = new Set();

// What the sample story's choices do to the HUD (mirrors DEMO in the page).
// After each chapter: villain power, Pip's hearts, backpack. Start is power 3, hearts 3, empty.
const EXPECT = {
  wise: { power: [2, 1, 0, 0], hearts: [3, 3, 3, 3], pack: ['photo', 'photo,magnifier', 'photo,magnifier', 'photo,magnifier'] },
  risky: { power: [3, 3, 3, 3], hearts: [3, 2, 1, 1], pack: ['', '', '', ''] },
  silly: { power: [4, 5, 5, 5], hearts: [2, 1, 1, 1], pack: ['', '', '', ''] },
  // wise, silly, risky, risky: the villain steals the photo book in chapter 2
  stolen: { power: [2, 3, 3, 3], hearts: [3, 2, 1, 1], pack: ['photo', '', '', ''] },
};
const PATH_TEXT = {
  wise: ['Take photos of the scarf and of real foxes', 'Give the camera new photos of scarves and pumpkins', 'Use the magnifier to look at the camera', 'Add cushion photos labelled'],
};
const ENDING_TITLE = {
  triumph: 'Captain Copycat is out of tricks!',
  muddle: 'A scrape and a laugh',
  second_try: "Let's look again tomorrow",
};

function watchErrors(page) {
  const errs = [];
  page.on('pageerror', (e) => errs.push(`page error: ${e.message}`));
  page.on('console', (m) => {
    const loc = m.location() ? m.location().url || '' : '';
    if (m.type() === 'warning' && /^step failed/.test(m.text())) errs.push(`animation step failed: ${m.text()}`);
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

const btn = (page, name) => page.getByRole('button', { name, exact: true });
const attr = (page, sel, a) => page.locator(sel).getAttribute(a);

// Use one clue of each kind present. Choices must stay hidden until the first clue is found.
async function useClues(page, label, shotName) {
  const cards = page.locator('.cluecard');
  const n = await cards.count();
  check(n === 2, `${label}: expected 2 clue cards, got ${n}`);
  check(!(await page.locator('.choices-wrap').isVisible()), `${label}: choices visible before any clue`);
  const kinds = [];
  for (let i = 0; i < n; i++) {
    const card = cards.nth(i);
    const kind = await card.getAttribute('data-kind');
    kinds.push(kind);
    seenKinds.add(kind);
    if (kind === 'compare' || kind === 'pattern') await card.locator('button[data-opt]').first().click();
    else if (kind === 'test') {
      const opts = card.locator('button[data-opt]');
      await opts.nth(0).click();
      check((await card.getAttribute('data-state')) === 'open', `${label}: test clue revealed after one setting`);
      await opts.nth(1).click();
    } else await card.locator(`button[data-kind="${kind}"]`).click();
    await page.waitForFunction((k) => document.querySelectorAll('.cluecard')[k].dataset.state === 'found', i);
    if (i === 0) check(await page.locator('.choices-wrap').isVisible(), `${label}: choices not visible after the first clue`);
    check(((await card.locator('.cardfact').textContent()) || '').trim().length > 6, `${label}: ${kind} clue shows no fact`);
  }
  if (shotName) await shot(page, shotName);
  check(new Set(kinds).size === kinds.length, `${label}: clue kinds not different: ${kinds}`);
  return kinds;
}

// Play chapters 1-4, picking qualities[n] each time. Returns the ending key.
async function playChapters(page, qualities, expectKey, tag, opts = {}) {
  const exp = EXPECT[expectKey];
  check((await attr(page, '#meter', 'data-power')) === '3', `${tag}: start power not 3`);
  check((await attr(page, '#hearts', 'data-hearts')) === '3', `${tag}: start hearts not 3`);
  for (let n = 1; n <= 4; n++) {
    const label = `${tag} chapter ${n}`;
    const eyebrow = (await page.locator('.eyebrow').textContent()) || '';
    check(eyebrow.includes(`Chapter ${n} of 4`), `${label}: eyebrow was "${eyebrow}"`);
    await useClues(page, label, tag === 'wise path' && (n === 2 || n === 3) ? `wise-chapter${n}-clues.png` : null);

    const choices = page.locator('button.choice');
    check((await choices.count()) === 3, `${label}: expected 3 choices`);
    const wise = page.locator('button.choice[data-quality="wise"]');
    const wiseText = (await wise.textContent()) || '';
    const lockExpected = (n === 3 || n === 4) && !(exp.pack[n - 2] || '').split(',').includes(n === 3 ? 'magnifier' : 'photo');
    if (n >= 3) {
      check((await wise.isDisabled()) === lockExpected, `${label}: wise choice disabled=${await wise.isDisabled()}, expected ${lockExpected}`);
      check(lockExpected ? /Needs the (magnifier|photo book)/.test(wiseText) : /Uses the (magnifier|photo book)/.test(wiseText), `${label}: wise choice text "${wiseText}"`);
    }

    const q = qualities[n - 1];
    const pick = page.locator(`button.choice[data-quality="${q}"]`);
    check(!(await pick.isDisabled()), `${label}: ${q} choice is disabled`);
    if (opts.onChapter) await opts.onChapter(n);
    await pick.click();
    check((await page.locator('button.choice:not([disabled])').count()) === 0, `${label}: choices still clickable while/after the consequence`);
    await page.locator('.result').waitFor();
    check(((await page.locator('.result .clue.consequence').textContent()) || '').length > 20, `${label}: no consequence clue`);

    check((await attr(page, '#meter', 'data-power')) === String(exp.power[n - 1]), `${label}: power ${await attr(page, '#meter', 'data-power')}, expected ${exp.power[n - 1]}`);
    check((await attr(page, '#hearts', 'data-hearts')) === String(exp.hearts[n - 1]), `${label}: hearts ${await attr(page, '#hearts', 'data-hearts')}, expected ${exp.hearts[n - 1]}`);
    check((await attr(page, '#pack', 'data-items')) === exp.pack[n - 1], `${label}: pack "${await attr(page, '#pack', 'data-items')}", expected "${exp.pack[n - 1]}"`);
    seenKinds.add('consequence');

    if (n < 4) {
      await page.locator('.result .btn.teal').click();
      const bridge = ((await page.locator('.bridge').textContent()) || '').trim();
      check(bridge.startsWith('Because of that'), `${label}: next chapter bridge was "${bridge}"`);
    } else {
      if (opts.beforeEnding) await opts.beforeEnding();
      await page.locator('.result .btn.teal').click();
    }
  }
  await page.locator('#panel[data-ending]').waitFor();
  return attr(page, '#panel', 'data-ending');
}

async function openSample(page) {
  await page.goto(pageUrl + '#fast');
  check((await page.locator('h1').textContent()).trim() === 'What are you wondering about?', 'start: h1 text wrong');
  await btn(page, 'Play the sample fox-camera adventure').click();
  check((await page.locator('h2').first().textContent()).trim() === 'Pip and the Copycat Camera Caper', 'teacher check: h2 wrong');
  await btn(page, 'Approve and start').click();
}

async function newPage(browser, viewport, ctxOpts = {}) {
  const page = await browser.newPage({ viewport, ...ctxOpts });
  page.setDefaultTimeout(TIMEOUT);
  return { page, errs: watchErrors(page) };
}

// a) wise path, then reflect and the family note
async function winPass(browser) {
  const { page, errs } = await newPage(browser, { width: 1000, height: 1100 });
  await page.goto(pageUrl + '#fast');
  await btn(page, 'Play the sample fox-camera adventure').click();

  check((await page.locator('h2').first().textContent()).trim() === 'Pip and the Copycat Camera Caper', 'teacher check: h2 wrong');
  check((await page.locator('#fact0, #fact1, #fact2, #fact3, #fact4').count()) === 5, 'teacher check: expected 5 fact checkboxes');
  const clueList = (await page.locator('#clueList').textContent()) || '';
  for (const kind of ['Look closely', 'Listen', 'Compare', 'Ask a helper', 'Test it', 'Spot the pattern']) check(clueList.includes(kind), `teacher check: clue list missing kind "${kind}"`);
  check(clueList.includes('The screen says: fox, 61% sure'), 'teacher check: clue list missing a clue fact');
  const itemList = (await page.locator('#itemList').textContent()) || '';
  check(itemList.includes('Photo book') && itemList.includes('Magnifier'), 'teacher check: items missing');
  const endList = (await page.locator('#endList').textContent()) || '';
  for (const t of Object.values(ENDING_TITLE)) check(endList.includes(t), `teacher check: ending "${t}" missing`);
  await shot(page, 'teacher-check.png');
  const lightTeal = await contrastOf(page, '.btn.teal');
  check(lightTeal >= 4.5, `light mode: .btn.teal contrast ${lightTeal && lightTeal.toFixed(2)} < 4.5`);
  await btn(page, 'Approve and start').click();

  const ending = await playChapters(page, ['wise', 'wise', 'wise', 'wise'], 'wise', 'wise path');
  check(ending === 'triumph', `wise path: ending was "${ending}", expected triumph`);
  check((await page.locator('h2').textContent()).trim() === ENDING_TITLE.triumph, 'wise path: ending title wrong');
  check(!/wrong/i.test((await page.locator('#panel').textContent()) || ''), 'wise path: ending says "wrong"');
  check(((await page.locator('button', { hasText: 'Try a different path' }).getAttribute('class')) || '').includes('ghost'), 'wise path: try-again should be secondary on triumph');
  await page.waitForTimeout(400);
  await shot(page, 'ending-triumph.png');

  await btn(page, 'Tell Pip what you think').click();
  const chips = (await page.locator('[aria-label="Most interesting part"] button').allTextContents()).join(' | ');
  check(chips.includes('The screen says: fox, 61% sure'), 'reflect: chips missing a found clue');
  check(chips.includes('Labelled'), 'reflect: chips missing a consequence clue');
  check((await btn(page, 'Actually, that’s not what I was curious about').count()) === 1, 'reflect: "not what I was curious about" button missing');
  await page.locator('#think').fill('The camera feels warmth, then checks shape, colour and movement.');
  await page.locator('[aria-label="Most interesting part"] button').first().click();
  await btn(page, 'Make the family note').click();

  check((await page.locator('h2').textContent()).trim() === 'Note for the family', 'note: h2 wrong');
  const noteText = (await page.locator('.note-card').textContent()) || '';
  for (const s of [
    'Could a camera tell when a fox visits?',
    'The camera feels warmth, then checks shape, colour and movement.',
    'Path taken',
    'Chapter 1: ', 'Chapter 4: ',
    ...PATH_TEXT.wise,
    'looked closely', 'listened', 'ran a test',
    ENDING_TITLE.triumph,
  ]) check(noteText.includes(s), `note: .note-card missing "${s}"`);
  check(!/clever/i.test(noteText), 'note: uses "clever"');
  await shot(page, 'note.png');

  failures.push(...errs);
  await page.close();
}

// b) silly path: locked choices, second try, replay from chapter 1
async function sillyPass(browser) {
  const { page, errs } = await newPage(browser, { width: 1000, height: 1100 });
  await openSample(page);
  const ending = await playChapters(page, ['silly', 'silly', 'silly', 'silly'], 'silly', 'silly path');
  check(ending === 'second_try', `silly path: ending was "${ending}", expected second_try`);
  check((await page.locator('h2').textContent()).trim() === ENDING_TITLE.second_try, 'silly path: ending title wrong');
  check(!/wrong/i.test((await page.locator('#panel').textContent()) || ''), 'silly path: ending says "wrong"');
  check(((await page.locator('button', { hasText: 'Try a different path' }).getAttribute('class')) || '').includes('teal'), 'silly path: try-again should be prominent on second_try');
  await page.waitForTimeout(400);
  await shot(page, 'ending-second-try.png');

  await btn(page, 'Try a different path').click();
  check(((await page.locator('.eyebrow').textContent()) || '').includes('Chapter 1 of 4'), 'replay: not back at chapter 1');
  check((await attr(page, '#meter', 'data-power')) === '3', 'replay: power not reset to 3');
  check((await attr(page, '#hearts', 'data-hearts')) === '3', 'replay: hearts not full');
  check((await attr(page, '#pack', 'data-items')) === '', 'replay: backpack not empty');
  check((await page.locator('.cluecard[data-state="found"]').count()) === 0, 'replay: clues still marked found');
  check((await page.locator('.bridge').count()) === 0, 'replay: chapter 1 shows a bridge line');
  await shot(page, 'replay-chapter1.png');

  failures.push(...errs);
  await page.close();
}

// b2) risky path ends in the middle; b3) the villain steals the photo book and locks a later choice
async function riskyPass(browser) {
  const { page, errs } = await newPage(browser, { width: 1000, height: 1100 });
  await openSample(page);
  const ending = await playChapters(page, ['risky', 'risky', 'risky', 'risky'], 'risky', 'risky path');
  check(ending === 'muddle', `risky path: ending was "${ending}", expected muddle`);
  check((await page.locator('h2').textContent()).trim() === ENDING_TITLE.muddle, 'risky path: ending title wrong');
  await page.waitForTimeout(400);
  await shot(page, 'ending-muddle.png');
  failures.push(...errs);
  await page.close();

  const b = await newPage(browser, { width: 1000, height: 1100 });
  await openSample(b.page);
  const e2 = await playChapters(b.page, ['wise', 'silly', 'risky', 'risky'], 'stolen', 'stolen path');
  check(e2 === 'muddle', `stolen path: ending was "${e2}", expected muddle`);
  failures.push(...b.errs);
  await b.page.close();
}

// Dark mode: button and "Needs the" text stay readable; screenshot of the second_try ending
async function darkPass(browser) {
  const { page, errs } = await newPage(browser, { width: 1000, height: 1100 }, { colorScheme: 'dark' });
  await page.goto(pageUrl + '#fast');
  await btn(page, 'Play the sample fox-camera adventure').click();
  const c1 = await contrastOf(page, '.btn.teal');
  check(c1 >= 4.5, `dark mode: teacher-check .btn.teal contrast ${c1 && c1.toFixed(2)} < 4.5`);
  await btn(page, 'Approve and start').click();
  const ending = await playChapters(page, ['silly', 'silly', 'silly', 'silly'], 'silly', 'dark silly path', {
    onChapter: async (n) => {
      if (n !== 3) return;
      const need = await contrastOf(page, 'button.choice[data-locked] .need');
      check(need >= 4.5, `dark mode: locked "Needs the" text contrast ${need && need.toFixed(2)} < 4.5`);
      const k = await contrastOf(page, '.cluecard .kindtag');
      check(k >= 4.5, `dark mode: clue kind tag contrast ${k && k.toFixed(2)} < 4.5`);
    },
  });
  check(ending === 'second_try', `dark: ending was "${ending}"`);
  const c2 = await contrastOf(page, '.btn.teal');
  check(c2 >= 4.5, `dark mode: ending .btn.teal contrast ${c2 && c2.toFixed(2)} < 4.5`);
  await page.waitForTimeout(400);
  await shot(page, 'ending-second-try-dark.png');
  failures.push(...errs);
  await page.close();
}

// Leaving an ending while it is still animating must not leak into the next scene
async function endingExitPass(browser) {
  const { page, errs } = await newPage(browser, { width: 1000, height: 1100 });
  await openSample(page);
  const ending = await playChapters(page, ['silly', 'silly', 'silly', 'silly'], 'silly', 'ending exit', {
    // from here on, real animation (the hash is what turns #fast on)
    beforeEnding: () => page.evaluate(() => history.replaceState(null, '', location.pathname + location.search)),
  });
  check(ending === 'second_try', `ending exit: ending was "${ending}"`);
  await page.waitForTimeout(300);
  check(await page.locator('#caption').isVisible(), 'ending exit: ending animation not running 300 ms in');
  await btn(page, 'Try a different path').click();
  await page.waitForTimeout(2000);
  check(((await page.locator('.eyebrow').textContent()) || '').includes('Chapter 1 of 4'), 'ending exit: not at chapter 1');
  const pipAt = await page.$eval('#pip', (n) => n.style.transform);
  check(pipAt === 'translate(90px, 400px)', `ending exit: Pip at "${pipAt}", expected the chapter 1 start (90px, 400px)`);
  check((await page.$eval('#dark', (n) => n.getAttribute('opacity'))) === '0', 'ending exit: the old ending darkened the new scene');
  check((await page.locator('#fx > *').count()) === 0, 'ending exit: leftover effects from the old ending');
  check((await attr(page, '#meter', 'data-power')) === '3', 'ending exit: power not 3');
  failures.push(...errs);
  await page.close();
}

// Reduced motion (no #fast): no movement, but each step still holds its caption
async function reducedMotionPass(browser) {
  const { page, errs } = await newPage(browser, { width: 1000, height: 1100 }, { reducedMotion: 'reduce' });
  await page.goto(pageUrl);
  await btn(page, 'Play the sample fox-camera adventure').click();
  await btn(page, 'Approve and start').click();
  await page.locator('.cluecard[data-kind="spot"] button[data-kind="spot"]').click();
  await page.locator('button.choice[data-quality="silly"]').click();
  await page.waitForFunction(() => { const c = document.querySelector('#caption'); return c && !c.hidden && c.textContent.trim().length > 3; });
  const first = await page.locator('#caption').textContent();
  await page.waitForTimeout(700);
  check(await page.locator('#caption').isVisible(), 'reduced motion: caption gone within 700 ms');
  check((await page.locator('#caption').textContent()) === first, 'reduced motion: caption changed before 700 ms');
  await page.locator('.result').waitFor({ timeout: 8000 });
  check((await attr(page, '#meter', 'data-power')) === '4', 'reduced motion: power not 4 after the silly choice');
  failures.push(...errs);
  await page.close();
}

// Real animation (no #fast): a consequence acted out, and the Skip button
async function motionPass(browser) {
  const { page, errs } = await newPage(browser, { width: 1000, height: 1100 });
  await page.goto(pageUrl);
  await btn(page, 'Play the sample fox-camera adventure').click();
  await btn(page, 'Approve and start').click();
  await page.waitForTimeout(1100); // Pip walks in
  // the spot clue can be found by tapping its sparkle in the picture, too
  await page.locator('[data-hotspot="spot"]').dispatchEvent('click');
  await page.waitForFunction(() => document.querySelector('.cluecard[data-kind="spot"]').dataset.state === 'found');
  check((await page.locator('[data-hotspot="spot"]').count()) === 0, 'motion: sparkle still in the scene after the clue was found');
  await page.locator('.cluecard[data-kind="compare"] button[data-opt]').first().click();
  check(await page.locator('.choices-wrap').isVisible(), 'motion: choices not visible after clues');
  check(!/\bnull\b/.test((await page.locator('#panel').textContent()) || ''), 'motion: panel shows the text "null"');
  await shot(page, 'chapter1-clues.png');
  await page.locator('button.choice[data-quality="silly"]').click();
  await page.waitForTimeout(600);
  check(await page.locator('#skip').isVisible(), 'motion: Skip button not visible while the steps play');
  check(((await page.locator('#caption').textContent()) || '').trim().length > 3, 'motion: no caption while the steps play');
  check((await page.locator('button.choice:not([disabled])').count()) === 0, 'motion: choices clickable while steps play');
  await shot(page, 'consequence-mid-1.png');
  await page.waitForTimeout(1500);
  await shot(page, 'consequence-mid-2.png');
  const t0 = Date.now();
  await page.locator('#skip').click();
  await page.locator('.result').waitFor({ timeout: 3000 });
  check(Date.now() - t0 < 3000, 'motion: Skip did not finish the sequence quickly');
  check(!(await page.locator('#skip').isVisible()), 'motion: Skip still visible after the sequence');
  check((await attr(page, '#meter', 'data-power')) === '4', 'motion: power not 4 after the silly choice');
  await shot(page, 'consequence-done.png');
  failures.push(...errs);
  await page.close();
}

// d) phone width
async function phonePass(browser) {
  const { page, errs } = await newPage(browser, { width: 390, height: 844 });
  const scrollWidth = () => page.evaluate(() => document.documentElement.scrollWidth);

  await page.goto(pageUrl + '#fast');
  check((await scrollWidth()) <= 390, `phone ask: scrollWidth ${await scrollWidth()} > 390`);
  await shot(page, 'phone-ask.png');

  await btn(page, 'Play the sample fox-camera adventure').click();
  await btn(page, 'Approve and start').click();
  check((await scrollWidth()) <= 390, `phone chapter: scrollWidth ${await scrollWidth()} > 390`);
  await shot(page, 'phone-chapter.png');
  await page.locator('.cluecard[data-kind="spot"] button[data-kind="spot"]').click();
  await page.locator('.cluecard[data-kind="compare"] button[data-opt]').first().click();
  check((await scrollWidth()) <= 390, `phone chapter with clues: scrollWidth ${await scrollWidth()} > 390`);
  await shot(page, 'phone-chapter-clues.png');

  failures.push(...errs);
  await page.close();
}

(async () => {
  let browser;
  try {
    browser = await chromium.launch();
    await winPass(browser);
    await sillyPass(browser);
    await riskyPass(browser);
    await motionPass(browser);
    await darkPass(browser);
    await endingExitPass(browser);
    await reducedMotionPass(browser);
    for (const k of ALL_KINDS) check(seenKinds.has(k), `clue kind "${k}" was never used in the runs`);
    await phonePass(browser);
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
