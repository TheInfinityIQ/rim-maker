import { describe, it, expect } from 'vitest';
import JSZip from 'jszip';
import { WeaponRanged } from '@/models/weapon';
import { nativeShootingRequest, validateNativeReplay } from '../nativeShooting';
import { applyProjectilePreset } from '../projectileRules';

describe('native shooting requests', () => {
  it('uses the real mod exporter without modifying the editable weapon', async () => {
    const weapon = new WeaponRanged(); weapon.gun.label = 'Native rifle';
    weapon.gun.statBases.Mass = 3.5;
    applyProjectilePreset(weapon, 'inferno');
    const before = JSON.stringify(weapon);
    const request = await nativeShootingRequest(weapon, { x: 2, y: 0 }, { x: 22, y: 0 });
    expect(JSON.stringify(weapon)).toBe(before);
    const zip = await JSZip.loadAsync(request.archive, { base64: true });
    const xml = await zip.file('RimMakerPreview/Defs/ThingDefs/RimMakerPreviewWeapons_Ranged.xml').async('string');
    expect(xml).toContain(`<defName>${request.weapon}</defName>`);
    expect(xml).toContain('Projectile_Explosive');
    expect(xml).toContain('Flame');
    expect(xml).toContain('<description>Temporary RimMaker shooting preview.</description>');
    expect(request.colonist).toEqual({ x: 2, y: 0 });
    expect(request.target).toEqual({ x: 22, y: 0 });
    expect(request.expansions).toEqual([]);
  });
  it('explains a missing game-required mass before starting a native recording', async () => {
    await expect(nativeShootingRequest(new WeaponRanged(), { x: 0, y: 0 }, { x: 22, y: 0 })).rejects.toThrow('Set Weapon Mass');
  });
  it('requires native replay metadata and safe ordered image frames', () => {
    const replay = { engine: 'RimWorld', schema: 1, durationTicks: 4, frames: [{ tick: 0, image: 'data:image/jpeg;base64,AAAA' }, { tick: 4, image: 'data:image/jpeg;base64,AAAA' }] };
    expect(validateNativeReplay(replay)).toBe(replay);
    expect(() => validateNativeReplay({ ...replay, engine: 'Browser' })).toThrow();
    expect(() => validateNativeReplay({ ...replay, frames: [{ tick: 0, image: 'https://example.com/frame.jpg' }] })).toThrow();
    expect(() => validateNativeReplay({ ...replay, frames: [...replay.frames].reverse() })).toThrow();
    expect(() => validateNativeReplay({ ...replay, durationTicks: 10000 })).toThrow();
    expect(validateNativeReplay({ ...replay, video: 'rifle.webm', frames: [{ tick: 0 }] }).video).toBe('rifle.webm');
    expect(() => validateNativeReplay({ ...replay, video: '../../other.webm' })).toThrow();
  });
});
