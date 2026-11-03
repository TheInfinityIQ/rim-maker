import { test, expect } from '@playwright/test';
import fs from 'node:fs';

const map = JSON.parse(fs.readFileSync('src/components/weapon-preview/firing-range.json', 'utf8'));
const image = fs.readFileSync('public/previews/assault-rifle.png');
const sound = fs.readFileSync('public/previews/assault-rifle-shot.wav');
async function setup(page) {
  await page.goto('#/weapon');
  await page.getByRole('button', { name: 'Add your first weapon' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Add weapons', exact: true }).click();
  await page.locator('#weaponName').fill('Preview rifle');
  await page.getByRole('tab', { name: 'Combat', exact: true }).click();
  return page.getByRole('region', { name: 'Verbs', exact: true }).getByRole('region', { name: 'Weapon preview', exact: true });
}
async function clickWorld(page, scene, x, y, touch = false) {
  const svg = scene.locator('svg').first();
  await svg.scrollIntoViewIfNeeded();
  const [left, top, width, height] = (await svg.getAttribute('viewBox')).split(' ').map(Number);
  const box = await svg.boundingBox();
  const clientX = box.x + (x - left) / width * box.width, clientY = box.y + (y - top) / height * box.height;
  if (touch) await page.touchscreen.tap(clientX, clientY); else await page.mouse.click(clientX, clientY);
}

test('raid scene supports dragging, placing, blocked cells, range checks, and resetting to 100 tiles', async ({ page }, info) => {
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  const preview = await setup(page);
  const scene = preview.getByRole('group', { name: 'Weapon range scene', exact: true });
  const colonist = preview.getByTestId('preview-colonist');
  await expect(preview.getByTestId('preview-sandbag-distance')).toHaveText('100 tiles from outer sandbag');
  await expect(colonist).toHaveAttribute('data-x', String(map.colonistStart.x));
  await expect(preview.getByTestId('preview-texture-name')).toHaveText('Assault rifle');
  await expect(preview.getByTestId('preview-shot-name')).toHaveText('Shot_AssaultRifle');
  await preview.screenshot({ path: info.outputPath('raid-village-start.png') });
  await scene.scrollIntoViewIfNeeded();
  const box = await colonist.boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2 + 70, box.y + box.height / 2, { steps: 12 });
  await page.mouse.up();
  await expect.poll(async () => Number(await colonist.getAttribute('data-x'))).toBeGreaterThan(map.colonistStart.x);
  await preview.getByRole('button', { name: 'Reset position', exact: true }).click();
  await expect(preview.getByTestId('preview-sandbag-distance')).toHaveText('100 tiles from outer sandbag');
  await scene.focus(); await scene.press('Shift+ArrowRight');
  await expect(preview.getByTestId('preview-sandbag-distance')).toHaveText('95 tiles from outer sandbag');
  await preview.getByRole('button', { name: 'Reset position', exact: true }).click();

  await preview.getByRole('button', { name: 'Pick up colonist', exact: true }).click();
  await clickWorld(page, scene, map.sandbag.x - 20, map.sandbag.y);
  await expect(preview.getByTestId('preview-sandbag-distance')).toHaveText('20 tiles from outer sandbag');
  await page.locator('#weaponRange').fill('19.9');
  await expect(preview).toContainText('Outside range');
  await page.locator('#weaponRange').fill('20');
  await expect(preview).toContainText('Within range');
  await expect(preview.getByTestId('preview-range-outline')).toHaveAttribute('data-radius', '20');
  await preview.getByRole('button', { name: 'Pick up colonist', exact: true }).click();
  const blocked = map.blocked.find(([x, y]) => x >= map.sandbag.x && Math.abs(y) < 25);
  await clickWorld(page, scene, ...blocked);
  await expect(preview).toContainText('Choose open ground');
  await expect(preview.getByTestId('preview-sandbag-distance')).toHaveText('20 tiles from outer sandbag');
  await preview.getByRole('button', { name: 'Cancel move', exact: true }).click();
  await preview.getByRole('button', { name: 'Zoom in', exact: true }).click();
  await preview.getByRole('button', { name: 'Village overview', exact: true }).click();
  await preview.getByRole('button', { name: 'View village', exact: true }).click();
  await preview.screenshot({ path: info.outputPath('raid-village-preview.png') });

  await page.setViewportSize({ width: 390, height: 844 });
  await preview.getByRole('button', { name: 'Reset position', exact: true }).click();
  await preview.getByRole('button', { name: 'Pick up colonist', exact: true }).click();
  await clickWorld(page, scene, map.sandbag.x - 30, map.sandbag.y);
  await expect(preview.getByTestId('preview-sandbag-distance')).toHaveText('30 tiles from outer sandbag');
  await page.screenshot({ path: info.outputPath('raid-village-mobile.png'), fullPage: true });
  expect(errors).toEqual([]);
});

test.describe('touch placement', () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  test('a colonist can be picked up, placed closer, and reset using touch', async ({ page }) => {
    const preview = await setup(page);
    const scene = preview.getByRole('group', { name: 'Weapon range scene', exact: true });
    await preview.getByRole('button', { name: 'Pick up colonist', exact: true }).tap();
    await clickWorld(page, scene, map.sandbag.x - 30, map.sandbag.y, true);
    await expect(preview.getByTestId('preview-sandbag-distance')).toHaveText('30 tiles from outer sandbag');
    await preview.getByRole('button', { name: 'Reset position', exact: true }).tap();
    await expect(preview.getByTestId('preview-sandbag-distance')).toHaveText('100 tiles from outer sandbag');
  });
});

