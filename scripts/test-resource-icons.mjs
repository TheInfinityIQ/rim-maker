import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
const read = relative => fs.readFileSync(new URL(relative, import.meta.url));
const catalog = JSON.parse(read('../src/utility/data/gameDefinitions.json'));
const manifest = JSON.parse(read('../src/utility/data/resource-icons.json'));

test('every catalog item has a captured game icon or an explicit unavailable record', () => {
  assert.equal(manifest.assemblySha256, catalog.assemblySha256);
  assert.equal(manifest.renderer, 'RimWorld Widgets.DefIcon');
  for (const pack of Object.values(catalog.packs)) for (const thing of pack.things) {
    const icon = manifest.icons[thing.defName];
    assert.ok(icon || manifest.missing.includes(thing.defName), thing.defName);
    if (!icon) continue;
    assert.equal(icon.source, thing.source);
    assert.equal(icon.pack, thing.pack);
    assert.match(icon.file, /^[a-f0-9]{16}\.png$/);
    const png = read('../public/resources/' + icon.file);
    assert.equal(png.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
    assert.equal(png.readUInt32BE(16), 64);
    assert.equal(png.readUInt32BE(20), 64);
    assert.equal(crypto.createHash('sha256').update(png).digest('hex'), icon.sha256);
  }
  assert.ok(manifest.icons.Steel);
  assert.ok(manifest.icons.ComponentIndustrial);
});
