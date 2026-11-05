import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import JSZip from 'jszip';
import { extractPreviewArchive, validateShootingPlan } from './native-shooting.mjs';

test('native plans restrict coordinates and definition identifiers', () => {
  const plan = { colonist: { x: -3, y: 0 }, target: { x: 22, y: 0 }, weapon: 'Rifle_Weapon' };
  assert.equal(validateShootingPlan(plan), plan);
  assert.throws(() => validateShootingPlan({ ...plan, colonist: { x: 1000, y: 0 } }));
  assert.throws(() => validateShootingPlan({ ...plan, weapon: '../Rifle' }));
  assert.throws(() => validateShootingPlan({ ...plan, stock: true }));
  assert.throws(() => validateShootingPlan({ ...plan, task: 'accuracy', ranges: [0, 101], trials: 200 }));
  assert.throws(() => validateShootingPlan({ ...plan, task: 'accuracy', ranges: [12], trials: 10000 }));
  assert.throws(() => validateShootingPlan({ ...plan, scenario: '../save' }));
  assert.equal(validateShootingPlan({ ...plan, task: 'accuracy', scenario: 'white-room', ranges: [3, 12], trials: 200 }).task, 'accuracy');
});
test('preview archives cannot install assemblies or escape the temporary mod', async () => {
  const folder = fs.mkdtempSync(path.join(os.tmpdir(), 'rimmaker-preview-test-'));
  try {
    const zip = new JSZip(); zip.file('RimMakerPreview/Defs/ThingDefs/Test.xml', '<Defs/>');
    await extractPreviewArchive(await zip.generateAsync({ type: 'base64' }), folder);
    assert.equal(fs.readFileSync(path.join(folder, 'Defs/ThingDefs/Test.xml'), 'utf8'), '<Defs/>');
    const bad = new JSZip(); bad.file('RimMakerPreview/Assemblies/Bad.dll', 'no');
    await assert.rejects(extractPreviewArchive(await bad.generateAsync({ type: 'base64' }), folder), /XML, PNG/);
    const outside = new JSZip(); outside.file('OtherMod/Defs/ThingDefs/Test.xml', '<Defs/>');
    await assert.rejects(extractPreviewArchive(await outside.generateAsync({ type: 'base64' }), folder), /Unsafe/);
  } finally { fs.rmSync(folder, { recursive: true, force: true }); }
});
