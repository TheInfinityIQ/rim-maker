import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import JSZip from 'jszip';

async function setup(page) {
  await page.goto('#/weapon');
  await page.getByRole('button', { name: 'Add your first weapon' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Add weapons', exact: true }).click();
  await page.locator('#weaponName').fill('Engine rifle');
  await page.getByRole('tab', { name: 'Combat', exact: true }).click();
  await page.getByRole('button', { name: 'Stat Bases', exact: true }).click();
  await page.locator('#weaponMass').fill('3.5');
  return page.getByRole('region', { name: 'Shooting example', exact: true });
}

test('native rifle, explosive and inferno examples contain real visible frames and support replay controls', async ({ page }, info) => {
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  const shooting = await setup(page);
  for (const [button, type] of [['Assault rifle example', 'RimWorld.Bullet'], ['Explosive example', 'Projectile_Explosive'], ['Inferno example', 'Projectile_Explosive']]) {
    await shooting.getByRole('button', { name: button, exact: true }).click();
    await expect(shooting.getByTestId('native-replay')).toBeVisible();
    await expect(shooting).toContainText(type);
    const frame = shooting.getByTestId('native-replay-frame');
    await expect.poll(() => frame.evaluate(img => img.videoWidth || img.naturalWidth)).toBe(640);
    await expect.poll(() => frame.evaluate(img => img.tagName === 'VIDEO' ? img.readyState >= 2 : img.complete)).toBe(true);
    await shooting.getByRole('button', { name: 'Pause replay', exact: true }).click();
    // Catch the Unity camera regression that produced blank terrain despite running combat.
    const mean = await frame.evaluate(img => {
      const canvas = document.createElement('canvas'); canvas.width = canvas.height = 64;
      const context = canvas.getContext('2d'); context.drawImage(img, 0, 0, 64, 64);
      const pixels = context.getImageData(0, 0, 64, 64).data;
      let sum = 0; for (let i = 0; i < pixels.length; i += 4) sum += pixels[i] + pixels[i + 1] + pixels[i + 2];
      return sum / (64 * 64 * 3);
    });
    expect(mean).toBeGreaterThan(15);
    await shooting.getByRole('button', { name: 'Restart replay' }).click();
    await expect.poll(async () => Number(await frame.getAttribute('data-tick'))).toBeGreaterThan(0);
    await shooting.getByRole('button', { name: 'Pause replay' }).click();
    const beforeStep = Number(await frame.getAttribute('data-tick'));
    await shooting.getByRole('button', { name: 'Next replay frame' }).click();
    await expect(frame).toHaveAttribute('data-tick', String(beforeStep + 2));
    await shooting.getByRole('button', { name: 'Previous replay frame' }).click();
    await expect(frame).toHaveAttribute('data-tick', String(beforeStep));
    await shooting.getByRole('button', { name: 'First shot', exact: true }).click();
    await expect.poll(async () => Number(await frame.getAttribute('data-tick'))).toBeGreaterThan(50);
    await shooting.getByRole('button', { name: 'Pause replay' }).click();
  }
  await shooting.screenshot({ path: info.outputPath('native-shooting.png') });
  expect(errors).toEqual([]);
});

test('the local companion receives the current exported weapon and positions; edits mark recordings stale', async ({ page }) => {
  let request;
  const fixture = JSON.parse(fs.readFileSync('public/previews/shooting/rifle.json', 'utf8'));
  delete fixture.video;
  const image = 'data:image/jpeg;base64,' + fs.readFileSync('public/previews/firing-range.jpg').toString('base64');
  fixture.frames = [{ tick: 0, image }, { tick: 2, image }]; fixture.durationTicks = 2;
  await page.route('http://127.0.0.1:47328/**', async route => {
    if (route.request().method() === 'OPTIONS') { await route.fulfill({ status: 204, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*' } }); return; }
    expect(route.request().headers().authorization).toBe('Bearer test-key');
    if (route.request().url().endsWith('/shoot')) request = route.request().postDataJSON();
    await route.fulfill({ json: route.request().url().endsWith('/status') ? { engine: 'RimWorld', schema: 1 } : fixture });
  });
  const shooting = await setup(page);
  await shooting.getByRole('button', { name: 'Shoot your weapon in RimWorld', exact: true }).click();
  await shooting.getByLabel('Local companion connection key').fill('test-key');
  await shooting.getByRole('button', { name: 'Connect companion' }).click();
  await expect(shooting).toContainText('Connected locally');
  await shooting.getByRole('button', { name: 'Shoot target in RimWorld' }).click();
  await expect(shooting).toContainText('Your weapon · native RimWorld recording');
  expect(request.colonist).toEqual({ x: -78, y: 0 });
  expect(request.target).toEqual({ x: 22, y: 0 });
  const archive = await JSZip.loadAsync(request.archive, { base64: true });
  const xml = await archive.file('RimMakerPreview/Defs/ThingDefs/RimMakerPreviewWeapons_Ranged.xml').async('string');
  expect(xml).toContain(`<defName>${request.weapon}</defName>`);
  expect(xml).toContain('<speed>70</speed>');
  await page.locator('#weaponRange').fill('40');
  await expect(shooting).toContainText('changed after this recording');
  await shooting.getByLabel('Local companion connection key').fill('changed');
  await expect(shooting.getByRole('button', { name: 'Shoot target in RimWorld' })).toBeDisabled();
});

test('real companion records the edited weapon through the browser', async ({ page }, info) => {
  test.skip(!process.env.RIMMAKER_NATIVE_KEY, 'Optional local installed-game check.');
  test.setTimeout(360000);
  const shooting = await setup(page);
  await page.locator('#weaponRange').fill('110');
  await shooting.getByRole('button', { name: 'Shoot your weapon in RimWorld', exact: true }).click();
  await shooting.getByLabel('Local companion connection key').fill(process.env.RIMMAKER_NATIVE_KEY);
  await shooting.getByRole('button', { name: 'Connect companion' }).click();
  await expect(shooting).toContainText('Connected locally');
  await shooting.getByRole('button', { name: 'Shoot target in RimWorld' }).click();
  await expect(shooting.locator('[data-testid="native-replay"], [data-testid="native-preview-error"]')).toBeVisible({ timeout: 310000 });
  await expect(shooting.getByTestId('native-preview-error')).toHaveCount(0);
  await expect(shooting.getByTestId('native-replay')).toBeVisible();
  await expect(shooting).not.toContainText('Recording stopped at 30 game seconds');
  await expect(shooting).toContainText('1 projectiles observed');
  await shooting.getByRole('button', { name: 'Pause replay' }).click();
  await shooting.screenshot({ path: info.outputPath('actual-edited-weapon.png') });
});
