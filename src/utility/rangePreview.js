// Range cells follow RimWorld's float-based GenRadial distance test.
// This models reach over open ground, not hit chance or line of sight.
export function weaponRange(weapon) {
  const value = weapon?.gun?.verbs?.[0]?.range;
  if (value === '' || value == null) return null;
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : null;
}

export function rangeCells(radius) {
  if (!Number.isFinite(radius) || radius < 0 || radius > 200) return [];
  const r = Math.fround(radius);
  const bound = Math.ceil(r);
  const cells = [];
  for (let y = -bound; y <= bound; y++) for (let x = -bound; x <= bound; x++) {
    if (Math.fround(Math.sqrt(x * x + y * y)) <= r) cells.push([x, y]);
  }
  return cells;
}

export function rangeOutline(radius) {
  const cells = rangeCells(radius);
  const inside = new Set(cells.map(([x, y]) => `${x},${y}`));
  const lines = [];
  for (const [x, y] of cells) {
    if (!inside.has(`${x},${y - 1}`)) lines.push(`M${x - .5},${y - .5}h1`);
    if (!inside.has(`${x + 1},${y}`)) lines.push(`M${x + .5},${y - .5}v1`);
    if (!inside.has(`${x},${y + 1}`)) lines.push(`M${x + .5},${y + .5}h-1`);
    if (!inside.has(`${x - 1},${y}`)) lines.push(`M${x - .5},${y + .5}v-1`);
  }
  return lines.join('');
}

export function targetReach(weapon, target) {
  const range = weaponRange(weapon);
  const distance = Math.hypot(target.x, target.y);
  const minRange = Math.max(0, Number(weapon?.gun?.verbs?.[0]?.minRange) || 0);
  const squared = target.x * target.x + target.y * target.y;
  const within = range != null && squared <= Math.fround(Math.fround(range) * Math.fround(range)) && distance >= minRange;
  return { distance, within, isOrigin: squared === 0, range, minRange };
}
