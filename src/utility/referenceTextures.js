import templates from './data/templateMedia.json';
import projectiles from '@/components/weapon-preview/projectile-textures.json';

export function referenceTextureUrl(path) {
  if (templates.images[path]) return `${import.meta.env.BASE_URL}reference-media/${templates.images[path].file}`;
  if (projectiles[path]) return `${import.meta.env.BASE_URL}previews/projectiles/${projectiles[path].file}`;
  return '';
}
