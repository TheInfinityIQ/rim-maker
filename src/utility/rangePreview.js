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

export function targetReach(weapon, target, origin = { x: 0, y: 0 }) {
  const range = weaponRange(weapon);
  const dx = target.x - origin.x, dy = target.y - origin.y;
  const distance = Math.hypot(dx, dy);
  const minRange = Math.max(0, Number(weapon?.gun?.verbs?.[0]?.minRange) || 0);
  const squared = dx * dx + dy * dy;
  const within = range != null && squared <= Math.fround(Math.fround(range) * Math.fround(range)) && distance >= minRange;
  return { distance, within, isOrigin: squared === 0, range, minRange };
}

export function placementCell(point, bounds, blocked) {
  const x = Math.round(point.x), y = Math.round(point.y);
  const valid = Number.isFinite(x) && Number.isFinite(y) && x >= bounds.minX && x <= bounds.maxX && y >= bounds.minY && y <= bounds.maxY && !blocked.has(`${x},${y}`);
  return { x, y, valid };
}

export function overviewCamera(start, anchor, bounds) {
  // Include the colonist, the defensive line, and the village behind it.
  const left = Math.max(bounds.minX, start.x - 15);
  const right = Math.min(bounds.maxX, anchor.x + 80);
  return { x: (left + right) / 2, y: anchor.y, extent: Math.max(45, (right - left) / 2 + 4) };
}