test('assault-rifle audio plays and uploaded texture/sound replacements drive the preview', async ({ page }) => {
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  const preview = await setup(page);
  await preview.getByRole('button', { name: 'Test fire', exact: true }).click();
  await expect(preview.getByTestId('preview-sound-state')).toHaveText('Playing');
  await preview.getByRole('button', { name: 'Stop sound', exact: true }).click();
  await expect(preview.getByTestId('preview-sound-state')).toHaveText('Ready');
  await page.getByRole('tab', { name: 'Files', exact: true }).click();
  await page.locator('#gunGraphicData input[type=file]').setInputFiles({ name: 'custom-rifle.png', mimeType: 'image/png', buffer: image });
  await page.locator('#weaponGunSound input[type=file]').setInputFiles({ name: 'broken.wav', mimeType: 'audio/wav', buffer: Buffer.from('not an audio file') });
  await page.getByRole('tab', { name: 'Combat', exact: true }).click();
  await expect(preview.getByTestId('preview-texture-name')).toHaveText('custom-rifle.png');
  await expect(preview.getByTestId('preview-equipped-texture')).toHaveAttribute('href', /^blob:/);
  await preview.getByRole('button', { name: 'Test fire', exact: true }).click();
  await expect(preview.getByTestId('preview-sound-error')).toBeVisible();

  await page.getByRole('tab', { name: 'Files', exact: true }).click();
  await page.locator('#weaponGunSound input[type=file]').setInputFiles({ name: 'custom-shot.wav', mimeType: 'audio/wav', buffer: sound });
  await page.getByRole('tab', { name: 'Combat', exact: true }).click();
  await expect(preview.getByTestId('preview-shot-name')).toHaveText('custom-shot.wav');
  await expect(preview.getByTestId('preview-sound-error')).toHaveCount(0);
  await preview.getByRole('button', { name: 'Test fire', exact: true }).click();
  await expect(preview.getByTestId('preview-sound-state')).toHaveText('Playing');
  await preview.getByRole('button', { name: 'Stop sound', exact: true }).click();
  await page.getByRole('tab', { name: 'Files', exact: true }).click();
  await page.locator('#weaponGunSound').getByRole('button', { name: 'Remove File', exact: true }).click();
  await page.locator('#gunGraphicData').getByRole('button', { name: 'Use assault rifle', exact: true }).click();
  await page.getByRole('tab', { name: 'Combat', exact: true }).click();
  await expect(preview.getByTestId('preview-texture-name')).toHaveText('Assault rifle');
  await expect(preview.getByTestId('preview-shot-name')).toHaveText('Shot_AssaultRifle');
  expect(errors).toEqual([]);
});
