import { afterEach, describe, expect, it, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import PrimeVue from 'primevue/config';
import FormRangedWeapon from '../FormRangedWeapon.vue';
import { WeaponRanged } from '@/models/weapon';
import { buildModArchive } from '@/utility/scripts/buildXML';
import ColonyConsole from '@/theme/colonyConsole';
import { createPinia } from 'pinia';
import { applyProjectilePreset } from '@/utility/projectileRules';

let wrapper;
// jsdom does not implement the layout observer used by PrimeVue's scrollable tabs.
vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} });
vi.stubGlobal('matchMedia', () => ({ matches: false, addEventListener() {}, removeEventListener() {} }));
afterEach(() => { wrapper?.unmount(); document.body.innerHTML = ''; });

function editor(weapon) {
  wrapper = mount(FormRangedWeapon, {
    props: { weapon }, attachTo: document.body,
    global: { plugins: [createPinia(), [PrimeVue, { theme: { preset: ColonyConsole } }]], directives: { tooltip: () => {} } },
  });
  return wrapper;
}

describe('Colony Console workbench', () => {
  it('keeps omitted inferno damage as the game default when numeric controls mount', () => {
    const weapon = new WeaponRanged();
    applyProjectilePreset(weapon, 'inferno');
    editor(weapon);
    expect(weapon.bullet.projectile.damageAmountBase).toBeUndefined();
    expect(wrapper.get('#bulletProjectileDamageAmountBase').element.value).toBe('');
    expect(weapon.bullet.projectile.explosionRadius).toBe(2.4);
  });
  it('retains entered weapon values across PrimeVue tabs and keeps every form section', async () => {
    const weapon = new WeaponRanged();
    editor(weapon);
    await wrapper.get('#weaponName').setValue('Frontier rifle');
    await wrapper.findAll('[role="tab"]')[1].trigger('click');
    await wrapper.get('#weaponRange').setValue('42');
    await wrapper.findAll('[role="tab"]')[2].trigger('click');
    expect(wrapper.text()).toContain('Cost List');
    expect(wrapper.text()).toContain('Recipe Skill Requirements');
    await wrapper.findAll('[role="tab"]')[0].trigger('click');
    expect(wrapper.get('#weaponName').element.value).toBe('Frontier rifle');
    expect(weapon.gun.verbs[0].range).toBe('42');
    for (const section of ['Details', 'Stat Offsets', 'Verbs', 'Tools', 'Stat Bases', 'Bullet', 'Cost List', 'Recipe Skill Requirements', 'Textures & sounds']) {
      expect(wrapper.text()).toContain(section);
    }
  });

  it('retains interaction sound uploads when switching settings', async () => {
    const weapon = new WeaponRanged();
    editor(weapon);
    await wrapper.findAll('[role="tab"]')[3].trigger('click');
    const input = wrapper.findAll('input[type="file"]')[4];
    const sound = new File(['audio'], 'rifle-interact.wav', { type: 'audio/wav' });
    Object.defineProperty(input.element, 'files', { value: [sound] });
    await input.trigger('change');
    await wrapper.findAll('[role="tab"]')[0].trigger('click');
    await wrapper.findAll('[role="tab"]')[3].trigger('click');
    expect(weapon.gun.soundInteractFile).toBe(sound);
    expect(wrapper.html()).toContain('rifle-interact.wav');
  });

  it('exports named mod metadata and edited values without consuming editable cost lists', async () => {
    const weapon = new WeaponRanged();
    weapon.gun.label = 'Frontier rifle';
    weapon.gun.defName = 'FrontierArmory_FrontierRifle';
    weapon.gun.verbs[0].range = 42;
    for (let attempt = 0; attempt < 2; attempt++) {
      const archive = buildModArchive([weapon], [], 'FrontierArmory');
      const about = await archive.file('FrontierArmory/About/About.xml').async('string');
      const xml = await archive.file('FrontierArmory/Defs/ThingDefs/FrontierArmoryWeapons_Ranged.xml').async('string');
      const parsed = new DOMParser().parseFromString(about, 'application/xml');
      expect(parsed.querySelector('parsererror')).toBeNull();
      expect(parsed.querySelector('name').textContent).toBe('FrontierArmory');
      expect(xml).toContain('<range>42</range>');
      expect(xml).toContain('<Steel>60</Steel>');
      expect(Array.isArray(weapon.gun.costList)).toBe(true);
    }
  });
});
