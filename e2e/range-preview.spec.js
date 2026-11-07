import { test, expect } from '@playwright/test';
import fs from 'node:fs';

const media = JSON.parse(fs.readFileSync('src/utility/data/templateMedia.json', 'utf8'));
const shotPattern = '**/reference-media/' + media.sounds.Shot_AssaultRifle.file;
async function editRange(page, value) { await page.getByRole('tab', { name: 'Attacks', exact: true }).click(); await page.locator('#weaponRange').fill(value); await page.getByRole('tab', { name: 'Preview', exact: true }).click(); }
const map = JSON.parse(fs.readFileSync('src/components/weapon-preview/firing-range.json', 'utf8'));
const image = fs.readFileSync('public/previews/assault-rifle.png');
const sound = fs.readFileSync('public/previews/assault-rifle-shot.wav');
async function setup(page) {
  await page.goto('#/weapon');
  await page.getByRole('button', { name: 'Add your first weapon' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Add weapons', exact: true }).click();
  await page.locator('#weaponName').fill('Preview rifle');
  await page.getByRole('tab', { name: 'Preview', exact: true }).click();
  return page.getByRole('region', { name: 'Weapon preview', exact: true });
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
  await expect(preview.getByTestId('preview-texture-name')).toHaveText('assault rifle');
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
  // The large accessible marker must not swallow a short move after pickup.
  await preview.getByRole('button', { name: 'Pick up colonist', exact: true }).click();
  await clickWorld(page, scene, map.colonistStart.x + 5, map.colonistStart.y);
  await expect(preview.getByTestId('preview-sandbag-distance')).toHaveText('95 tiles from outer sandbag');
  await preview.getByRole('button', { name: 'Reset position', exact: true }).click();

  await preview.getByRole('button', { name: 'Pick up colonist', exact: true }).click();
  await clickWorld(page, scene, map.sandbag.x - 20, map.sandbag.y);
  await expect(preview.getByTestId('preview-sandbag-distance')).toHaveText('20 tiles from outer sandbag');
  await editRange(page, '19.9');
  await expect(preview).toContainText('Outside range');
  await editRange(page, '20');
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
  await page.getByRole('tab', { name: 'Weapon', exact: true }).click();
  await page.locator('#gunGraphicData input[type=file]').setInputFiles({ name: 'custom-rifle.png', mimeType: 'image/png', buffer: image });
  await page.getByRole('tab', { name: 'Attacks', exact: true }).click();
  await page.locator('#weaponGunSound input[type=file]').setInputFiles({ name: 'broken.wav', mimeType: 'audio/wav', buffer: Buffer.from('not an audio file') });
  await page.getByRole('tab', { name: 'Preview', exact: true }).click();
  await expect(preview.getByTestId('preview-texture-name')).toHaveText('custom-rifle.png');
  await expect(preview.getByTestId('preview-equipped-texture')).toHaveAttribute('href', /^blob:/);
  await preview.getByRole('button', { name: 'Test fire', exact: true }).click();
  await expect(preview.getByTestId('preview-sound-error')).toBeVisible();

  await page.getByRole('tab', { name: 'Weapon', exact: true }).click();
  await page.getByRole('tab', { name: 'Attacks', exact: true }).click();
  await page.locator('#weaponGunSound input[type=file]').setInputFiles({ name: 'custom-shot.wav', mimeType: 'audio/wav', buffer: sound });
  await page.getByRole('tab', { name: 'Preview', exact: true }).click();
  await expect(preview.getByTestId('preview-shot-name')).toHaveText('custom-shot.wav');
  await expect(preview.getByTestId('preview-sound-error')).toHaveCount(0);
  await preview.getByRole('button', { name: 'Test fire', exact: true }).click();
  await expect(preview.getByTestId('preview-sound-state')).toHaveText('Playing');
  await preview.getByRole('button', { name: 'Stop sound', exact: true }).click();
  await page.getByRole('tab', { name: 'Weapon', exact: true }).click();
  await page.getByRole('tab', { name: 'Attacks', exact: true }).click();
  await page.locator('#weaponGunSound').getByRole('button', { name: 'Remove File', exact: true }).click();
  await page.getByRole('tab', { name: 'Weapon', exact: true }).click();
  await page.getByRole('region', { name: 'Weapon graphic', exact: true }).getByRole('button', { name: 'Use template texture', exact: true }).click();
  await page.getByRole('tab', { name: 'Preview', exact: true }).click();
  await expect(preview.getByTestId('preview-texture-name')).toHaveText('assault rifle');
  await expect(preview.getByTestId('preview-shot-name')).toHaveText('Shot_AssaultRifle');
  // Removing and then choosing the same file must still fire the input change event.
  await page.getByRole('tab', { name: 'Weapon', exact: true }).click();
  await page.getByRole('tab', { name: 'Attacks', exact: true }).click();
  await page.locator('#weaponGunSound input[type=file]').setInputFiles({ name: 'custom-shot.wav', mimeType: 'audio/wav', buffer: sound });
  await page.getByRole('tab', { name: 'Preview', exact: true }).click();
  await expect(preview.getByTestId('preview-shot-name')).toHaveText('custom-shot.wav');
  expect(errors).toEqual([]);
});

test('sound and firing buttons cancel loading in place and handling audio toggles independently', async ({ page }) => {
  const preview = await setup(page);
  let release, requested;
  const requestStarted = new Promise(resolve => { requested = resolve; });
  const gate = new Promise(resolve => { release = resolve; });
  await page.route(shotPattern, async route => {
    requested(); await gate; await route.fulfill({ body: sound, contentType: 'audio/wav' });
  });
  const button = preview.getByRole('button', { name: 'Test fire', exact: true });
  const element = await button.elementHandle();
  await button.click(); await requestStarted;
  await expect(preview.getByTestId('preview-sound-state')).toHaveText('Loading sound…');
  const stop = preview.getByRole('button', { name: 'Stop sound', exact: true });
  expect(await stop.evaluate((node, original) => node === original, element)).toBe(true);
  await expect(stop).toBeFocused();
  await stop.press('Enter');
  await expect(preview.getByTestId('preview-sound-state')).toHaveText('Ready');
  release();
  await preview.getByRole('button', { name: 'Handle weapon', exact: true }).click();
  const handling = preview.getByRole('button', { name: 'Stop handling sound', exact: true });
  await expect(handling).toBeEnabled();
  await handling.click();
  await expect(preview.getByTestId('preview-sound-state')).toHaveText('Ready');
  await preview.getByRole('button', { name: 'White room', exact: true }).click();
  let releaseShot, requestedShot;
  const shotRequested = new Promise(resolve => { requestedShot = resolve; });
  const shotGate = new Promise(resolve => { releaseShot = resolve; });
  // Changing the clip clears the audio cache, then delay the replacement to exercise firing cancellation.
  await page.getByRole('tab', { name: 'Weapon', exact: true }).click();
  await page.getByRole('tab', { name: 'Attacks', exact: true }).click();
  await page.locator('#weaponGunSound input[type=file]').setInputFiles({ name: 'slow-shot.wav', mimeType: 'audio/wav', buffer: sound });
  await page.getByRole('tab', { name: 'Attacks', exact: true }).click();
  await page.locator('#weaponGunSound').getByRole('button', { name: 'Remove File', exact: true }).click();
  await page.getByRole('tab', { name: 'Preview', exact: true }).click();
  await page.unroute(shotPattern);
  await page.route(shotPattern, async route => { requestedShot(); await shotGate; await route.fulfill({ body: sound, contentType: 'audio/wav' }); });
  await preview.getByRole('button', { name: 'Fire weapon', exact: true }).click();
  await shotRequested;
  await expect(preview.getByTestId('visual-fire-state')).toHaveText('Preparing sound…');
  await preview.getByRole('button', { name: 'Stop firing', exact: true }).click();
  releaseShot();
  await expect(preview.getByTestId('visual-fire-state')).toHaveText('Ready');
  await expect(preview.getByTestId('preview-projectile')).toHaveCount(0);
  await expect(preview.getByTestId('preview-sound-state')).toHaveText('Ready');
});
