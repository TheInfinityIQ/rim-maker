import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
const read = file => fs.readFileSync(new URL(file, import.meta.url));
const templates = JSON.parse(read('../src/utility/data/weaponTemplates.json'));
const media = JSON.parse(read('../src/utility/data/templateMedia.json'));
test('every template resolves its own texture and SoundDef samples', () => {
  for (const template of templates) {
    assert.ok(media.images[template.graphicData.texPath], template.defName + ' texture');
    const ids = [template.soundInteract, ...template.verbProperties.flatMap(verb => [verb.soundCast, verb.soundCastTail])].filter(Boolean);
    for (const id of ids) { assert.ok(media.sounds[id], `${template.defName}: ${id}`); assert.equal(media.sounds[id].definition, id); }
  }
});
test('reference media files exist and decoded audio contains non-silent PCM', () => {
  for (const row of Object.values(media.images)) {
    assert.match(row.file, /^[a-f0-9]{16}\.png$/);
    const png = read('../public/reference-media/' + row.file); assert.equal(png.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
  }
  for (const row of Object.values(media.sounds)) {
    assert.match(row.file, /^[a-f0-9]{16}\.wav$/);
    const wav = read('../public/reference-media/' + row.file);
    assert.equal(wav.subarray(0, 4).toString(), 'RIFF'); assert.equal(wav.subarray(8, 12).toString(), 'WAVE');
    assert.ok(wav.subarray(44).some(value => value), row.definition + ' is silent');
    assert.equal(crypto.createHash('sha256').update(wav).digest('hex'), row.sha256);
  }
});
