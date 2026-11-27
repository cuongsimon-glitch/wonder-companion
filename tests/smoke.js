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
const shot = (page, name) => page.screenshot({ path: path.join(outDir, name) });

// The good choice for each chapter, in order. Matched by text, since choices are shuffled.
const GOOD = [
  'Look at what the scarf and a fox have in common',
  'Give the camera photos of scarves and pumpkins',
  'Check whether the furry hat is warm',
  'Teach the camera to watch how things move',
];

function watchErrors(page) {
  const errs = [];
  page.on('pageerror', (e) => errs.push(`page error: ${e.message}`));
  page.on('console', (m) => {
    if (m.type() !== 'error') return;
    const loc = m.location() ? m.location().url || '' : '';
    if (/fonts\.(googleapis|gstatic)\.com/.test(`${m.text()} ${loc}`)) return;
    errs.push(`console error: ${m.text()}${loc ? ` (${loc})` : ''}`);
  });
  return errs;
}

async function desktopPass(browser) {
  const page = await browser.newPage({ viewport: { width: 1000, height: 1100 } });
  page.setDefaultTimeout(TIMEOUT);
  const errs = watchErrors(page);
  const button = (name) => page.getByRole('button', { name, exact: true });

  await page.goto(pageUrl);
  check((await page.locator('h1').textContent()).trim() === 'What are you wondering about?', 'start: h1 text wrong');

  await button('Play the sample fox-camera adventure').click();
  check((await page.locator('h2').textContent()).trim() === 'Pip and the Copycat Camera Caper', 'teacher check: h2 wrong');
  check((await page.locator('#fact0, #fact1, #fact2, #fact3').count()) === 4, 'teacher check: expected 4 fact checkboxes');

  await button('Approve and start').click();

  for (let n = 1; n <= 4; n++) {
    const eyebrow = (await page.locator('.eyebrow').textContent()) || '';
    check(eyebrow.includes(`Chapter ${n} of 4`), `chapter ${n}: eyebrow was "${eyebrow}"`);
    check(!(await page.locator('.choices').isVisible()), `chapter ${n}: choices visible before search`);

    await button('Search for the clue').click();
    const clueText = ((await page.locator('.clue').textContent()) || '').trim();
    check((await page.locator('.clue').isVisible()) && clueText !== '', `chapter ${n}: clue not visible or empty`);
    check(await page.locator('.choices').isVisible(), `chapter ${n}: choices not visible after search`);

    const choices = page.locator('.choice');
    const texts = await choices.allTextContents();
    const goodIdx = texts.findIndex((t) => t.includes(GOOD[n - 1]));
    if (goodIdx < 0) throw new Error(`chapter ${n}: good choice not found among: ${JSON.stringify(texts)}`);
    const wrongIdx = texts.findIndex((_, i) => i !== goodIdx);

    await choices.nth(wrongIdx).click();
    check(await page.locator('.result.oops').isVisible(), `chapter ${n}: .result.oops not visible after wrong choice`);
    check(await choices.nth(wrongIdx).isDisabled(), `chapter ${n}: wrong choice not disabled`);

    await choices.nth(goodIdx).click();
    check(await page.locator('.result.good').isVisible(), `chapter ${n}: .result.good not visible after good choice`);

    const width = await page.$eval('#meterBar', (el) => el.style.width);
    check(width === `${(4 - n) * 25}%`, `chapter ${n}: meter width "${width}", expected "${(4 - n) * 25}%"`);

    await page.locator('.result.good button').click();
  }

  check((await page.locator('h2').textContent()).trim() === 'Captain Copycat is out of tricks!', 'finale: h2 wrong');
  await shot(page, 'finale.png');
  await button('Tell Pip what you think').click();

  await page.locator('#think').fill('The camera feels warmth, then checks shape, colour and movement.');
  await page.locator('[aria-label="Most interesting part"] button').first().click();
  await button('Make the family note').click();

  check((await page.locator('h2').textContent()).trim() === 'Note for the family', 'note: h2 wrong');
  const noteText = (await page.locator('.note-card').textContent()) || '';
  for (const s of [
    'Could a camera tell when a fox visits?',
    'The camera feels warmth, then checks shape, colour and movement.',
    'Solved 4 of 4 chapters and tried 4 other ideas',
  ]) {
    check(noteText.includes(s), `note: .note-card missing "${s}"`);
  }
  await shot(page, 'note.png');

  failures.push(...errs);
  await page.close();
}

async function phonePass(browser) {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  page.setDefaultTimeout(TIMEOUT);
  const errs = watchErrors(page);
  const button = (name) => page.getByRole('button', { name, exact: true });
  const scrollWidth = () => page.evaluate(() => document.documentElement.scrollWidth);

  await page.goto(pageUrl);
  check((await scrollWidth()) <= 390, `phone ask: scrollWidth ${await scrollWidth()} > 390`);
  await shot(page, 'phone-ask.png');

  await button('Play the sample fox-camera adventure').click();
  await button('Approve and start').click();
  await button('Search for the clue').click();
  check((await scrollWidth()) <= 390, `phone chapter: scrollWidth ${await scrollWidth()} > 390`);
  await shot(page, 'phone-chapter.png');

  failures.push(...errs);
  await page.close();
}

(async () => {
  let browser;
  try {
    browser = await chromium.launch();
    await desktopPass(browser);
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
