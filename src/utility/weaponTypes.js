import { WeaponRanged, StatBases, RecipeMaker, Verb } from '@/models/weapon';
import { definitionByName } from './gameDefinitions';
import templates from './data/weaponTemplates.json';

export const weaponKinds = [{ value: 'ranged', label: 'Ranged weapon' }, { value: 'melee', label: 'Melee weapon' }, { value: 'grenade', label: 'Grenade' }];
export const weaponTemplates = templates;
export const weaponKindLabel = weapon => weaponKinds.find(kind => kind.value === weapon.kind)?.label || 'Ranged weapon';
const list = object => Object.entries(object || {}).map(([defName, value]) => ({ defName, value }));
export function createWeapon(kind = 'ranged', templateId) {
  const weapon = new WeaponRanged();
  if (kind === 'ranged') return weapon;
  const template = templates.find(row => row.defName === templateId && row.kind === kind)
    || templates.find(row => row.defName === (kind === 'melee' ? 'MeleeWeapon_LongSword' : 'Weapon_GrenadeFrag'));
  if (!template || !['melee', 'grenade'].includes(kind)) throw new Error('Unknown weapon type or template.');
  weapon.kind = kind; weapon.templateDefName = template.defName; weapon.templatePack = template.pack;
  const gun = weapon.gun;
  Object.defineProperty(gun, 'xmlParent', { value: template.parent, writable: true, configurable: true });
  Object.assign(gun, structuredClone(template.extra));
  gun.description = template.description;
  gun.graphicData = { ...structuredClone(template.graphicData), textureFile: null };
  gun.statBases = Object.assign(new StatBases(), structuredClone(template.statBases));
  gun.costList = list(template.costList); gun.equippedStatOffsets = [];
  gun.recipeMaker = Object.assign(new RecipeMaker(), structuredClone(template.recipeMaker));
  gun.recipeMaker.skillRequirements = list(template.recipeMaker.skillRequirements);
  gun.soundInteract = template.soundInteract || '';
  gun.tools = structuredClone(template.tools || []);
  gun.verbs = template.verbProperties.map(properties => Object.assign(new Verb(), { soundCastTail: '', muzzleFlashScale: 0 }, structuredClone(properties)));
  if (kind === 'melee') weapon.projectileMode = 'none';
  else {
    const projectile = definitionByName('bullets', gun.verbs[0].defaultProjectile);
    if (!projectile) throw new Error('The grenade projectile is missing from the game catalog.');
    weapon.projectileMode = 'custom'; weapon.projectileKind = { Proj_GrenadeFrag: 'frag-grenade', Proj_GrenadeMolotov: 'molotov', Proj_GrenadeEMP: 'emp-grenade', Proj_GrenadeTox: 'tox-grenade' }[projectile.defName];
    weapon.bullet.thingClass = projectile.thingClass;
    weapon.bullet.projectile = structuredClone(projectile.projectile);
    weapon.bullet.graphicData = { ...structuredClone(projectile.graphicData), textureFile: null };
  }
  return weapon;
}
