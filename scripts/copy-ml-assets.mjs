// Copies the on-device cut-out model into public/ (not stored in git). Its engine is bundled by Vite.
// Runs automatically after `npm install` / `npm ci`.
import { copyFileSync, mkdirSync } from 'node:fs';

const copies = [
  ['node_modules/@rmbg/model-u2netp/u2netp.onnx', 'public/models/u2netp.onnx'],
];
for (const [from, to] of copies) {
  mkdirSync(to.slice(0, to.lastIndexOf('/')), { recursive: true });
  copyFileSync(from, to);
}
console.log('Copied cut-out model into public/');
