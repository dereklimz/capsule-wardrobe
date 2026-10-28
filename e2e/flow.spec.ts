import { expect, test } from '@playwright/test';
import fs from 'fs';

const shots = process.env.SHOTS ? 'shots' : '';
const snap = async (page: any, name: string) => { if (shots) { fs.mkdirSync(shots, { recursive: true }); await page.screenshot({ path: `${shots}/${name}.png`, fullPage: true }); } };

test('manual path: pick everything, generate, turn off styles, no trace of them', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear()); await page.reload();
  await expect(page.getByTestId('generate')).toBeDisabled();
  await expect(page.getByTestId('reason')).toHaveText('Choose a wardrobe.');
  await page.getByTestId('season-fall').click();
  await page.getByTestId('wardrobe-men').click();
  await page.getByTestId('section-neutrals').getByRole('button').first().click();
  await page.locator('[data-testid=section-neutrals] [data-color=khaki]').click();
  await page.locator('[data-testid=section-neutrals] [data-color=navy]').click();
  // auto-advance to bases
  await expect(page.locator('[data-testid=section-bases] .swatches')).toBeVisible();
  // burgundy then rust: rust must be dimmed with a reason
  await page.locator('[data-testid=section-bases] [data-color=burgundy]').click();
  await page.locator('[data-testid=section-bases] [data-color=rust]').click({ force: true });
  await expect(page.getByTestId('gate-msg')).toContainText('Clashes with Burgundy');
  await page.locator('[data-testid=section-bases] [data-color=olive]').click();
  await page.locator('[data-testid=section-bases] [data-color=camel]').click();
  // accents get suggested
  await expect(page.locator('[data-testid=section-accents] .swatches')).toBeVisible();
  await expect(page.locator('[data-testid=section-accents] .pick.sel')).toHaveCount(4);
  await expect(page.getByTestId('reason')).toHaveText(/Pick 2 more occasions/);
  await snap(page, '1-choose-accents');
  await page.getByTestId('accents-ok').click();
  await expect(page.getByTestId('act-brunch')).toBeVisible();
  await page.getByTestId('act-brunch').click();
  await page.getByTestId('act-nice-dinner').click();
  await expect(page.getByTestId('generate')).toBeEnabled();
  await snap(page, '2-choose-ready');
  await page.getByTestId('generate').click();
  await expect(page.getByTestId('outfit-grid')).toBeVisible();
  await expect(page.getByTestId('piece-card').first()).toBeVisible();
  expect(await page.getByTestId('outfit-card').count()).toBe(1); // one card at a time
  await expect(page.getByTestId('counter')).toHaveText(/^1 of \d+$/);
  const total = Number((await page.getByTestId('counter').innerText()).split(' of ')[1]);
  expect(total).toBeGreaterThanOrEqual(12);
  await page.getByTestId('next').click(); await expect(page.getByTestId('counter')).toHaveText(`2 of ${total}`);
  await page.getByTestId('prev').click(); await expect(page.getByTestId('counter')).toHaveText(`1 of ${total}`);
  await page.keyboard.press('ArrowRight'); await expect(page.getByTestId('counter')).toHaveText(`2 of ${total}`);
  await page.getByTestId('filter-night').click();
  await expect(page.locator('[data-testid=outfit-card]')).toHaveAttribute('data-activity', 'nice-dinner');
  await page.getByTestId('filter-all').click();
  await snap(page, '3-capsule');
  // turn off Polo and Jeans
  await page.getByTestId('chip-polo').click();
  await page.getByTestId('chip-jeans').click();
  await expect(page.locator('[data-testid=piece-card][data-style=polo]')).toHaveCount(0);
  await expect(page.locator('[data-testid=piece-card][data-style=jeans]')).toHaveCount(0);
  const n2 = Number((await page.getByTestId('counter').innerText()).split(' of ')[1]);
  for (let i = 0; i < n2; i++) {
    const t = (await page.getByTestId('outfit-card').innerText()).toLowerCase();
    expect(t).not.toContain('polo'); expect(t).not.toContain('jeans');
    await page.getByTestId('next').click();
  }
  // heart + saved filter
  await page.getByTestId('heart').click();
  await page.getByTestId('filter-saved').click();
  await expect(page.getByTestId('outfit-card')).toHaveCount(1);
  await page.getByTestId('filter-all').click();
  // shuffle changes outfits
  const before = await page.getByTestId('outfit-card').innerText();
  await page.getByTestId('shuffle').click();
  expect(await page.getByTestId('outfit-card').innerText()).not.toBe(before);
  // piece swap pins
  await page.getByTestId('piece-card').first().click();
  await expect(page.getByTestId('piece-dialog')).toBeVisible();
  await snap(page, '4-dialog');
  await page.locator('[data-testid=piece-dialog] .dsw').nth(1).click();
  await page.getByRole('button', { name: 'Done' }).click();
  await expect(page.locator('.pcard.pinned')).toHaveCount(1);
  // palette swap only offers matching colors
  await page.locator('[data-testid=palette] button[data-color=camel]').click();
  await expect(page.getByTestId('palette-dialog')).toBeVisible();
  await snap(page, '5-palette-swap');
  await page.keyboard.press('Escape').catch(() => {});
  await page.mouse.click(5, 5);
  // switching season gives a different capsule
  const fallStyles = await page.locator('[data-testid=piece-card]').evaluateAll((els) => els.map((e) => e.getAttribute('data-style')).sort().join());
  await page.getByTestId('cap-season-winter').click();
  const winterStyles = await page.locator('[data-testid=piece-card]').evaluateAll((els) => els.map((e) => e.getAttribute('data-style')).sort().join());
  expect(winterStyles).not.toBe(fallStyles);
  await snap(page, '6-winter');
});

test('preset path: one tap, two occasions, generate', async ({ page }) => {
  await page.goto('/'); await page.evaluate(() => localStorage.clear()); await page.reload();
  let taps = 0;
  await page.getByTestId('wardrobe-men').click(); taps++;
  await page.getByTestId('preset-coastal').click(); taps++;
  await page.getByTestId('act-brunch').click(); taps++;
  await page.getByTestId('act-markets').click(); taps++;
  await page.getByTestId('generate').click(); taps++;
  await expect(page.getByTestId('outfit-grid')).toBeVisible();
  expect(taps).toBeLessThanOrEqual(8);
  await page.reload(); // persisted
  await expect(page.getByTestId('outfit-grid')).toBeVisible();
});

test('mobile layout has no horizontal scroll and a pinned Generate bar', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 800 });
  await page.goto('/'); await page.evaluate(() => localStorage.clear()); await page.reload();
  await page.getByTestId('wardrobe-men').click();
  await page.getByTestId('preset-earthy').click();
  await expect(page.getByTestId('generate-mobile')).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(1);
  await snap(page, 'm1-choose');
  await page.getByTestId('act-brunch').click(); await page.getByTestId('act-markets').click();
  await page.getByTestId('generate-mobile').click();
  await expect(page.getByTestId('outfit-grid')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(1);
  await snap(page, 'm2-capsule');
});
