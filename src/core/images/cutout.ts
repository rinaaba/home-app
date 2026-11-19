import type { InferenceSession } from 'onnxruntime-web';

/**
 * Free, on-device "product view": cut the main item out of a photo (remove the background)
 * and place it, centered, on a white square. Uses the small U²-Net model (Apache-2.0),
 * which runs in the browser: nothing is uploaded, no AI allowance is used.
 * The model and its runtime (about 20 MB) download the first time and are then kept on the device.
 */

const RES = 320; // the model's input size
let session: Promise<InferenceSession> | null = null;

function loadModel() {
  session ??= (async () => {
    const ort = await import('onnxruntime-web/wasm');
    ort.env.wasm.numThreads = 1; // multi-threading needs special server headers GitHub Pages doesn't send
    return ort.InferenceSession.create(`${import.meta.env.BASE_URL}models/u2netp.onnx`, { executionProviders: ['wasm'] });
  })().catch((e) => {
    session = null; // let a later photo try again
    throw e;
  });
  return session;
}

/** Start downloading the model early (e.g. when the add screen opens). */
export function prepareCutout() {
  void loadModel().catch(() => undefined);
}

/** Returns the product view, or null if the item couldn't be separated from the background. */
export async function cutOutItem(photo: Blob, size = 400): Promise<Blob | null> {
  const [sess, ort] = await Promise.all([loadModel(), import('onnxruntime-web/wasm')]);
  const bitmap = await createImageBitmap(photo);
  const W = bitmap.width;
  const H = bitmap.height;

  // 1. Model input: the photo squeezed to 320×320, normalized the way U²-Net was trained.
  const small = document.createElement('canvas');
  small.width = RES;
  small.height = RES;
  const sctx = small.getContext('2d')!;
  sctx.drawImage(bitmap, 0, 0, RES, RES);
  const px = sctx.getImageData(0, 0, RES, RES).data;
  let max = 1;
  for (let i = 0; i < px.length; i += 4) max = Math.max(max, px[i], px[i + 1], px[i + 2]);
  const mean = [0.485, 0.456, 0.406];
  const std = [0.229, 0.224, 0.225];
  const input = new Float32Array(3 * RES * RES);
  for (let p = 0; p < RES * RES; p++) {
    for (let c = 0; c < 3; c++) input[c * RES * RES + p] = (px[p * 4 + c] / max - mean[c]) / std[c];
  }

  // 2. Run the model: it returns how likely each pixel is part of the main item.
  const feeds = { [sess.inputNames[0]]: new ort.Tensor('float32', input, [1, 3, RES, RES]) };
  const out = (await sess.run(feeds))[sess.outputNames[0]].data as Float32Array;
  let lo = Infinity;
  let hi = -Infinity;
  for (const v of out) { if (v < lo) lo = v; if (v > hi) hi = v; }
  const range = hi - lo || 1;

  // 3. Turn that into a transparency mask, and find the item's box.
  const mask = new ImageData(RES, RES);
  let x0 = RES, y0 = RES, x1 = -1, y1 = -1, solid = 0;
  for (let p = 0; p < RES * RES; p++) {
    const a = (out[p] - lo) / range;
    mask.data[p * 4 + 3] = Math.round(a * 255);
    if (a > 0.5) {
      solid++;
      const x = p % RES, y = (p / RES) | 0;
      if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
    }
  }
  const share = solid / (RES * RES);
  // Nothing found, or "everything is the item": the background couldn't be separated.
  if (x1 < 0 || share < 0.02 || share > 0.92) { bitmap.close(); return null; }

  const maskCanvas = document.createElement('canvas');
  maskCanvas.width = RES;
  maskCanvas.height = RES;
  maskCanvas.getContext('2d')!.putImageData(mask, 0, 0);

  // 4. Cut out: the photo at full size, kept only where the mask says "item".
  const cut = document.createElement('canvas');
  cut.width = W;
  cut.height = H;
  const cctx = cut.getContext('2d')!;
  cctx.drawImage(bitmap, 0, 0);
  cctx.globalCompositeOperation = 'destination-in';
  cctx.imageSmoothingQuality = 'high';
  cctx.drawImage(maskCanvas, 0, 0, W, H);
  bitmap.close();

  // 5. Center it on a white square with a little room around it.
  const bx = (x0 / RES) * W, by = (y0 / RES) * H, bw = ((x1 - x0 + 1) / RES) * W, bh = ((y1 - y0 + 1) / RES) * H;
  const side = Math.max(bw, bh) * 1.14;
  const scale = size / side;
  const outCanvas = document.createElement('canvas');
  outCanvas.width = size;
  outCanvas.height = size;
  const octx = outCanvas.getContext('2d')!;
  octx.fillStyle = '#ffffff';
  octx.fillRect(0, 0, size, size);
  octx.imageSmoothingQuality = 'high';
  octx.drawImage(cut, size / 2 - (bx + bw / 2) * scale, size / 2 - (by + bh / 2) * scale, W * scale, H * scale);
  return new Promise((resolve) => outCanvas.toBlob((b) => resolve(b), 'image/jpeg', 0.85));
}
