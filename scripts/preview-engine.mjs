import http from 'node:http';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { runNativeShooting } from './native-shooting.mjs';

const example = process.argv.find(arg => arg.startsWith('--example='))?.slice(10);
const pack = process.argv.find(arg => arg.startsWith('--pack='))?.slice(7);
function publishExample(name, result) {
  const binaries = path.resolve('../.rimmaker-tools/python/imageio_ffmpeg/binaries');
  const ffmpeg = process.env.FFMPEG_EXE || (fs.existsSync(binaries) && path.join(binaries, fs.readdirSync(binaries).find(file => /^ffmpeg.*\.exe$/.test(file)) || 'missing'));
  if (!ffmpeg || !fs.existsSync(ffmpeg)) throw new Error('Set FFMPEG_EXE to FFmpeg to compress the public example. The full native recording is saved in ' + result.output);
  fs.mkdirSync('public/previews/shooting', { recursive: true });
  const list = path.join(result.output, 'video-frames.txt');
  fs.writeFileSync(list, result.replay.frames.map(frame => `file '${path.join(result.output, 'frame-' + String(frame.tick).padStart(4, '0') + '.jpg').replace(/\\/g, '/')}'\nduration ${2 / 60}`).join('\n'));
  const video = path.resolve('public/previews/shooting', name + '.webm');
  const encoded = spawnSync(ffmpeg, ['-hide_banner', '-loglevel', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', list, '-r', '30', '-c:v', 'libvpx-vp9', '-crf', '18', '-b:v', '0', '-row-mt', '1', '-pix_fmt', 'yuv420p', '-an', video], { encoding: 'utf8', windowsHide: true });
  if (encoded.status !== 0) throw new Error(encoded.stderr || 'Video encoding failed.');
  const replay = { ...result.replay, video: name + '.webm', frames: result.replay.frames.map(({ tick }) => ({ tick })) };
  fs.writeFileSync(path.join('public/previews/shooting', name + '.json'), JSON.stringify(replay));
}
if (pack) {
  if (!['rifle', 'rocket', 'inferno'].includes(pack)) throw new Error('Invalid example name.');
  const input = process.argv.find(arg => arg.startsWith('--input='))?.slice(8);
  if (!input) throw new Error('Supply --input=path/to/shooting-result-folder.');
  publishExample(pack, { output: path.resolve(input), replay: JSON.parse(fs.readFileSync(path.join(input, 'replay.json'), 'utf8')) });
} else if (example || process.argv.includes('--compile-only')) {
  const names = { rifle: 'Gun_AssaultRifle', rocket: 'Gun_TripleRocket', inferno: 'Gun_InfernoCannon' };
  if (example && !names[example]) throw new Error('Use --example=rifle, rocket, or inferno.');
  const result = await runNativeShooting({ stock: true, weapon: names[example || 'rifle'], colonist: { x: -3, y: 0 }, target: { x: 22, y: 0 } }, { compileOnly: process.argv.includes('--compile-only') });
  console.log(result.output || 'Native shooting recorder compiled against the installed game.');
  if (example) {
    publishExample(example, result);
  }
} else {
  const token = crypto.randomBytes(24).toString('hex');
  const origins = new Set(['https://theinfinityiq.github.io', 'http://127.0.0.1:4173', 'http://localhost:4173', 'http://127.0.0.1:5173', 'http://localhost:5173']);
  let busy = false;
  const server = http.createServer(async (request, response) => {
    const origin = request.headers.origin;
    if (origin && !origins.has(origin)) { response.writeHead(403).end(); return; }
    if (origin) response.setHeader('Access-Control-Allow-Origin', origin);
    response.setHeader('Vary', 'Origin'); response.setHeader('Cache-Control', 'no-store');
    response.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    response.setHeader('Access-Control-Allow-Private-Network', 'true');
    const send = (code, value) => { response.writeHead(code, { 'Content-Type': 'application/json' }); response.end(JSON.stringify(value)); };
    if (request.method === 'OPTIONS') { response.writeHead(204).end(); return; }
    if (request.headers.authorization !== 'Bearer ' + token) { send(401, { error: 'Paste the connection key printed by the local companion.' }); return; }
    if (request.method === 'GET' && request.url === '/status') { send(200, { engine: 'RimWorld', schema: 1, busy }); return; }
    if (request.method !== 'POST' || request.url !== '/shoot') { send(404, { error: 'Unknown preview endpoint.' }); return; }
    if (busy) { send(409, { error: 'The companion is already recording a shot. Wait for it to finish.' }); return; }
    busy = true;
    try {
      const chunks = []; let size = 0;
      for await (const chunk of request) { size += chunk.length; if (size > 45 * 1024 * 1024) throw new Error('Preview request exceeds 45 MB.'); chunks.push(chunk); }
      const plan = JSON.parse(Buffer.concat(chunks).toString());
      console.log('Recording a shot in an isolated RimWorld profile…');
      const { replay, output } = await runNativeShooting(plan);
      console.log('Recording complete: ' + output);
      send(200, replay);
    } catch (error) { send(400, { error: error.message }); }
    finally { busy = false; }
  });
  server.requestTimeout = 360000;
  server.listen(47328, '127.0.0.1', () => {
    console.log('RimMaker native shooting companion: http://127.0.0.1:47328');
    console.log('Connection key: ' + token);
    console.log('Paste this key under Combat → Verbs → Shoot in RimWorld. Keep this terminal open.');
    console.log('Each shot launches a separate, disposable game profile. Your saves and active mods are unchanged.');
  });
}
